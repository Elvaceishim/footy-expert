import 'dotenv/config';

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = 'https://v3.football.api-sports.io';

async function testAPI() {
  console.log('🔑 Testing API key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT FOUND');
  
  try {
    // Test basic connection
    const response = await fetch(`${API_BASE}/status`, {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📊 API Response:', JSON.stringify(data, null, 2));
    
    if (data.response) {
      console.log('✅ API Key is working');
      console.log('📈 Requests used:', data.response.requests);
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

testAPI();