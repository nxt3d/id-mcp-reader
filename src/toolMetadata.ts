/**
 * Copyright (c) 2025 @nxt3d (Prem Makeig)
 */

// Tool metadata descriptions for MCP server tools
export const toolMetadata = {
  // ID tool for direct file retrieval
  id: `Loads prompts from ENS root-context text records.
    
    Parameters:
    - id: Required - The ID of the prompt to load (e.g., id:core.subname)
    - start_line: Optional - The line number to start reading from (default: 0)
    
    Outputs:
    - Text content from the ENS root-context text record
    - Structured metadata including:
      - id: The unique identifier used
      - ensName: The resolved ENS name (e.g., subname.core.eth)
      - source: Always "ens" for ENS-based resolution
      - path: The ENS name path
      - startLine: The starting line number
    
    Usage:
    - Full path: id:core.subname (resolves to subname.core.eth)
    - Shorthand: id:'subname (uses current namespace, e.g., if namespace is "core", resolves to subname.core.eth)
    - With line number: Use the start_line parameter (e.g., start_line: 100)
    
    IMPORTANT: The id parameter MUST ALWAYS include the 'id:' prefix. 
    Never use just the id without the prefix.
    
    Namespace Resolution:
    - When using shorthand (id:'), the apostrophe is replaced with the current namespace
    - Example: If namespace is "core" and input is "id:'subname", it becomes "id:core.subname"
    - The namespace and prompt name are joined with a period (.) between them
    - When using a full path without apostrophe, the namespace will be automatically detected and saved
    - If no namespace is currently set, the system will extract and save it from the first full path used
    
    ID to ENS Conversion:
    - id:core.subname becomes subname.core.eth
    - The parts are reversed and .eth is appended
    - This allows hierarchical organization while maintaining ENS compatibility
    
    Features:
    - Resolves ENS names and fetches root-context text records
    - Reports errors for missing or unreadable ENS records
    - Supports starting from a specific line number using the start_line parameter
    - Returns structured metadata including ENS name resolution details
    
    Important:
    - Requires a configured Ethereum RPC endpoint
    - Uses Viem for ENS resolution and text record fetching
    - Updates namespace when new id: namespace is entered`,

  // IDX tool (like ID but with execution context)
  idx: `Similar to the id tool, but prepares content for immediate execution.
    
    Parameters:
    - id: Required - The ID of the prompt to load and execute (e.g., idx:core.subname or id:core.subname)
    - start_line: Optional - The line number to start reading from (default: 0)
    
    Outputs:
    - JSON-formatted text content with:
      - header: A message indicating the content is for execution
      - source: Always "ens" for ENS-based resolution
      - content: The actual content from the ENS root-context text record
      - metadata: Complete metadata about the prompt
    - Structured metadata including:
      - id: The unique identifier used
      - ensName: The resolved ENS name
      - source: Always "ens"
      - path: The ENS name path
      - startLine: The starting line number
      - execute: Set to true to indicate execution context
    
    Usage:
    - Full path: idx:core.subname or id:core.subname
    - Shorthand: idx:'subname or id:'subname (uses current namespace)
    
    Behavior:
    - Resolves ENS names and fetches root-context text records just like the id tool
    - Both id: and idx: prefixes are accepted; the tool will handle either format
    - Formats the response for automatic execution
    - For HTML files: Suggests opening in browser
    - For bash scripts: Suggests immediate execution
    - For Python/Node.js: Suggests running with appropriate interpreter
    - Returns structured metadata with an 'execute: true' flag to indicate execution context
    
    All other features and requirements are the same as the id tool.`,
  
  // Set namespace tool
  id_set_namespace: `Sets the current namespace for use with id: and idx: commands.
    
    Parameters:
    - namespace: Required - The namespace to set (e.g., id:core)
    
    Outputs:
    - Confirmation message that the namespace was set
    
    Usage:
    - id_set_namespace id:core
    
    Example:
    - id_set_namespace id:core will set the namespace to 'core'
    
    Single-part namespaces like 'idreg' or hierarchical namespaces like 'core.user' are both supported.`,

  // Get namespace tool
  id_get_namespace: `Retrieves the current namespace set by id_set_namespace, prefixed with 'id:'.
    
    Parameters:
    - None
    
    Outputs:
    - Current namespace with 'id:' prefix (e.g., id:core)
    - Error message if no namespace is set
    
    Example:
    - If the current namespace is 'core', id_get_namespace() will return 'id:core'.
    
    This tool is useful for recalling the namespace when using shorthand id: or idx: commands like id:'subname.`,

}; 