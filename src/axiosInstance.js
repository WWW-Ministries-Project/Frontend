// axiosInstance.js
import axios from 'axios';
import { getToken } from './utils/helperFunctions'; // Assuming this fetches the latest token
import { baseUrl } from './pages/Authentication/utils/helpers';

// Create an Axios instance with interceptors to dynamically fetch the latest token
const instance = axios.create({
  baseURL: baseUrl, // Your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pictureInstance = axios.create({
  baseURL: baseUrl, // Your API base URL
  headers: {
    'Content-Type': 'multipart/form-data', // Use multipart/form-data for sending files
  },
});

// Interceptor to dynamically add the Authorization header before each request
instance.interceptors.request.use(
  (config) => {
    const token = getToken(); // Fetch the latest token here
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

pictureInstance.interceptors.request.use(
  (config) => {
    const token = getToken(); // Fetch the latest token here
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to manually change the token (if needed)
export const changeAuth = (token) => {
  instance.defaults.headers['Authorization'] = `Bearer ${token}`;
  pictureInstance.defaults.headers['Authorization'] = `Bearer ${token}`;
};

export default instance;
