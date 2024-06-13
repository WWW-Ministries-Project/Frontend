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
export const pictureInstance = axios.create({
  baseURL: baseUrl, // Your API base URL
  headers: {
    'Content-Type': 'multipart/form-data', // Use multipart/form-data for sending files
    'Authorization': `Bearer ${getToken()}`,
  },
});

export const changeAuth=(token)=>{
    instance.defaults.headers['Authorization'] = `Bearer ${token}`;
    pictureInstance.defaults.headers['Authorization'] = `Bearer ${token}`;
}

export default instance;
