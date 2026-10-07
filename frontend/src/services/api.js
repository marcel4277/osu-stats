import axios from 'axios';

// In dev, Vite proxies /api → localhost:5000 so no CORS needed.
// In production, VITE_API_URL must be set to the deployed backend URL.
// Long timeouts on purpose: the backend's host puts it to sleep when it's
// quiet, and the first request after that can take 30–50 seconds to answer.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 60000,
});

// refresh: ask the backend for new data from osu! instead of its saved copy
const refreshParams = refresh => (refresh ? { refresh: 1 } : {});

export const osuAPI = {
  getUser: async (username, { refresh = false } = {}) => {
    const response = await api.get(`/user/${encodeURIComponent(username)}`, {
      params: refreshParams(refresh),
    });
    return response.data;
  },

  getUserScores: async (username, type = 'best', { refresh = false } = {}) => {
    const response = await api.get(`/user/${encodeURIComponent(username)}/scores`, {
      params: { type, ...refreshParams(refresh) },
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

// A message a visitor can understand, whatever went wrong. The backend sends
// its own for everything it knows about (unknown player, osu! busy or down).
export function errorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') return 'The server took too long to answer. Try again in a moment.';
  if (!err.response) return "Couldn't reach the server. Check your connection and try again.";
  return 'Something went wrong loading this player. Try again in a moment.';
}

export default osuAPI;