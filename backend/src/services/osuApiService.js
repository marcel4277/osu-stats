import axios from 'axios';

const OSU_API_BASE = 'https://osu.ppy.sh/api/v2';
const OSU_OAUTH_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';
const REQUEST_TIMEOUT_MS = 10000;

// Score requests ask for the API's current score format. The old format (sent
// when no version is given) only has the stable score, which is 0 for anything
// set on lazer. Any version from 20220705 on switches to the current format.
const SCORE_FORMAT_HEADERS = { 'x-api-version': '20220705' };
const RULESET_NAMES = ['osu', 'taiko', 'fruits', 'mania'];

// Errors carry the osu! HTTP status so callers can check `error.status === 404`
function apiError(status, message) {
  const text = status === 404 ? `Not found: ${message}`
    : status === 401 ? 'Unauthorized: Check API credentials'
    : `API error (${status}): ${message}`;
  const error = new Error(text);
  error.status = status;
  return error;
}

export class OsuApiService {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.tokenRequest = null;
  }

  // Requests that arrive while a new token is being fetched wait for that one
  // instead of each requesting their own.
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }
    if (!this.tokenRequest) {
      this.tokenRequest = this._fetchAccessToken().finally(() => { this.tokenRequest = null; });
    }
    return this.tokenRequest;
  }

  async _fetchAccessToken() {
    console.log('[OsuApiService] Requesting new access token');

    try {
      const response = await axios.post(OSU_OAUTH_TOKEN_URL, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: 'public',
      }, { timeout: REQUEST_TIMEOUT_MS });

      const { access_token, expires_in } = response.data;

      if (!access_token) {
        throw new Error('No access token in OAuth response');
      }

      this.accessToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;
      return this.accessToken;
    } catch (error) {
      console.error('[OsuApiService] OAuth2 error:', error.message);
      throw new Error(`Failed to get OAuth2 token: ${error.message}`);
    }
  }

  // A cached token can be revoked before it expires. On a 401 the token is
  // dropped and the request is retried once with a fresh one.
  async _request(method, endpoint, config = {}, isRetry = false) {
    try {
      const token = await this.getAccessToken();

      const response = await axios({
        method,
        url: `${OSU_API_BASE}${endpoint}`,
        timeout: REQUEST_TIMEOUT_MS,
        ...config,
        // After ...config, so extra headers are merged in rather than replacing Authorization
        headers: {
          Authorization: `Bearer ${token}`,
          ...config.headers,
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        if (status === 401) {
          this.accessToken = null;
          this.tokenExpiresAt = null;
          if (!isRetry) return this._request(method, endpoint, config, true);
        }
        throw apiError(status, message);
      }
      throw error;
    }
  }

  // Maps a score in the current API format. Stable scores have a
  // legacy_score_id; scores set on lazer don't.
  //   score:    stable scores keep their original score; lazer scores use
  //             total_score, the standardised score the osu! website shows.
  //   accuracy: rounded down to 2 decimals, like the osu! website and client.
  //   url:      /scores/{id} works for stable and lazer scores alike.
  _mapScore(score) {
    const isLazer = score.legacy_score_id == null;
    return {
      id: score.id,
      url: `https://osu.ppy.sh/scores/${score.id}`,
      mode: RULESET_NAMES[score.ruleset_id] ?? 'osu',
      beatmap_id: score.beatmap?.id,
      beatmapset_id: score.beatmapset?.id,
      // Map background (800x280), used as a muted backdrop on the score row
      cover_url: score.beatmapset?.covers?.['card@2x'] ?? null,
      title: score.beatmapset?.title || 'Unknown',
      artist: score.beatmapset?.artist || 'Unknown',
      pp: score.pp ? Math.round(score.pp) : null,
      accuracy: (Math.floor(score.accuracy * 10000) / 100).toFixed(2),
      score: isLazer ? score.total_score : score.legacy_total_score,
      is_lazer: isLazer,
      combo: score.max_combo,
      mods: (score.mods || []).map(mod => mod.acronym),
      date: score.ended_at,
    };
  }

  async getUserByUsername(username) {
    const data = await this._request('GET', `/users/${encodeURIComponent(username)}`);
    return {
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      // Profile banner; osu! gives everyone one (a default if they haven't set their own)
      cover_url: data.cover?.url ?? data.cover_url ?? null,
      country: data.country?.code || 'Unknown',
      playcount: data.statistics?.play_count || 0,
      play_time: data.statistics?.play_time || 0, // seconds
      stats: {
        global_rank: data.statistics?.global_rank || null,
        country_rank: data.statistics?.country_rank || null,
        pp: data.statistics?.pp || 0,
        accuracy: (data.statistics?.hit_accuracy || 0).toFixed(2),
      },
      rank_history: data.rank_history?.data || [],
    };
  }

  // Fetch a single page of best scores with offset support
  async getUserBestScoresPage(userId, limit, offset = 0) {
    const data = await this._request('GET', `/users/${userId}/scores/best`, {
      params: { limit: Math.min(limit, 100), offset },
      headers: SCORE_FORMAT_HEADERS,
    });
    if (!Array.isArray(data)) return [];
    return data.map(s => this._mapScore(s));
  }

  async getUserRecentScores(userId, limit = 50) {
    const data = await this._request('GET', `/users/${userId}/scores/recent`, {
      params: { limit: Math.min(limit, 100), include_fails: 0 },
      headers: SCORE_FORMAT_HEADERS,
    });
    if (!Array.isArray(data)) return [];
    return data.map(s => this._mapScore(s));
  }
}

export default OsuApiService;
