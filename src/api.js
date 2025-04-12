// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL, // 👈 use this for Vue CLI env
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Base URL:', process.env.VUE_APP_API_URL); // optional for debugging

export default api;
