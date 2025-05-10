const axios = require('axios');

// Get the Replit domain from environment
const domain = process.env.REPL_SLUG ? 
  `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
  'http://localhost:3000';

async function login() {
  try {
    console.log('Logging in as dentist...');
    console.log('Using domain:', domain);
    
    const loginResponse = await axios.post(`${domain}/auth/login`, {
      username: 'dentist',
      password: 'password'
    }, { withCredentials: true });
    
    console.log('Login response:', loginResponse.data);
    
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