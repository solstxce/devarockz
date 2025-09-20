// Quick test script to verify the API fix
async function testAuctionAPI() {
  const API_BASE_URL = 'http://localhost:3001/api'
  
  try {
    // Test the search endpoint
    const response = await fetch(`${API_BASE_URL}/auctions/search?status=active`)
    const data = await response.json()
    
    console.log('API Response:', data)
    console.log('Success:', data.success)
    console.log('Data length:', data.data?.length || 0)
    
    if (data.success) {
      console.log('✅ API is working correctly')
      if (data.data.length === 0) {
        console.log('📭 No auctions found (expected with empty database)')
      }
    } else {
      console.log('❌ API returned error:', data.error)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testAuctionAPI()