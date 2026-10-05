# osustats.app

A player stats site for osu! — look up any player by username and get a clean overview of their profile, top scores, playstyle archetype, and improvement velocity.

**Live site:** [osustats.app](https://osustats.app)

---

## Features

- **Player lookup** — search any osu! player by username
- **Profile overview** — rank, accuracy, play count, country
- **Top scores** — sortable table with accuracy color scaling, time-ago tooltips, and direct links to score pages
- **Time range filter** — filter scores by 1M / 3M / 6M / 1Y to see recent activity
- **Playstyle archetypes** — classifies players into mod-based tiers (Player, Specialist, Paragon) across NM, HR, DT, and HD
- **Improvement velocity** — tracks how a player's PP has changed over time
- **osu! Lazer support** — lazer scores show their standardised score, as on the osu! website, with a "lazer" tag
- **Visitor counter** — global site visit tracking

---

## Tech Stack

**Frontend** — React 18, Vite, Tailwind CSS, deployed on Vercel

**Backend** — Node.js, Express, deployed on Render

**API** — osu! API v2 (OAuth2 client credentials)

---

## Local Development

### Prerequisites
- Node.js 18+
- osu! API credentials from [developer.ppy.sh](https://osu.ppy.sh/home/account/edit#oauth)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in OSU_API_ID and OSU_API_SECRET in .env
npm install
npm run dev
```

### Frontend

No `.env` needed locally — Vite proxies `/api` to `localhost:5000`.

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

**Backend (`backend/.env`)**
```
OSU_API_ID=your_client_id
OSU_API_SECRET=your_client_secret
PORT=5000
FRONTEND_URL=http://localhost:5174

# Optional — visit counter. Without these it just shows 0.
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

**Frontend (production only, set on Vercel)**
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Thanks

[orangduskcat](https://osu.ppy.sh/users/18742144) — for ideas, feedback, and feature suggestions throughout development.

---

## A note on AI

AI tooling was used during development as an assistant — for boilerplate, lookups, and implementation speed. All logic, feature decisions, design direction, and code were reviewed, tested, and shaped by a human. Nothing was blindly generated and shipped.
