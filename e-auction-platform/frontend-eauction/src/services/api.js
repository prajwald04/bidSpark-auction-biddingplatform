import axios from 'axios';

// Detect if we're in production (deployed on Netlify)
const isProduction = process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost';

// Use environment variable or fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Warn if API URL is not configured in production
if (isProduction && !process.env.REACT_APP_API_URL) {
  console.error('⚠️ REACT_APP_API_URL environment variable is not set in Netlify!');
  console.error('Please set REACT_APP_API_URL in Netlify environment variables.');
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    
    // Enhance network errors with helpful messages
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      const isProduction = process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost';
      if (isProduction && !process.env.REACT_APP_API_URL) {
        error.userMessage = 'Backend server URL is not configured. Please contact the administrator.';
      } else {
        error.userMessage = `Cannot connect to backend server at ${API_BASE_URL}. Please check if the server is running.`;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;