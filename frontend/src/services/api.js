import axios from 'axios';

// In dev, Vite proxies /api → localhost:5000 so no CORS needed.
// In production, VITE_API_URL must be set to the deployed backend URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 10000,
});

export const osuAPI = {
  getUser: async (username) => {
    const response = await api.get(`/user/${encodeURIComponent(username)}`);
    return response.data;
  },

  getUserScores: async (username, type = 'best') => {
    const response = await api.get(`/user/${encodeURIComponent(username)}/scores`, {
      params: { type },
      timeout: 30000,
    });
    return response.data;
  },

  recordVisit: async () => {
    const response = await api.post('/visits');
    return response.data.count;
  },

  getVisits: async () => {
    const response = await api.get('/visits');
    return response.data.count;
  },
};

export default osuAPI;