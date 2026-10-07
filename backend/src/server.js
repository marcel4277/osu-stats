import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import config from './config/env.js';
import apiRouter from './routes/api.js';

const app = express();

// Render sits in front of the app as a reverse proxy. Without this, req.ip is the
// proxy's address and every visitor shares one rate-limit bucket.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Rate limiting: 60 requests per minute per IP — applied to /api only, not /health
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again in a minute.' },
});

// CORS — the live site, plus this project's own Vercel preview builds, so every
// pull request can be checked with real players. Preview addresses look like
// osu-stats-<hash or git-branch>-marcel4277s-projects.vercel.app; the team name
// at the end is what keeps other people's Vercel sites out.
const PREVIEW_ORIGIN = /^https:\/\/osu-stats-[a-z0-9-]+-marcel4277s-projects\.vercel\.app$/;

function allowedOrigin(origin) {
  if (origin && PREVIEW_ORIGIN.test(origin)) return origin;
  return config.FRONTEND_URL;
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigin(req.get('Origin')));
  // The answer depends on who's asking, so caches must keep one copy per origin
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', limiter, apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `${req.method} ${req.path} not found` });
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${err.message}`);
  // Never expose internal error details to clients in production
  const message = config.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  res.status(statusCode).json({
    error: message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(config.PORT, () => {
  console.log(`osu! Stats backend running on http://localhost:${config.PORT} [${config.NODE_ENV}]`);
});

export default app;
