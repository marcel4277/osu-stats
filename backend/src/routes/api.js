import express from 'express';
import axios from 'axios';
import config from '../config/env.js';
import OsuApiService from '../services/osuApiService.js';
import { createCache } from '../services/cache.js';

const router = express.Router();
const osuApi = new OsuApiService(config.OSU_API_ID, config.OSU_API_SECRET);

const CACHE_TTL_MS = 5 * 60 * 1000;
const userCache = createCache({ ttlMs: CACHE_TTL_MS, maxEntries: 200 });
const scoreCache = createCache({ ttlMs: CACHE_TTL_MS, maxEntries: 100 });

// osu! usernames are case-insensitive, so "Cookiezi" and "cookiezi" share an entry.
// The frontend asks for the profile and the scores at the same time; both go
// through here, so that's one osu! lookup instead of two.
function getUser(username) {
  return userCache(username.toLowerCase(), () => osuApi.getUserByUsername(username));
}

function getScores(userId, type) {
  return scoreCache(`${userId}:${type}`, async () => {
    if (type === 'recent') return osuApi.getUserRecentScores(userId, 50);
    // Best scores: 200 max, fetched as four pages of 50 in parallel
    const pages = await Promise.all(
      [0, 50, 100, 150].map(offset => osuApi.getUserBestScoresPage(userId, 50, offset)),
    );
    return pages.flat();
  });
}

const REDIS_URL = config.UPSTASH_REDIS_URL;
const REDIS_TOKEN = config.UPSTASH_REDIS_TOKEN;

async function redisCommand(command) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await axios.get(`${REDIS_URL}/${command}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      timeout: 5000,
    });
    return res.data.result;
  } catch {
    return null;
  }
}

// GET /api/visits — return current count
router.get('/visits', async (_req, res) => {
  const count = await redisCommand('get/visits') ?? 0;
  res.json({ count: Number(count) });
});

// POST /api/visits — increment and return new count
router.post('/visits', async (_req, res) => {
  const count = await redisCommand('incr/visits') ?? 0;
  res.json({ count: Number(count) });
});

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
router.get('/user/:username', async (req, res) => {
  const { username } = req.params;
  const validationError = validateUsername(username);
  if (validationError) {
    return res.status(400).json({ error: 'Bad Request', message: validationError });
  }

  try {
    const user = await getUser(username);
    res.json(user);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'User not found', message: `"${username}" does not exist on osu!` });
    }
    console.error(`[api] GET /user/${username}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/user/:username/scores
// Query: type ('best'|'recent', default 'best')
router.get('/user/:username/scores', async (req, res) => {
  const { username } = req.params;
  const validationError = validateUsername(username);
  if (validationError) {
    return res.status(400).json({ error: 'Bad Request', message: validationError });
  }

  const rawType = req.query.type ?? 'best';
  const type = ALLOWED_TYPES.has(rawType) ? rawType : 'best';

  try {
    const user = await getUser(username);
    const scores = await getScores(user.id, type);
    res.json({ username: user.username, user_id: user.id, type, scores });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'User not found', message: `"${username}" does not exist on osu!` });
    }
    console.error(`[api] GET /user/${username}/scores: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

export default router;
