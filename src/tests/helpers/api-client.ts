/**
 * API Client Helper for Tests
 */

import axios from 'axios';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add test bypass header for development
    'X-Test-Bypass-Auth': process.env.NODE_ENV === 'test' ? 'test-mode' : undefined,
  },
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.DEBUG_API_TESTS) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      if (config.data) console.log('Request Body:', config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.DEBUG_API_TESTS) {
      console.log('API Response:', response.status, response.data);
    }
    return response;
  },
  (error) => {
    if (process.env.DEBUG_API_TESTS) {
      console.error('API Error:', error.message);
      if (error.response) {
        console.error('Error Response:', error.response.status, error.response.data);
      }
    }
    return Promise.reject(error);
  }
);
