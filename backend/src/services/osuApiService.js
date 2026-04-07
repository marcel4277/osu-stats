import axios from 'axios';

const OSU_API_BASE = 'https://osu.ppy.sh/api/v2';
const OSU_OAUTH_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';

export class OsuApiService {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }

    console.log('[OsuApiService] Requesting new access token');

    try {
      const response = await axios.post(OSU_OAUTH_TOKEN_URL, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: 'public',
      });

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

  async _request(method, endpoint, config = {}) {
    try {
      const token = await this.getAccessToken();

      const response = await axios({
        method,
        url: `${OSU_API_BASE}${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          ...config.headers,
        },
        ...config,
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        if (status === 404) throw new Error(`Not found: ${message}`);
        if (status === 401) {
          this.accessToken = null;
          this.tokenExpiresAt = null;
          throw new Error('Unauthorized: Check API credentials');
        }
        throw new Error(`API error (${status}): ${message}`);
      }
      throw error;
    }
  }

  _mapScore(score) {
    return {
      id: score.id,
      beatmap_id: score.beatmap?.id,
      beatmapset_id: score.beatmapset?.id,
      title: score.beatmapset?.title || 'Unknown',
      artist: score.beatmapset?.artist || 'Unknown',
      pp: score.pp ? Math.round(score.pp) : null,
      accuracy: (score.accuracy * 100).toFixed(2),
      score: score.score,
      combo: score.max_combo,
      mods: score.mods || [],
      date: score.created_at,
    };
  }

  async getUserByUsername(username) {
    const data = await this._request('GET', `/users/${encodeURIComponent(username)}`);
    return {
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      country: data.country?.code || 'Unknown',
      playcount: data.statistics?.play_count || 0,
      stats: {
        global_rank: data.statistics?.global_rank || null,
        country_rank: data.statistics?.country_rank || null,
        pp: data.statistics?.pp || 0,
        accuracy: (data.statistics?.hit_accuracy || 0).toFixed(2),
      },
    };
  }

  // Fetch a single page of best scores with offset support
  async getUserBestScoresPage(userId, limit, offset = 0) {
    const data = await this._request('GET', `/users/${userId}/scores/best`, {
      params: { limit: Math.min(limit, 100), offset },
    });
    if (!Array.isArray(data)) return [];
    return data.map(s => this._mapScore(s));
  }

  async getUserBestScores(userId, limit = 50) {
    return this.getUserBestScoresPage(userId, limit, 0);
  }

  async getUserRecentScores(userId, limit = 50) {
    const data = await this._request('GET', `/users/${userId}/scores/recent`, {
      params: { limit: Math.min(limit, 100), include_fails: 0 },
    });
    if (!Array.isArray(data)) return [];
    return data.map(s => this._mapScore(s));
  }
}

export default OsuApiService;
