import axios from 'axios';
import config from '../config/env.js';

// Upstash Redis over its REST API. Used for the visit counter and as the
// long-lived copy of osu! results, so they survive the server restarting or
// going to sleep.
//
// Redis is never required: without it configured, or if it's slow or down,
// every call returns null and the site carries on without it.
const REDIS_URL = config.UPSTASH_REDIS_URL;
const REDIS_TOKEN = config.UPSTASH_REDIS_TOKEN;
const TIMEOUT_MS = 2000;

export async function redisCommand(...command) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await axios.post(REDIS_URL, command.map(String), {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      timeout: TIMEOUT_MS,
    });
    return res.data.result ?? null;
  } catch (error) {
    console.error(`[store] ${command[0]} failed: ${error.message}`);
    return null;
  }
}

export async function getJson(key) {
  const text = await redisCommand('GET', key);
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function setJson(key, value, ttlMs) {
  return redisCommand('SET', key, JSON.stringify(value), 'PX', ttlMs);
}
