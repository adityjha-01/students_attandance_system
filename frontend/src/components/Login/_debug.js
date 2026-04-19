/**
 * DEBUG SCRIPT - Remove after testing
 * Add console logging to diagnose login issues
 */

// Test 1: Check if axiosInstance is configured correctly
export const testAxiosConfig = () => {
  import('../../services/api').then(module => {
    console.log('✓ API module loaded successfully');
    console.log('Base URL should be: http://localhost:5000/api');
  }).catch(err => console.error('✗ Failed to load API module:', err));
};

// Test 2: Check localStorage
export const testLocalStorage = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  console.log('Token in storage:', token ? 'YES' : 'NO');
  console.log('User in storage:', user ? 'YES' : 'NO');
};

// Test 3: Simulate login flow
export const testLoginFlow = async (email, password, userType) => {
  console.log(`🔄 Testing login flow...`);
  console.log(`Email: ${email}, UserType: ${userType}`);
  
  try {
    const axios = (await import('axios')).default;
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password,
      user_type: userType
    });
    
    console.log('✓ Login successful:', response.data);
    console.log('Token:', response.data.data.token);
    console.log('User:', response.data.data.user);
    
    // Save to localStorage like the frontend does
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
    console.log('✓ Data saved to localStorage');
    
    return response.data;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    throw error;
  }
};

// Export for testing in browser console
window.__debugLogin = {
  testAxiosConfig,
  testLocalStorage,
  testLoginFlow,
  help: () => {
    console.log('Debug functions available:');
    console.log('1. window.__debugLogin.testAxiosConfig() - Check API configuration');
    console.log('2. window.__debugLogin.testLocalStorage() - Check localStorage');
    console.log('3. window.__debugLogin.testLoginFlow("roll1@gmail.com", "password123", "student") - Test login');
  }
};
