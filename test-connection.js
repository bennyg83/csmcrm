const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testConnection() {
  console.log('🧪 Testing CRM Backend-Frontend Connection...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Login with demo credentials
    console.log('\n2. Testing authentication...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@crm.com',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 3: Get user info
    console.log('\n3. Testing user info endpoint...');
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers });
    console.log('✅ User info retrieved:', userResponse.data.user.name);

    // Test 4: Get accounts (should be empty initially)
    console.log('\n4. Testing accounts endpoint...');
    const accountsResponse = await axios.get(`${API_BASE_URL}/accounts`, { headers });
    console.log('✅ Accounts endpoint working, count:', accountsResponse.data.length);

    console.log('\n🎉 All tests passed! Backend is ready for frontend connection.');
    console.log('\n📝 Next steps:');
    console.log('1. Start the frontend: cd frontend && npm run dev');
    console.log('2. Open http://localhost:5173 in your browser');
    console.log('3. Login with admin@crm.com / admin123');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.error || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Create database: crm_app');
    console.log('3. Copy backend/env.example to backend/.env and update credentials');
    console.log('4. Run: cd backend && npm run seed');
    console.log('5. Start backend: cd backend && npm run dev');
  }
}

testConnection(); 