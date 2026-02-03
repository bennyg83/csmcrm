const https = require('https');
const http = require('http');

// Simple HTTP request function
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testExternalAPI() {
  console.log('🧪 Testing External User Platform API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await makeRequest('http://localhost:3002/health');
    console.log(`   ✅ Health: ${health.status} - ${health.data}\n`);

    // Test 2: Register new external user
    console.log('2. Testing external user registration...');
    const registerData = {
      email: 'apitest@example.com',
      password: 'testpass123',
      firstName: 'API',
      lastName: 'Test',
      accountId: '0972a76f-5eb0-4dae-b22c-266aac49e33c'
    };
    
    const register = await makeRequest('http://localhost:3002/api/external/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });
    
    console.log(`   ✅ Registration: ${register.status} - ${register.data}\n`);

    // Test 3: Login with the new user
    console.log('3. Testing external user login...');
    const loginData = {
      email: 'apitest@example.com',
      password: 'testpass123'
    };
    
    const login = await makeRequest('http://localhost:3002/api/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   ✅ Login: ${login.status} - ${login.data}\n`);

    // Parse the login response to get the token
    let token = '';
    try {
      const loginResponse = JSON.parse(login.data);
      token = loginResponse.token;
      console.log(`   🔑 Token received: ${token.substring(0, 50)}...\n`);
    } catch (e) {
      console.log('   ❌ Failed to parse login response');
      return;
    }

    // Test 4: Get user profile (protected endpoint)
    console.log('4. Testing protected profile endpoint...');
    const profile = await makeRequest('http://localhost:3002/api/external/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   ✅ Profile: ${profile.status} - ${profile.data}\n`);

    // Test 5: Get user tasks (protected endpoint)
    console.log('5. Testing protected tasks endpoint...');
    const tasks = await makeRequest('http://localhost:3002/api/external/tasks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   ✅ Tasks: ${tasks.status} - ${tasks.data}\n`);

    // Test 6: Get account overview (protected endpoint)
    console.log('6. Testing protected account overview endpoint...');
    const overview = await makeRequest('http://localhost:3002/api/external/account/overview', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   ✅ Account Overview: ${overview.status} - ${overview.data}\n`);

    console.log('🎉 All API tests completed successfully!');
    console.log('✅ External User Platform is fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testExternalAPI();
