#!/usr/bin/env node

/**
 * Test subdomain functionality specifically
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

async function testSubdomains() {
  console.log('🔍 Testing subdomain functionality...\n');
  
  const client = new Client({
    name: "subdomain-test-client",
    version: "1.0.0"
  });

  try {
    // Connect to server
    const serverPath = join(__dirname, '..', 'dist', 'index.js');
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: {
        ...process.env, // Inherit environment variables (includes .env)
      }
    });

    await client.connect(transport);
    console.log("✅ Connected to server\n");

    // Test 1: Primary domain
    console.log("Test 1: Primary domain (id:idreg)");
    try {
      const result1 = await client.callTool({
        name: "id",
        arguments: { id: "id:idreg" }
      });
      console.log("✓ Primary domain resolved");
      console.log("Content preview:", result1.content[0].text.substring(0, 100) + "...\n");
    } catch (error) {
      console.log("⚠️  Primary domain test failed:", error.message, "\n");
    }

    // Test 2: Subdomain
    console.log("Test 2: Subdomain (id:idreg.subname)");
    try {
      const result2 = await client.callTool({
        name: "id",
        arguments: { id: "id:idreg.subname" }
      });
      console.log("✓ Subdomain resolved");
      console.log("Content preview:", result2.content[0].text.substring(0, 100) + "...\n");
    } catch (error) {
      console.log("⚠️  Subdomain test failed:", error.message, "\n");
    }

    // Test 3: Namespace + shorthand
    console.log("Test 3: Namespace + shorthand");
    try {
      // Set namespace
      await client.callTool({
        name: "id_set_namespace",
        arguments: { namespace: "id:idreg" }
      });
      console.log("✓ Namespace set to id:idreg");
      
      // Use shorthand
      const result3 = await client.callTool({
        name: "id",
        arguments: { id: "id:'subname" }
      });
      console.log("✓ Shorthand resolved");
      console.log("Content preview:", result3.content[0].text.substring(0, 100) + "...\n");
    } catch (error) {
      console.log("⚠️  Shorthand test failed:", error.message, "\n");
    }

    await client.close();
    console.log("🎉 Subdomain tests completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    try { await client.close(); } catch (e) {}
  }
}

testSubdomains(); 