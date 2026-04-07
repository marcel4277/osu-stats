import express from 'express';
import config from '../config/env.js';
import OsuApiService from '../services/osuApiService.js';
import { getCacheEntry, setCacheEntry, acquireFetchLock, releaseFetchLock } from '../services/scoreCache.js';

const router = express.Router();
const osuApi = new OsuApiService(config.OSU_API_ID, config.OSU_API_SECRET);

let visitorCount = 0;

// GET /api/visits — return current count
router.get('/visits', (_req, res) => {
  res.json({ count: visitorCount });
});

// POST /api/visits — increment and return new count
router.post('/visits', (_req, res) => {
  visitorCount += 1;
  res.json({ count: visitorCount });
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
// Cache-miss flow:
//   1. Fetch first 50 scores, write to cache (complete: false), respond immediately
//   2. Acquire fetch lock and background-fetch offsets 50/100/150 in parallel
//   3. Merge into cache (complete: true), release lock
//
// Cache-hit flow:
//   - complete: true  → return full scores
//   - complete: false → return { complete: false } only (background fetch still running)
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
      if (!cached.complete) {
        return res.json({ username: user.username, user_id: user.id, type, complete: false });
      }
      return res.json({ username: user.username, user_id: user.id, type, scores: cached.scores, complete: true });
    }

    // --- Cache miss: fetch first 50 and respond immediately ---
    const initialScores = type === 'recent'
      ? await osuApi.getUserRecentScores(user.id, 50)
      : await osuApi.getUserBestScoresPage(user.id, 50, 0);

    const complete = type === 'recent';
    setCacheEntry(cacheKey, initialScores, complete);

    res.json({ username: user.username, user_id: user.id, type, scores: initialScores, complete });

    // --- Background fetch remaining 150 best scores ---
    // acquireFetchLock returns false if a fetch is already in progress,
    // which prevents a race if two requests land simultaneously on a cold cache.
    if (type === 'best' && acquireFetchLock(cacheKey)) {
      (async () => {
        try {
          const pages = await Promise.all([
            osuApi.getUserBestScoresPage(user.id, 50, 50),
            osuApi.getUserBestScoresPage(user.id, 50, 100),
            osuApi.getUserBestScoresPage(user.id, 50, 150),
          ]);

          const allScores = [...initialScores, ...pages.flat()];
          setCacheEntry(cacheKey, allScores, true);
          console.log(`[cache] ${username}: ${allScores.length} scores cached`);
        } catch (err) {
          console.error(`[cache] Background fetch failed for ${username}:`, err.message);
          setCacheEntry(cacheKey, initialScores, true);
        } finally {
          releaseFetchLock(cacheKey);
        }
      })();
    }
  } catch (error) {
    if (error.message.includes('Not found')) {
      return res.status(404).json({ error: 'User not found', message: `"${username}" does not exist on osu!` });
    }
    console.error(`[api] GET /user/${username}/scores: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

export default router;
