#!/usr/bin/env node
/**
 * SDK Debug Script
 * Testet direkt die SDK Endpoints
 *
 * Usage:
 *   node test-sdk.js <backend-url> <api-key> <project> <environment> <flag>
 *
 * Example:
 *   node test-sdk.js http://localhost:4000 togglely_demo_key my-project development my-flag
 *   node test-sdk.js https://api.togglely.de togglely_live_key shop production dark-mode
 */

const BASE_URL = process.argv[2] || 'http://localhost:4000'
const API_KEY = process.argv[3] || 'togglely_demo_key'
const PROJECT = process.argv[4] || 'demo-project'
const ENV = process.argv[5] || 'development'
const FLAG = process.argv[6] || 'test-flag'

console.log('========================================')
console.log('Togglely SDK Debug Tool')
console.log('========================================\n')

console.log('Configuration:')
console.log(`  Backend URL: ${BASE_URL}`)
console.log(`  API Key: ${API_KEY.substring(0, 10)}...`)
console.log(`  Project: ${PROJECT}`)
console.log(`  Environment: ${ENV}`)
console.log(`  Flag: ${FLAG}`)
console.log('')

async function testEndpoint(url, description) {
  console.log(`\n--- Testing: ${description} ---`)
  console.log(`URL: ${url}`)

  try {
    const response = await fetch(url)
    const data = await response.json()

    console.log(`Status: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))

    return { success: response.ok, data, status: response.status }
  } catch (error) {
    console.log(`ERROR: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  // Test 1: Health Check
  await testEndpoint(`${BASE_URL}/health`, 'Health Check')

  // Test 2: Single Flag (with API key)
  const singleFlagUrl = `${BASE_URL}/sdk/flags/${PROJECT}/${ENV}/${FLAG}?apiKey=${API_KEY}`
  const singleResult = await testEndpoint(
    singleFlagUrl,
    'Single Flag (with API Key)'
  )

  // Test 3: All Flags (with API key)
  const allFlagsUrl = `${BASE_URL}/sdk/flags/${PROJECT}/${ENV}?apiKey=${API_KEY}`
  const allResult = await testEndpoint(allFlagsUrl, 'All Flags (with API Key)')

  // Test 4: Single Flag (WITHOUT API key - should fail)
  const noKeyUrl = `${BASE_URL}/sdk/flags/${PROJECT}/${ENV}/${FLAG}`
  await testEndpoint(
    noKeyUrl,
    'Single Flag (NO API Key - should fail with 401)'
  )

  // Test 5: Wrong API key
  const wrongKeyUrl = `${BASE_URL}/sdk/flags/${PROJECT}/${ENV}/${FLAG}?apiKey=wrong_key_123`
  await testEndpoint(
    wrongKeyUrl,
    'Single Flag (WRONG API Key - should fail with 401)'
  )

  // Summary
  console.log('\n========================================')
  console.log('SUMMARY')
  console.log('========================================')

  if (singleResult.success) {
    console.log('✅ Single Flag: WORKING')
    console.log(`   Enabled: ${singleResult.data.enabled}`)
    console.log(`   Value: ${singleResult.data.value}`)
    console.log(`   Type: ${singleResult.data.flagType}`)
  } else {
    console.log('❌ Single Flag: FAILED')
    if (singleResult.data?.code) {
      console.log(`   Error Code: ${singleResult.data.code}`)
    }
    if (singleResult.data?.error) {
      console.log(`   Error: ${singleResult.data.error}`)
    }
  }

  if (allResult.success) {
    const flagCount = Object.keys(allResult.data).length
    console.log(`✅ All Flags: WORKING (${flagCount} flags found)`)

    // Show first few flags
    const flags = Object.entries(allResult.data).slice(0, 3)
    flags.forEach(([key, value]) => {
      console.log(`   - ${key}: enabled=${value.enabled}, value=${value.value}`)
    })
    if (flagCount > 3) {
      console.log(`   ... and ${flagCount - 3} more`)
    }
  } else {
    console.log('❌ All Flags: FAILED')
  }

  console.log('\n========================================')
  console.log('TROUBLESHOOTING')
  console.log('========================================')

  if (!singleResult.success) {
    switch (singleResult.data?.code) {
      case 'MISSING_API_KEY':
        console.log('🔑 API Key is missing! Check your SDK configuration.')
        break
      case 'INVALID_API_KEY':
        console.log(
          '🔑 API Key is invalid! Check the key in Togglely Dashboard.'
        )
        console.log('   Make sure:')
        console.log('   - The key is active')
        console.log('   - The key belongs to the correct organization')
        console.log('   - The project key matches')
        break
      case 'ORIGIN_NOT_ALLOWED':
        console.log(
          '🌐 Origin not allowed! Add your domain to Project Settings > Allowed Origins.'
        )
        break
      case 'PROJECT_NOT_FOUND':
        console.log('📁 Project not found! Check the project key.')
        break
      case 'ENV_NOT_FOUND':
        console.log('🌍 Environment not found! Check the environment key.')
        break
      default:
        console.log('❓ Unknown error. Check the backend logs for details.')
    }
  } else if (singleResult.data.enabled === false) {
    console.log('⚠️  Flag is DISABLED. Check in Dashboard:')
    console.log('   1. Go to your project')
    console.log('   2. Select the environment')
    console.log('   3. Enable the flag')
    console.log('')
    console.log(
      '   OR the flag might not exist yet (auto-created as disabled).'
    )
  } else {
    console.log('✅ Everything is working correctly!')
  }

  console.log('')
}

runTests().catch(console.error)
