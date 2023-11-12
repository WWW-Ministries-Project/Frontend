// axiosInstance.js
import axios from 'axios';
import { getToken } from './utils/helperFunctions';

const instance = axios.create({
  baseURL: 'https://api.example.com', // Your API base URL
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  },
});

export default instance;
