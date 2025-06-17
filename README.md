# ID MCP Reader

An MCP (Model Context Protocol) server that resolves ID-format identifiers to ENS (Ethereum Name Service) names and fetches content from their `root-context` text records.

## Overview

This server provides a shorthand way to interact with ENS domains by converting ID-format strings to ENS names and retrieving their stored content.

### ID to ENS Conversion

The core concept is that `id:core.subname` converts to `subname.core.eth`:

```
id:core.subname → subname.core.eth
id:vitalik.hello → hello.vitalik.eth  
id:ens.docs → docs.ens.eth
```

The ID parts are **reversed** and `.eth` is appended to create valid ENS names.

## Installation

### Step 1: Build the Server

First, clone and build the server:

```bash
git clone <repository-url>
cd id-mcp-reader
npm install
npm run build
```

### Step 2: Client Configurations

**ID MCP Reader works with any MCP-compatible application** that supports stdio transport: Cursor, Claude Desktop, custom MCP clients, etc.

### Cursor Configuration

#### Option A: One-Click Install (Recommended)

[🔗 **Add ID MCP Reader to Cursor**](cursor://anysphere.cursor-deeplink/mcp/install?name=id-mcp-reader&config=eyJjb21tYW5kIjoibm9kZSIsImFyZ3MiOlsiL1VzZXJzL254dDNkL3Byb2plY3RzL2lkL2lkLW1jcC1yZWFkZXIvZGlzdC9pbmRleC5qcyJdLCJlbnYiOnsiUlBDX1VSTCI6IjxZT1VSLVJQQy1VUkwtSEVSRT4ifX0=)

*This installs the MCP configuration for Cursor. Setup the RPC_URL after clicking on the link as the RPC_URL is not set in the MCP configuration automatically.*

#### Option B: Manual Configuration

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
      "id-mcp-reader": {
    "command": "node", 
    "args": ["/path/to/your/id-mcp-reader/dist/index.js"],
      "env": {
        "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "id-mcp-reader": {
      "command": "node",
      "args": ["/path/to/your/id-mcp-reader/dist/index.js"],
      "env": {
        "RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
      }
    }
  }
}
```

## RPC Configuration

### RPC Endpoint Required

**⚠️ Important**: This server requires a valid Ethereum RPC endpoint. The placeholder RPC will cause an immediate error with setup instructions.

Get a free API key from:
- **Alchemy**: [alchemy.com](https://alchemy.com) (recommended)
- **Infura**: [infura.io](https://infura.io)
- **QuickNode**: [quicknode.com](https://quicknode.com)

### Environment Variables

- `RPC_URL` (required): Ethereum RPC endpoint with your API key.

Example:
```json
"RPC_URL": "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
```



## Usage

### Available Tools

#### 1. `id` - Load ID
Resolves an ID to ENS and fetches the `root-context` text record.

**Features:**
- Full path: `id:core.subname` → resolves `subname.core.eth`
- Shorthand: `id:'subname` → uses current namespace  
- Line numbers: Optional `start_line` parameter

**Examples:**
```javascript
id("id:idreg")                    // → resolves idreg.eth
id("id:idreg.subname")           // → resolves subname.idreg.eth  
id("id:'subname")                // → uses current namespace
id("id:core.subname", {start_line: 100})  // → start from line 100
```

#### 2. `idx` - Load for Execution  
Same as `id` but formats content for immediate execution. Results may vary depending on the client.

**Examples:**
```javascript
idx("id:idreg.script")     // → formats for execution
idx("idx:core.script")     // → accepts both id: and idx: prefixes
```

#### 3. `id_set_namespace` - Set Namespace
Sets the current namespace for shorthand references.

**Examples:**
```javascript
id_set_namespace("id:idreg")
// Now id:'subname resolves to id:idreg.subname → subname.idreg.eth

id_set_namespace("id:core.user")  
// Now id:'profile resolves to id:core.user.profile → profile.user.core.eth
```

#### 4. `id_get_namespace` - Get Namespace
Returns the currently set namespace.

```javascript
id_get_namespace()  // → "id:idreg" (example)
```

### Shorthand Notation

The `'` character in IDs is replaced with the current namespace:

```javascript
id_set_namespace("id:idreg")
id("id:'subname")  // Becomes id:idreg.subname → subname.idreg.eth
```

## How It Works

1. **ID Parsing**: `id:core.subname` → remove `id:` prefix → `core.subname`
2. **ENS Conversion**: Reverse the parts and append `.eth` → `subname.core.eth`
3. **ENS Resolution**: 
   - Get ENS resolver address for the domain
   - Query the `root-context` text record
   - Return the content

## ENS Text Record Format

Your ENS domain should have a `root-context` text record containing the content you want to retrieve. Set this through:

- ENS Manager UI
- Direct contract interaction
- Custom clients applications

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:full      # Comprehensive test suite
npm run test:ens       # ENS resolution tests  
npm run test:subdomain # Subdomain functionality
```

## Development Setup

### Testing Only: .env File

**⚠️ Note**: The `.env` file is **only used for running tests and development**. The MCP server gets its configuration from Cursor's MCP settings, not from `.env` files.

For running tests and development, create a `.env` file:

```bash
# .env - ONLY for testing/development
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

## License

MIT License - Copyright (c) 2025 @nxt3d (Prem Makeig)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **"Please set your own RPC_URL"**: Set your own RPC_URL in the MCP configuration
2. **"No resolver found"**: The ENS domain doesn't exist or isn't configured
3. **"No root-context text record"**: The domain exists but has no `root-context` text record
4. **RPC errors**: Check your RPC endpoint and API key
5. **Rate limiting**: Upgrade your RPC plan or implement caching