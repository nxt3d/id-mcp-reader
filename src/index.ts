#!/usr/bin/env node

/**
 * Copyright (c) 2025 @nxt3d (Prem Makeig)
 * 
 * MCP Server for ID resolution via ENS
 * Converts id:core.subname format to subname.core.eth and resolves root-context text records
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createPublicClient, http, namehash } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { toolMetadata } from './toolMetadata.js';

// ENS resolver contract ABI (minimal for text records)
const ensResolverAbi = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Global state for namespace management
let currentNamespace: string | null = null;

class IdMcpServer {
  private server: Server;
  private publicClient;

  constructor() {
    this.server = new Server(
      {
        name: "id-mcp-reader",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Configure RPC client - will check for placeholder RPC when tools are used
const rpcUrl = process.env.RPC_URL || '<YOUR-RPC-URL-HERE>';
    
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "id",
          description: toolMetadata.id,
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID to resolve (e.g., id:core.subname)",
              },
              start_line: {
                type: "number",
                description: "Line number to start reading from (default: 0)",
                default: 0,
              },
            },
            required: ["id"],
          },
        },
        {
          name: "idx",
          description: toolMetadata.idx,
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID to resolve and execute (e.g., idx:core.subname or id:core.subname)",
              },
              start_line: {
                type: "number",
                description: "Line number to start reading from (default: 0)",
                default: 0,
              },
            },
            required: ["id"],
          },
        },
        {
          name: "id_set_namespace",
          description: toolMetadata.id_set_namespace,
          inputSchema: {
            type: "object",
            properties: {
              namespace: {
                type: "string",
                description: "The namespace to set (e.g., id:core.username)",
              },
            },
            required: ["namespace"],
          },
        },
        {
          name: "id_get_namespace",
          description: toolMetadata.id_get_namespace,
          inputSchema: {
            type: "object",
            properties: {},
          },
        },

      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "id":
            return await this.handleIdTool(args as { id: string; start_line?: number });
          case "idx":
            return await this.handleIdxTool(args as { id: string; start_line?: number });
          case "id_set_namespace":
            return await this.handleSetNamespace(args as { namespace: string });
          case "id_get_namespace":
            return await this.handleGetNamespace();

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error in tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Convert ID format to ENS name
   * id:core.subname -> subname.core.eth
   */
  private idToEnsName(id: string): string {
    // Remove id: or idx: prefix
    const cleanId = id.replace(/^(id:|idx:)/, '');
    
    // Handle shorthand format with apostrophe
    let resolvedId = cleanId;
    if (cleanId.startsWith("'")) {
      if (!currentNamespace) {
        throw new McpError(ErrorCode.InvalidParams, "No namespace set for shorthand ID. Use id_set_namespace first.");
      }
      // Replace the apostrophe with the namespace content
      const namespaceContent = currentNamespace.replace(/^id:/, '');
      resolvedId = namespaceContent + '.' + cleanId.substring(1);
    }

    // Split the ID and reverse to create ENS name
    const parts = resolvedId.split('.');
    if (parts.length < 1) {
      throw new McpError(ErrorCode.InvalidParams, "Invalid ID format. Cannot be empty.");
    }

    // For single domain (e.g., "idreg"), just add .eth
    if (parts.length === 1) {
      return parts[0] + '.eth';
    }

    // For multiple parts, reverse and add .eth
    const reversed = parts.reverse();
    return reversed.join('.') + '.eth';
  }

  /**
   * Resolve ENS name and get root-context text record
   */
  private async resolveEnsTextRecord(ensName: string): Promise<string> {
    try {
      // Normalize the ENS name
      const normalizedName = normalize(ensName);
      
      // Get the resolver address
      const resolverAddress = await this.publicClient.getEnsResolver({
        name: normalizedName,
      });

      if (!resolverAddress) {
        throw new McpError(ErrorCode.InvalidParams, `No resolver found for ENS name: ${ensName}`);
      }

      // Get the namehash
      const node = namehash(normalizedName);

      // Get the root-context text record
      const textRecord = await this.publicClient.readContract({
        address: resolverAddress,
        abi: ensResolverAbi,
        functionName: 'text',
        args: [node, 'root-context'],
      });

      if (!textRecord) {
        throw new McpError(ErrorCode.InvalidParams, `No root-context text record found for: ${ensName}`);
      }

      return textRecord;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to resolve ENS name ${ensName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract lines from content starting from a specific line number
   */
  private extractLines(content: string, startLine: number = 0): string {
    if (startLine === 0) {
      return content;
    }

    const lines = content.split('\n');
    if (startLine >= lines.length) {
      return '';
    }

    return lines.slice(startLine).join('\n');
  }

  /**
   * Parse ID and update namespace if it's a full path
   */
  private parseIdAndUpdateNamespace(id: string): void {
    const cleanId = id.replace(/^(id:|idx:)/, '');
    
    // Only update namespace for full paths (not shorthand with apostrophe)
    if (!cleanId.startsWith("'") && cleanId.includes('.')) {
      const parts = cleanId.split('.');
      if (parts.length >= 2) {
        // Extract namespace (all parts except the last one)
        const namespace = parts.slice(0, -1).join('.');
        currentNamespace = namespace;
      }
    }
  }

  private async handleIdTool(args: { id: string; start_line?: number }) {
    // Check if using placeholder RPC FIRST - before any processing
    const rpcUrl = process.env.RPC_URL || '<YOUR-RPC-URL-HERE>';
    if (rpcUrl === '<YOUR-RPC-URL-HERE>') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Please set your own RPC_URL.\n\n' +
        'Get a free API key from:\n' +
        '• Alchemy: https://alchemy.com\n' +
        '• Infura: https://infura.io\n' +
        '• QuickNode: https://quicknode.com\n\n' +
        'Then update your MCP server configuration with:\n' +
        '"env": { "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY" }'
      );
    }

    const { id, start_line = 0 } = args;

    if (!id.startsWith('id:') && !id.startsWith('idx:')) {
      throw new McpError(ErrorCode.InvalidParams, "ID must start with 'id:' or 'idx:' prefix");
    }

    // Update namespace if this is a full path
    this.parseIdAndUpdateNamespace(id);

    // Convert ID to ENS name
    const ensName = this.idToEnsName(id);

    // Resolve the text record
    const content = await this.resolveEnsTextRecord(ensName);

    // Extract lines if start_line is specified
    const finalContent = this.extractLines(content, start_line);

    // Create metadata
    const metadata = {
      id: id,
      ensName: ensName,
      source: "ens",
      path: ensName,
      startLine: start_line,
    };

    return {
      content: [
        {
          type: "text",
          text: `--- ID Metadata ---
ID: ${id}
ENS Name: ${ensName}
Source: ENS Text Record (root-context)
Start Line: ${start_line}

--- Content ---
${finalContent}`,
        },
      ],
    };
  }

  private async handleIdxTool(args: { id: string; start_line?: number }) {
    // IDX tool is similar to ID tool but formatted for execution
    const result = await this.handleIdTool(args);
    
    // Modify the response to indicate execution context
    const originalText = result.content[0].text;
    const modifiedText = originalText.replace('--- ID Metadata ---', '--- IDX Execution Context ---');
    
    // Get the content to analyze for execution suggestions
    const content = await this.handleIdTool(args);
    const contentText = content.content[0].text;
    
    // Suggest execution commands based on content type
    let executionSuggestion = "";
    const lowerContent = contentText.toLowerCase();
    
    if (lowerContent.includes('html') && lowerContent.includes('javascript')) {
      executionSuggestion = "💡 Suggested execution: `open filename.html` (replace with your desired filename)";
    } else if (lowerContent.includes('#!/bin/bash') || lowerContent.includes('bash') || lowerContent.includes('shell')) {
      executionSuggestion = "💡 Suggested execution: `bash filename.sh` (replace with your desired filename)";
    } else if (lowerContent.includes('python') || lowerContent.includes('#!/usr/bin/env python')) {
      executionSuggestion = "💡 Suggested execution: `python filename.py` (replace with your desired filename)";
    } else if (lowerContent.includes('node') || lowerContent.includes('javascript') || lowerContent.includes('npm')) {
      executionSuggestion = "💡 Suggested execution: `node filename.js` (replace with your desired filename)";
    } else {
      executionSuggestion = "💡 Create the appropriate file and execute immediately";
    }
    
    return {
      content: [
        {
          type: "text",
          text: `${modifiedText}

--- Execution Ready ---
This content is prepared for immediate execution.
${executionSuggestion}`,
        },
      ],
    };
  }

  private async handleSetNamespace(args: { namespace: string }) {
    const { namespace } = args;

    if (!namespace.startsWith('id:')) {
      throw new McpError(ErrorCode.InvalidParams, "Namespace must start with 'id:' prefix");
    }

    const cleanNamespace = namespace.replace(/^id:/, '');
    
    // No period requirement - single parts like 'idreg' are allowed
    currentNamespace = cleanNamespace;

    return {
      content: [
        {
          type: "text",
          text: `Namespace set to: ${namespace}`,
        },
      ],
    };
  }

  private async handleGetNamespace() {
    if (!currentNamespace) {
      throw new McpError(ErrorCode.InvalidParams, "No namespace is currently set");
    }

    return {
      content: [
        {
          type: "text",
          text: `id:${currentNamespace}`,
        },
      ],
    };
  }



  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("ID MCP Reader server running on stdio");
  }
}

const server = new IdMcpServer();
server.run().catch(console.error); 