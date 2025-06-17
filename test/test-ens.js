#!/usr/bin/env node

/**
 * Test ENS resolution directly
 */

import { config } from 'dotenv';
import { createPublicClient, http, namehash } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// Load environment variables from .env file
config();

// Use RPC URL from environment variables (loaded from .env)
const rpcUrl = process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';

console.log('🌐 Testing ENS resolution directly');
console.log(`Using RPC: ${rpcUrl.replace(/\/[^\/]*$/, '/***')}`); // Hide API key in logs

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

// ENS resolver contract ABI (minimal for text records)
const ensResolverAbi = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }, { name: 'key', type: 'string' }],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function testEnsResolution() {
  try {
    console.log('\nTesting idreg.eth...');
    
    // Test primary domain
    const ensName = 'idreg.eth';
    const normalizedName = normalize(ensName);
    
    // Get resolver
    const resolverAddress = await client.getEnsResolver({
      name: normalizedName,
    });
    
    console.log(`✓ Resolver found: ${resolverAddress}`);
    
    // Get text record
    const node = namehash(normalizedName);
    const textRecord = await client.readContract({
      address: resolverAddress,
      abi: ensResolverAbi,
      functionName: 'text',
      args: [node, 'root-context'],
    });
    
    console.log(`✓ Text record: "${textRecord}"`);
    
    console.log('\nTesting subname.idreg.eth...');
    
    // Test subdomain
    const subEnsName = 'subname.idreg.eth';
    const subNormalizedName = normalize(subEnsName);
    
    // Get resolver for subdomain
    const subResolverAddress = await client.getEnsResolver({
      name: subNormalizedName,
    });
    
    console.log(`✓ Subdomain resolver found: ${subResolverAddress}`);
    
    // Get text record for subdomain
    const subNode = namehash(subNormalizedName);
    const subTextRecord = await client.readContract({
      address: subResolverAddress,
      abi: ensResolverAbi,
      functionName: 'text',
      args: [subNode, 'root-context'],
    });
    
    console.log(`✓ Subdomain text record: "${subTextRecord}"`);
    
    console.log('\n🎉 ENS resolution tests completed successfully!');
    
  } catch (error) {
    console.error('❌ ENS test failed:', error.message);
  }
}

testEnsResolution(); 