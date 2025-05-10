const axios = require('axios');
const { db } = require('./server/db');
require('dotenv').config();

async function login() {
  try {
    console.log('Logging in as dentist...');
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      username: 'dentist',
      password: 'password'
    }, { withCredentials: true });
    
    console.log('Login response:', loginResponse.data);
    
    // Use the cookie from the login response
    const cookies = loginResponse.headers['set-cookie'];
    
    // Now fetch patients with the authenticated session
    console.log('Fetching patients...');
    const patientsResponse = await axios.get('http://localhost:3000/api/patients', {
      headers: {
        Cookie: cookies.join('; ')
      }
    });
    
    console.log('Patients response:', JSON.stringify(patientsResponse.data, null, 2));
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

login();