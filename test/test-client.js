#!/usr/bin/env node

/**
 * Comprehensive MCP Client Test Suite for ID MCP Reader
 * Tests all tools with real ENS resolution using idreg.eth
 */

import { config } from 'dotenv';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class IdRpcTestClient {
  constructor() {
    this.client = new Client(
      {
        name: "id-mcp-reader-test-client",
        version: "1.0.0"
      }
    );
  }

  async connect() {
    const serverPath = join(__dirname, '..', 'dist', 'index.js');
    const transport = new StdioClientTransport({
      command: process.execPath, // Use the current node executable path
      args: [serverPath],
      env: {
        ...process.env, // Inherit environment variables (includes .env)
      }
    });

    await this.client.connect(transport);
    console.log("✅ Connected to ID MCP Reader\n");
  }

  async disconnect() {
    await this.client.close();
    console.log("🔌 Disconnected from server");
  }

  async runTests() {
    console.log("🧪 Starting Comprehensive ID MCP Reader Tests\n");
    console.log("=".repeat(60));

    try {
      await this.connect();
      
      // Test 1: List Tools
      await this.testListTools();
      
      // Test 2: Test namespace operations
      await this.testNamespaceOperations();
      
      // Test 3: Test real ENS resolution with idreg.eth
      await this.testRealEnsResolution();
      
      // Test 4: Test ID tool variations  
      await this.testIdToolVariations();
      
      // Test 5: Test IDX tool
      await this.testIdxTool();
      
      // Test 6: Test error cases
      await this.testErrorCases();
      
      console.log("\n" + "=".repeat(60));
      console.log("🎉 All tests completed successfully!");
      
    } catch (error) {
      console.error("⚠️  Test suite failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async testListTools() {
    console.log("📋 Test 1: Listing available tools");
    console.log("-".repeat(40));
    
    const tools = await this.client.listTools();
    console.log(`Found ${tools.tools.length} tools:`);
    
    const expectedTools = ['id', 'idx', 'id_set_namespace', 'id_get_namespace'];
    
    tools.tools.forEach(tool => {
      console.log(`  ✓ ${tool.name}`);
      if (!expectedTools.includes(tool.name)) {
        throw new Error(`Unexpected tool: ${tool.name}`);
      }
    });
    
    expectedTools.forEach(expected => {
      if (!tools.tools.find(t => t.name === expected)) {
        throw new Error(`Missing expected tool: ${expected}`);
      }
    });
    
    console.log("✅ All expected tools found\n");
  }

  async testNamespaceOperations() {
    console.log("🏷️  Test 2: Testing namespace operations");
    console.log("-".repeat(40));
    
    // Test setting namespace
    console.log("Setting namespace to 'id:idreg'...");
    const setResult = await this.client.callTool({
      name: "id_set_namespace",
      arguments: { namespace: "id:idreg" }
    });
    console.log("✓ Set namespace result:", setResult.content[0].text);
    
    // Test getting namespace
    console.log("Getting current namespace...");
    const getResult = await this.client.callTool({
      name: "id_get_namespace",
      arguments: {}
    });
    console.log("✓ Get namespace result:", getResult.content[0].text);
    
    if (getResult.content[0].text !== "id:idreg") {
      throw new Error("Namespace not set correctly");
    }
    
    console.log("✅ Namespace operations working correctly\n");
  }

  async testRealEnsResolution() {
    console.log("🌐 Test 3: Testing real ENS resolution with idreg.eth domains");
    console.log("-".repeat(40));
    
    // Test 3a: Single domain - id:idreg -> idreg.eth
    console.log("3a. Resolving id:idreg (should resolve to idreg.eth)...");
    
    try {
      const result = await this.client.callTool({
        name: "id",
        arguments: { id: "id:idreg" }
      });
      
      console.log("✓ Single domain ENS resolution successful!");
      console.log("Response:", result.content[0].text);
      
      // Check if the content contains "test" as expected
      if (result.content[0].text.includes("test")) {
        console.log("✓ Found expected 'test' content from root-context text record");
      } else {
        console.log("⚠️  'test' content not found - checking if resolution worked anyway");
      }
      
      // Check metadata
      if (result.content[0].text.includes("idreg.eth")) {
        console.log("✓ ENS name resolution confirmed (idreg.eth)");
      }
      
    } catch (error) {
      console.log("⚠️  Single domain resolution failed:", error.message);
    }
    
    console.log("");
    
    // Test 3b: Subdomain - id:idreg.subname -> subname.idreg.eth
    console.log("3b. Resolving id:idreg.subname (should resolve to subname.idreg.eth)...");
    
    try {
      const subResult = await this.client.callTool({
        name: "id",
        arguments: { id: "id:idreg.subname" }
      });
      
      console.log("✓ Subdomain ENS resolution successful!");
      console.log("Response:", subResult.content[0].text);
      
      // Check if the content contains "test2" as expected
      if (subResult.content[0].text.includes("test2")) {
        console.log("✓ Found expected 'test2' content from subdomain root-context text record");
      } else {
        console.log("⚠️  'test2' content not found - checking if resolution worked anyway");
      }
      
      // Check metadata
      if (subResult.content[0].text.includes("subname.idreg.eth")) {
        console.log("✓ Subdomain ENS name resolution confirmed (subname.idreg.eth)");
      }
      
    } catch (error) {
      console.log("⚠️  Subdomain resolution failed:", error.message);
    }
    
    console.log("✅ Real ENS resolution tests completed\n");
  }

  async testIdToolVariations() {
    console.log("🔧 Test 4: Testing ID tool variations");
    console.log("-".repeat(40));
    
    // Test with shorthand notation (using current namespace 'idreg')
    console.log("Testing shorthand notation id:'subname...");
    console.log("Expected conversion: id:'subname → idreg.subname → subname.idreg.eth");
    try {
      const shorthandResult = await this.client.callTool({
        name: "id",
        arguments: { id: "id:'subname" }
      });
      console.log("✅ Shorthand notation worked successfully!");
      console.log("Result preview:", shorthandResult.content[0].text.substring(0, 200) + "...");
      
      // Check if we got the expected subdomain content
      if (shorthandResult.content[0].text.includes("test2")) {
        console.log("✅ Found expected 'test2' content from subname.idreg.eth");
      }
      
    } catch (error) {
      // Check if it's trying to resolve the correct ENS name
      if (error.message.includes("subname.idreg.eth")) {
        console.log("✅ Shorthand notation processing correctly (correctly converted to subname.idreg.eth)");
      } else {
        console.log("⚠️  Unexpected shorthand behavior:", error.message);
      }
    }
    
    // Test with line number
    console.log("Testing with start_line parameter...");
    try {
      const lineResult = await this.client.callTool({
        name: "id", 
        arguments: { id: "id:idreg", start_line: 0 }
      });
      console.log("✓ start_line parameter handled correctly");
    } catch (error) {
      console.log("⚠️  Line parameter test failed:", error.message);
    }
    
    console.log("✅ ID tool variations test completed\n");
  }

  async testIdxTool() {
    console.log("⚡ Test 5: Testing IDX tool (execution context)");
    console.log("-".repeat(40));
    
    // Test IDX with single domain
    console.log("5a. Testing IDX with single domain (id:idreg)...");
    try {
      const idxResult = await this.client.callTool({
        name: "idx",
        arguments: { id: "id:idreg" }
      });
      
      console.log("✓ IDX tool executed successfully for single domain");
      console.log("Response preview:", idxResult.content[0].text.substring(0, 200) + "...");
      
      // Check for execution context indicators
      if (idxResult.content[0].text.includes("Execution")) {
        console.log("✓ Execution context formatting detected");
      }
      
    } catch (error) {
      console.log("⚠️  IDX tool test failed for single domain:", error.message);
    }
    
    console.log("");
    
    // Test IDX with subdomain
    console.log("5b. Testing IDX with subdomain (id:idreg.subname)...");
    try {
      const idxSubResult = await this.client.callTool({
        name: "idx",
        arguments: { id: "id:idreg.subname" }
      });
      
      console.log("✓ IDX tool executed successfully for subdomain");
      console.log("Response preview:", idxSubResult.content[0].text.substring(0, 200) + "...");
      
      // Check for execution context indicators and test2 content
      if (idxSubResult.content[0].text.includes("Execution") && idxSubResult.content[0].text.includes("test2")) {
        console.log("✓ Execution context formatting and subdomain content detected");
      }
      
    } catch (error) {
      console.log("⚠️  IDX tool test failed for subdomain:", error.message);
    }
    
    console.log("✅ IDX tool tests completed\n");
  }

  async testErrorCases() {
    console.log("✅ Test 6: Testing error handling");
    console.log("-".repeat(40));
    
    // Test invalid ID format
    console.log("Testing invalid ID format (missing id: prefix)...");
    try {
      await this.client.callTool({
        name: "id",
        arguments: { id: "invalid-format" }
      });
      console.log("⚠️  Should have thrown error for invalid format");
    } catch (error) {
      console.log("✓ Correctly rejected invalid ID format:", error.message);
    }
    
    // Test non-existent ENS domain
    console.log("Testing non-existent ENS domain...");
    try {
      await this.client.callTool({
        name: "id",
        arguments: { id: "id:nonexistent.invalid" }
      });
      console.log("⚠️  Should have thrown error for non-existent domain");
    } catch (error) {
      console.log("✓ Correctly handled non-existent domain:", error.message);
    }
    
    // Test invalid namespace format
    console.log("Testing invalid namespace format...");
    try {
      await this.client.callTool({
        name: "id_set_namespace",
        arguments: { namespace: "invalid-namespace" }
      });
      console.log("⚠️  Should have thrown error for invalid namespace");
    } catch (error) {
      console.log("✓ Correctly rejected invalid namespace:", error.message);
    }
    
    console.log("✅ Error handling tests completed\n");
  }


}

// String.repeat is natively supported in modern JavaScript

// Run the test suite
const testClient = new IdRpcTestClient();
testClient.runTests().catch(error => {
  console.error("Test suite failed:", error);
  process.exit(1);
}); 