/**
 * Script to test the authentication API endpoints
 * This helps verify that the server's login/register functionality works
 */

const axios = require('axios');

async function testAuthAPI() {
  console.log('Testing authentication API endpoints...');

  try {
    // In Replit, the Express server is usually exposed directly through the Replit URL
    // rather than through localhost with a specific port
    const baseURL = ''; // We'll use relative URLs that will work with the Replit domain
    
    // 1. Test login endpoint
    console.log('\n1. Testing login endpoint with valid credentials');
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        username: 'dentist',
        password: 'password'
      });
      
      console.log('✅ Login successful!');
      console.log('Response:', loginResponse.status, loginResponse.statusText);
      console.log('User data:', loginResponse.data);
    } catch (error) {
      console.error('❌ Login failed:');
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server. The server may not be running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
    }
    
    // 2. Test invalid login
    console.log('\n2. Testing login endpoint with invalid credentials');
    try {
      const invalidLoginResponse = await axios.post(`${baseURL}/auth/login`, {
        username: 'nonexistent',
        password: 'wrongpassword'
      });
      console.log('Response:', invalidLoginResponse.status, invalidLoginResponse.statusText);
      console.log('This should not succeed - check authentication logic!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid login correctly returned 401 Unauthorized');
      } else {
        console.error('❌ Invalid login test failed with unexpected error:');
        console.error(error.response ? error.response.data : error.message);
      }
    }
    
    // 3. Check user endpoint (should be authenticated only)
    console.log('\n3. Testing user endpoint without authentication');
    try {
      const userResponse = await axios.get(`${baseURL}/user`);
      console.log('Response:', userResponse.status, userResponse.statusText);
      console.log('This should not succeed - check authentication middleware!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ User endpoint correctly returned 401 for unauthenticated request');
      } else {
        console.error('❌ User endpoint test failed with unexpected error:');
        console.error(error.response ? error.response.data : error.message);
      }
    }
    
    console.log('\nAuth API test completed.');
  } catch (error) {
    console.error('Test failed with an unexpected error:', error);
  }
}

testAuthAPI().catch(console.error);