import axios from 'axios';

// VITE_API_URL=https://hcms.raksadigital.com untuk production
// Kosong = relative URL (dev + server yang sama origin)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

// Attach CSRF token before mutating requests
http.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    const token = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
    if (token) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  return config;
});

// Redirect to login on 401
http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) window.location.href = '/login';
    return Promise.reject(error);
  }
);

export default http;
