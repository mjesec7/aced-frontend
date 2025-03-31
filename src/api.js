import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Private backend URL from .env
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log("API Base URL:", import.meta.env.VITE_API_URL);

export default api;
