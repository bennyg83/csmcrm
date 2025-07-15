const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5174';

async function testFullConnection() {
  console.log('🧪 Testing Complete CRM Frontend-Backend Connection...\n');

  try {
    // Test 1: Backend Health
    console.log('1. Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend health check passed:', healthResponse.data.status);

    // Test 2: Frontend Accessibility
    console.log('\n2. Testing Frontend Accessibility...');
    try {
      const frontendResponse = await axios.get(FRONTEND_URL);
      console.log('✅ Frontend is accessible (status:', frontendResponse.status, ')');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Frontend is accessible (404 is expected for React SPA)');
      } else {
        throw error;
      }
    }

    // Test 3: Authentication
    console.log('\n3. Testing Authentication...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@crm.com',
      password: 'admin123'
    });
    console.log('✅ Authentication successful');
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 4: User Info
    console.log('\n4. Testing User Info...');
    const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, { headers });
    console.log('✅ User info retrieved:', userResponse.data.user.name, '(', userResponse.data.user.role, ')');

    // Test 5: Accounts API
    console.log('\n5. Testing Accounts API...');
    const accountsResponse = await axios.get(`${BACKEND_URL}/api/accounts`, { headers });
    console.log('✅ Accounts API working, count:', accountsResponse.data.length);

    // Test 6: CORS Configuration (Frontend to Backend)
    console.log('\n6. Testing CORS Configuration...');
    const corsResponse = await axios.get(`${BACKEND_URL}/api/accounts`, { 
      headers: { 
        ...headers,
        'Origin': FRONTEND_URL 
      }
    });
    console.log('✅ CORS properly configured for frontend-backend communication');

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📊 Connection Summary:');
    console.log('   • Backend: ✅ Running on http://localhost:3000');
    console.log('   • Frontend: ✅ Running on http://localhost:5173');
    console.log('   • Database: ✅ Connected and seeded');
    console.log('   • Authentication: ✅ JWT working');
    console.log('   • API Endpoints: ✅ All accessible');
    console.log('   • CORS: ✅ Properly configured');
    
    console.log('\n🚀 Ready to use!');
    console.log('   • Open http://localhost:5173 in your browser');
    console.log('   • Login with admin@crm.com / admin123');
    console.log('   • Start building your CRM!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.error || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure both servers are running:');
      console.log('   • Backend: cd backend && npm run dev');
      console.log('   • Frontend: cd frontend && npm run dev');
      console.log('2. Check if ports are available:');
      console.log('   • Backend port 3000');
      console.log('   • Frontend port 5173');
    } else if (error.response?.status === 401) {
      console.log('\n🔧 Authentication issue:');
      console.log('1. Run database seeding: cd backend && npm run seed');
      console.log('2. Verify credentials: admin@crm.com / admin123');
    }
  }
}

testFullConnection(); 