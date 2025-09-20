// Simple test script to check dashboard API endpoints
async function testDashboardAPI() {
  const API_BASE = 'http://localhost:3001/api'
  
  // Check if we can reach the basic endpoints
  console.log('🔄 Testing Dashboard API endpoints...\n')
  
  // Test health check first
  try {
    const healthResponse = await fetch('http://localhost:3001/health')
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData.status)
  } catch (error) {
    console.log('❌ Health check failed:', error.message)
    console.log('🚨 Make sure the backend server is running on port 3001')
    return
  }

  // Test bidding endpoints (should fail without auth, but show if routes exist)
  const endpoints = [
    '/bids/my/active',
    '/bids/my/bids',
    '/bids/my/won'
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`)
      const status = response.status
      
      if (status === 401) {
        console.log(`✅ ${endpoint} - Route exists (401 Unauthorized as expected)`)
      } else if (status === 404) {
        console.log(`❌ ${endpoint} - Route not found (404)`)
      } else {
        console.log(`ℹ️ ${endpoint} - Status: ${status}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`)
    }
  }
  
  console.log('\n📝 Summary:')
  console.log('- If routes show 401 Unauthorized, they exist but need authentication')
  console.log('- If routes show 404 Not Found, check backend routing configuration')
  console.log('- Check browser console for frontend authentication token issues')
}

// Run the test
testDashboardAPI().catch(console.error)