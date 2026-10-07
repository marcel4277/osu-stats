# osustats.app

A player stats site for osu! — look up any player by username and get a clean overview of their profile, top plays, playstyle archetype and recent activity, or put two players side by side.

**Live site:** [osustats.app](https://osustats.app)

---

## Features

- **Player card** — the player's own osu! banner, with rank (and its 90-day change), pp, country rank, accuracy, play count and play time
- **Top plays** — the player's 200 best plays with each map's cover behind its row, sortable by accuracy, score, combo, pp or date, with direct links to every score
- **Filters** — by mod (NM, HD, HR, DT…) and by time (1M / 3M / 6M / 1Y); plays outside the time range turn grey
- **Playstyle archetypes** — mod-based tiers (Player, Specialist, Paragon) across NM, HR, DT and HD, plus traits like HD Stacker or Acc Machine
- **Improvement velocity** — an 18-month activity chart, last top play, peak month, and how the last 90 days compare with the player's usual pace
- **Comparison** — two players side by side, with shared chart scales and mod rows so they line up
- **osu!lazer support** — lazer plays show their standardised score, as on the osu! website, with a "lazer" tag
- **Works on phones** — the table becomes one card per play, with nothing left out
- **Visitor counter** — global site visit tracking

---

## Docs

- [docs/DESIGN.md](docs/DESIGN.md) — how the site looks and why: colours, wording, layout rules, and the ideas that were tried and rejected
- [docs/PROJECT.md](docs/PROJECT.md) — how it works: the code map, osu! API details, how changes get to the live site, and the to-do list

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
