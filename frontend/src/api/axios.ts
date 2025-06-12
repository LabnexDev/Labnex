import axios from 'axios';

// Determine the correct API base URL based on environment
export const getApiBaseUrl = () => {
  // Check if we're in a production environment
  const isProduction = import.meta.env.PROD;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isProduction && !isLocalhost) {
    // Production deployment - use the production backend URL
    return import.meta.env.VITE_PRODUCTION_API_URL || 'https://labnex-backend.onrender.com/api';
  } else {
    // Development mode - use local backend or custom dev API URL
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
};

const baseURL = getApiBaseUrl();

console.log('Environment:', import.meta.env.MODE);
console.log('Production mode:', import.meta.env.PROD);
console.log('API Base URL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // MUST BE TRUE
  timeout: 30000, // 30 second timeout for production
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', `${config.baseURL}${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    // Handle network errors in production
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.error('Network error - check if backend is running at:', baseURL);
    }
    
    if (error.response?.status === 401) {
      console.log('Unauthorized, clearing token');
      localStorage.removeItem('token');
      // Let React Router handle the redirect via AuthContext and PrivateRoute
      // Don't use window.location.href as it causes redirect loops
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 