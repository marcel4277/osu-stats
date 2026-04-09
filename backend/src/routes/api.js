import express from 'express';
import axios from 'axios';
import config from '../config/env.js';
import OsuApiService from '../services/osuApiService.js';
import { getCacheEntry, setCacheEntry } from '../services/scoreCache.js';

const router = express.Router();
const osuApi = new OsuApiService(config.OSU_API_ID, config.OSU_API_SECRET);

const REDIS_URL = config.UPSTASH_REDIS_URL;
const REDIS_TOKEN = config.UPSTASH_REDIS_TOKEN;

async function redisCommand(command) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await axios.get(`${REDIS_URL}/${command}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
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
    const user = await osuApi.getUserByUsername(username);
    res.json(user);
  } catch (error) {
    if (error.message.includes('Not found')) {
      return res.status(404).json({ error: 'User not found', message: `"${username}" does not exist on osu!` });
    }
    console.error(`[api] GET /user/${username}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/user/:username/scores
// Query: type ('best'|'recent', default 'best')
//
// Cache-hit  → return immediately
// Cache-miss → fetch all pages in parallel, cache, respond (always complete: true)
router.get('/user/:username/scores', async (req, res) => {
  const { username } = req.params;
  const validationError = validateUsername(username);
  if (validationError) {
    return res.status(400).json({ error: 'Bad Request', message: validationError });
  }

  const rawType = req.query.type ?? 'best';
  const type = ALLOWED_TYPES.has(rawType) ? rawType : 'best';

  try {
    const user = await osuApi.getUserByUsername(username);
    const cacheKey = `${user.id}:${type}`;
    const cached = getCacheEntry(cacheKey);

    // --- Cache hit ---
    if (cached) {
      return res.json({ username: user.username, user_id: user.id, type, scores: cached.scores, complete: true });
    }

    // --- Cache miss: fetch all pages in parallel ---
    let allScores;
    if (type === 'recent') {
      allScores = await osuApi.getUserRecentScores(user.id, 50);
    } else {
      const pages = await Promise.all([
        osuApi.getUserBestScoresPage(user.id, 50, 0),
        osuApi.getUserBestScoresPage(user.id, 50, 50),
        osuApi.getUserBestScoresPage(user.id, 50, 100),
        osuApi.getUserBestScoresPage(user.id, 50, 150),
      ]);
      allScores = pages.flat();
    }

    setCacheEntry(cacheKey, allScores, true);
    console.log(`[cache] ${username}: ${allScores.length} scores cached`);
    res.json({ username: user.username, user_id: user.id, type, scores: allScores, complete: true });
  } catch (error) {
    if (error.message.includes('Not found')) {
      return res.status(404).json({ error: 'User not found', message: `"${username}" does not exist on osu!` });
    }
    console.error(`[api] GET /user/${username}/scores: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

export default router;
