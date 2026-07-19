import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred';

    if (error?.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
