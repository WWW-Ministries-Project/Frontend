// axiosInstance.js
import axios from 'axios';
import { getToken } from './utils/helperFunctions';
import { baseUrl } from './pages/Authentication/utils/helpers';

const instance = axios.create({
  baseURL: baseUrl, // Your API base URL
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  },
});

export default instance;
