import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.DOKPLOY_URL || 'http://localhost:3000';
export const DOKPLOY_URL = rawUrl.replace(/\/api\/?$/, '');
export const DOKPLOY_TOKEN = process.env.DOKPLOY_TOKEN || 'your-dokploy-token';

export const dokployApi = axios.create({
  baseURL: `${DOKPLOY_URL}/api/trpc`,
  headers: {
    Authorization: `Bearer ${DOKPLOY_TOKEN}`,
    'x-api-key': DOKPLOY_TOKEN,
  },
});

export const dokployRestApi = axios.create({
  baseURL: `${DOKPLOY_URL}/api`,
  headers: {
    Authorization: `Bearer ${DOKPLOY_TOKEN}`,
    'x-api-key': DOKPLOY_TOKEN,
  },
});
