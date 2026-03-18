#!/usr/bin/env node
/**
 * SDK Client Test - Node.js
 * Testet die SDK direkt ohne Browser
 * 
 * Usage:
 *   node test-sdk-node.mjs
 * 
 * Oder mit Args:
 *   node test-sdk-node.mjs https://api.togglely.de togglely_sdk_xxx my-project production my-flag
 */

import { TogglelyClient } from './sdk/core/dist/index.esm.js';

const BASE_URL = process.argv[2] || 'https://api.togglely.de';
const API_KEY = process.argv[3] || 'togglely_demo_key';
const PROJECT = process.argv[4] || 'demo-project';
const ENV = process.argv[5] || 'production';
const FLAG = process.argv[6] || 'test-flag';

console.log('========================================');
console.log('Togglely SDK Client Test (Node.js)');
console.log('========================================\n');

console.log('Configuration:');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  API Key: ${API_KEY.substring(0, 15)}...`);
console.log(`  Project: ${PROJECT}`);
console.log(`  Environment: ${ENV}`);
console.log(`  Flag: ${FLAG}`);
console.log('');

async function testSDK() {
  console.log('Creating SDK client...');
  
  const client = new TogglelyClient({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    project: PROJECT,
    environment: ENV,
    offlineFallback: false,  // Wichtig: Kein Fallback, um echte Fehler zu sehen
    autoFetch: false,
  });
  
  console.log('SDK client created\n');
  
  // Test 1: getValue
  console.log('--- TEST 1: getValue() ---');
  try {
    const value = await client.getValue(FLAG);
    console.log('Result:', JSON.stringify(value, null, 2));
    
    if (value === null) {
      console.log('❌ getValue returned NULL');
    } else if (value.enabled === false) {
      console.log('⚠️  Flag is DISABLED (enabled=false)');
      console.log('   This means the flag was found but is turned off.');
    } else {
      console.log('✅ Flag is ENABLED');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  // Test 2: isEnabled
  console.log('\n--- TEST 2: isEnabled() ---');
  try {
    const enabled = await client.isEnabled(FLAG, false);
    console.log(`isEnabled() returned: ${enabled}`);
    
    if (enabled === false) {
      console.log('⚠️  isEnabled() is FALSE');
    } else {
      console.log('✅ isEnabled() is TRUE');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  // Test 3: refresh (fetch all)
  console.log('\n--- TEST 3: refresh() ---');
  try {
    await client.refresh();
    const all = client.getAllToggles();
    console.log(`Fetched ${Object.keys(all).length} flags:`);
    console.log(JSON.stringify(all, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  // Test 4: Direct fetch comparison
  console.log('\n--- TEST 4: Direct Fetch (for comparison) ---');
  try {
    const url = `${BASE_URL}/sdk/flags/${PROJECT}/${ENV}/${FLAG}?apiKey=${API_KEY}`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    
    const data = await response.json();
    console.log('Direct fetch result:', JSON.stringify(data, null, 2));
    
    if (data.enabled === false) {
      console.log('\n⚠️  Direct fetch shows disabled=false');
      console.log('   The backend is returning disabled.');
      console.log('   Check in Dashboard if the flag is enabled for this environment.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  console.log('\n========================================');
  console.log('Analysis:');
  console.log('========================================');
  
  console.log(`
If Direct Fetch shows enabled=true but SDK shows enabled=false:
  → The SDK has a bug or caching issue

If both show enabled=false:
  → The flag is really disabled in the database
  → Check Dashboard: Project → ${ENV} → ${FLAG}

If SDK returns null:
  → API error (401/403/404)
  → Check API key, CORS, project/environment names
`);
}

testSDK().catch(console.error);
