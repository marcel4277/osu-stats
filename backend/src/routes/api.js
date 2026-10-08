import express from 'express';
import config from '../config/env.js';
import OsuApiService from '../services/osuApiService.js';
import { createCache } from '../services/cache.js';
import { redisCommand } from '../services/store.js';

const router = express.Router();
const osuApi = new OsuApiService(config.OSU_API_ID, config.OSU_API_SECRET);

// osu! data is kept for 30 minutes. The refresh button can ask for new data
// once it's a minute old.
const CACHE_TTL_MS = 30 * 60 * 1000;
const MIN_REFRESH_MS = 60 * 1000;
// The `v1` in the names: change it whenever the stored shape changes, so old
// copies in Redis are ignored instead of reaching the site.
const userCache = createCache({ name: 'user:v1', ttlMs: CACHE_TTL_MS, minRefreshMs: MIN_REFRESH_MS, maxEntries: 200 });
const scoreCache = createCache({ name: 'scores:v3', ttlMs: CACHE_TTL_MS, minRefreshMs: MIN_REFRESH_MS, maxEntries: 100 });

// osu! usernames are case-insensitive, so "Cookiezi" and "cookiezi" share an entry.
// The frontend asks for the profile and the scores at the same time; both go
// through here, so that's one osu! lookup instead of two.
function getUser(username, refresh) {
  return userCache(username.toLowerCase(), () => osuApi.getUserByUsername(username), { refresh });
}

function getScores(userId, type, refresh) {
  return scoreCache(`${userId}:${type}`, async () => {
    if (type === 'recent') return osuApi.getUserRecentScores(userId, 50);
    // Best scores: osu! keeps 200, fetched as two pages of 100 in parallel
    const pages = await Promise.all(
      [0, 100].map(offset => osuApi.getUserBestScoresPage(userId, 100, offset)),
    );
    return pages.flat();
  }, { refresh });
}

// GET /api/visits — return current count
router.get('/visits', async (_req, res) => {
  const count = await redisCommand('GET', 'visits') ?? 0;
  res.json({ count: Number(count) });
});

// POST /api/visits — increment and return new count.
// Only visits to the live site count; preview builds just read the number.
router.post('/visits', async (req, res) => {
  const command = req.get('Origin') === config.FRONTEND_URL ? 'INCR' : 'GET';
  const count = await redisCommand(command, 'visits') ?? 0;
  res.json({ count: Number(count) });
});

// Turns a failed osu! lookup into an answer a visitor can understand.
function sendError(res, error, username, what) {
  if (error.status === 404) {
    return res.status(404).json({ error: 'User not found', message: `"${username}" does not exist on osu!` });
  }
  if (error.busy) {
    return res.status(503).json({ error: 'Busy', message: 'osu! is getting a lot of requests from this site right now. Try again in a minute.' });
  }
  console.error(`[api] ${what} for ${username}: ${error.message}`);
  // No status means osu! didn't answer at all (a timeout or a network error)
  if (!error.status || error.status >= 500) {
    return res.status(502).json({ error: 'osu! unavailable', message: "osu! isn't answering right now. Try again in a few minutes." });
  }
  res.status(500).json({ error: 'Server error', message: 'Something went wrong loading this player. Try again in a moment.' });
}

const MAX_USERNAME_LEN = 64;
const ALLOWED_TYPES = new Set(['best', 'recent']);

function validateUsername(username) {
  if (!username || !username.trim()) return 'Username is required';
  if (username.length > MAX_USERNAME_LEN) return 'Username is too long';
  return null;
}

// GET /api/health
router.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

// GET /api/user/:username — fetch osu! user profile
// Query: refresh=1 asks for new data from osu! (see createCache)
router.get('/user/:username', async (req, res) => {
  const { username } = req.params;
  const validationError = validateUsername(username);
  if (validationError) {
    return res.status(400).json({ error: 'Bad Request', message: validationError });
  }

  try {
    const { data: user, fetchedAt } = await getUser(username, req.query.refresh === '1');
    res.json({ ...user, fetched_at: new Date(fetchedAt).toISOString() });
  } catch (error) {
    sendError(res, error, username, 'profile');
  }
});

// GET /api/user/:username/scores
// Query: type ('best'|'recent', default 'best'), refresh=1 as above
router.get('/user/:username/scores', async (req, res) => {
  const { username } = req.params;
  const validationError = validateUsername(username);
  if (validationError) {
    return res.status(400).json({ error: 'Bad Request', message: validationError });
  }

  const rawType = req.query.type ?? 'best';
  const type = ALLOWED_TYPES.has(rawType) ? rawType : 'best';
  const refresh = req.query.refresh === '1';

  try {
    const { data: user } = await getUser(username, refresh);
    const { data: scores, fetchedAt } = await getScores(user.id, type, refresh);
    res.json({ username: user.username, user_id: user.id, type, scores, fetched_at: new Date(fetchedAt).toISOString() });
  } catch (error) {
    sendError(res, error, username, 'top plays');
  }
});

export default router;
