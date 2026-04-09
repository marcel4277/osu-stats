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
- **osu! Lazer support** — Lazer scores are detected and badged separately
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
# Fill in OSU_CLIENT_ID and OSU_CLIENT_SECRET in .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

---

## Environment Variables

**Backend (`backend/.env`)**
```
OSU_CLIENT_ID=your_client_id
OSU_CLIENT_SECRET=your_client_secret
PORT=5000
FRONTEND_URL=http://localhost:5174
```

**Frontend (`frontend/.env.local`)**
```
VITE_API_URL=http://localhost:5000
```

---

## Thanks

[orangduskcat](https://osu.ppy.sh/users/18742144) — for ideas, feedback, and feature suggestions throughout development.

---

## A note on AI

AI tooling was used during development as an assistant — for boilerplate, lookups, and implementation speed. All logic, feature decisions, design direction, and code were reviewed, tested, and shaped by a human. Nothing was blindly generated and shipped.
