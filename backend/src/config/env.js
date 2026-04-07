/**
 * Environment Configuration Loader
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Export environment variables with defaults
export const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5174',

  // osu! API
  OSU_API_ID: process.env.OSU_API_ID,
  OSU_API_SECRET: process.env.OSU_API_SECRET,
};

// Validate required env vars in production
if (config.NODE_ENV === 'production') {
  const required = ['OSU_API_ID', 'OSU_API_SECRET'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default config;
