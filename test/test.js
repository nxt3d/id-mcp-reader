#!/usr/bin/env node

/**
 * Simple test script for the ID MCP Reader
 * Tests basic functionality without requiring a full MCP client
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function testMcpServer() {
  console.log('🧪 Testing ID MCP Reader...\n');
  
  const serverPath = join(__dirname, '..', 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  
  server.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  server.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString());
  });

  // Test 1: List tools
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  };

  console.log('📋 Test 1: Listing available tools...');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  setTimeout(() => {
    if (responseData) {
      try {
        const response = JSON.parse(responseData);
        if (response.result && response.result.tools) {
          console.log('✅ Tools list received:');
          response.result.tools.forEach(tool => {
            console.log(`   - ${tool.name}`);
          });
        } else {
          console.log('❌ Unexpected response format');
        }
      } catch (e) {
        console.log('❌ Failed to parse response:', e.message);
      }
    } else {
      console.log('❌ No response received');
    }
    
    server.kill();
    console.log('\n🏁 Test completed');
  }, 2000);

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });
}

testMcpServer(); 