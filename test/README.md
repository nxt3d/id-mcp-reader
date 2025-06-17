# ID MCP Reader Tests

This directory contains comprehensive tests for the ID MCP Reader.

## Test Files

### `test.js` - Basic Server Test
- **Purpose**: Basic MCP server functionality test
- **What it tests**: Server startup, tool list retrieval
- **Run with**: `npm test`
- **Duration**: ~2 seconds

### `test-client.js` - Comprehensive MCP Client Test Suite
- **Purpose**: Full end-to-end testing using an MCP client
- **What it tests**: 
  - All 5 tools (id, idx, id_set_namespace, id_get_namespace, id_list)
  - Real ENS resolution with idreg.eth
  - Namespace operations and shorthand notation
  - Error handling and edge cases
  - Tool variations and parameters
- **Run with**: `npm run test:full`
- **Duration**: ~10-15 seconds
- **Requirements**: 
  - Built server (`npm run build`)
  - Working RPC endpoint
  - idreg.eth domain with root-context text record

### `test-ens.js` - ENS Resolution Test
- **Purpose**: Test ENS resolution with your Alchemy RPC
- **What it tests**: 
  - Basic ENS domain resolution (vitalik.eth)
  - RPC endpoint connectivity
  - Resolver address retrieval
- **Run with**: `npm run test:ens`
- **Duration**: ~5 seconds

## Running Tests

```bash
# Basic server test
npm test

# Comprehensive test suite (recommended)
npm run test:full

# ENS resolution test only
npm run test:ens

# All tests
npm test && npm run test:ens && npm run test:full
```

## Test Coverage

The test suite covers:

✅ **Server Functionality**
- Server startup and shutdown
- Tool registration and listing
- MCP protocol compliance

✅ **Tool Implementation**
- `id` tool: ENS resolution and content retrieval
- `idx` tool: Execution context formatting
- `id_set_namespace` / `id_get_namespace`: Namespace management
- `id_list`: Domain listing (with limitations)

✅ **ENS Integration**
- Real ENS domain resolution
- Text record retrieval (`root-context`)
- Error handling for missing domains/records

✅ **ID Format Conversion**
- `id:domain.subname` → `subname.domain.eth`
- Shorthand notation (`id:'name`)
- Namespace resolution

✅ **Error Handling**
- Invalid ID formats
- Missing ENS domains
- Invalid namespaces
- RPC connection issues

## Test Environment

Tests use the configured Alchemy RPC endpoint:
- Production mainnet data
- Real ENS resolution
- Rate limiting applies

## Expected Test Results

### Successful Test Run
- All tools should be listed correctly
- Namespace operations should work
- `idreg.eth` should resolve with "test" content
- Error cases should be handled gracefully

### Common Issues
- **RPC Rate Limiting**: May cause intermittent failures
- **Network Issues**: ENS resolution may timeout
- **Missing Build**: Run `npm run build` first
- **Missing ENS Records**: Ensure `idreg.eth` has `root-context` text record

## Debugging Tests

For verbose output:
```bash
DEBUG=1 npm run test:full
```

To test individual components:
```bash
# Test only ENS resolution
npm run test:ens

# Test only basic server
npm test
``` 