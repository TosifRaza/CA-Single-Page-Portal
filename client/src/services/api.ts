import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ca_proflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try refresh token first
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data?.data?.token;
        if (newToken) {
          localStorage.setItem('ca_proflow_token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // If refresh fails (e.g. fresh browser session or expired cookie), auto-authenticate with demo user
        try {
          const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'tosif@rizassociates.com',
            password: 'Password123!',
          });
          const demoToken = loginRes.data?.data?.token;
          if (demoToken) {
            localStorage.setItem('ca_proflow_token', demoToken);
            localStorage.setItem('ca_proflow_user', JSON.stringify(loginRes.data.data.user));
            api.defaults.headers.common['Authorization'] = `Bearer ${demoToken}`;
            originalRequest.headers.Authorization = `Bearer ${demoToken}`;
            processQueue(null, demoToken);
            return api(originalRequest);
          }
        } catch (loginErr) {
          processQueue(loginErr, null);
          localStorage.removeItem('ca_proflow_token');
          localStorage.removeItem('ca_proflow_user');
        }
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
