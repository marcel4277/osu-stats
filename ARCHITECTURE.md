# osu! Gameplay Analyzer - Architecture Document

## Overview
A full-stack web app that analyzes player replay data to identify weakness patterns (cursor drift, timing inconsistency, accuracy zones).

---

## 1. TECH STACK

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling (dark theme, modern gamer aesthetic)
- **Recharts** - Data visualization (scatter plots, bar charts)
- **Axios** - HTTP client for API calls
- **Vite** - Build tool (fast dev server, optimized builds)

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server and routing
- **Axios** - HTTP client for osu API
- **osureplaydecoder** - Parse .osr replay files
- **dotenv** - Environment configuration

### External APIs
- **osu! API v2** (https://osu.ppy.sh/api/v2/)
  - Requires OAuth2 token (get from developer.ppy.sh)
  - Endpoints: user info, user scores, replay data

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                             │
├──────────────────────────────────────────────────────────────┤
│  React Frontend (Vite)                                       │
│  ├─ UsernameInput Component                                  │
│  ├─ ReplaySelector Component                                │
│  ├─ AnalysisDisplay Component                               │
│  ├─ Charts Component (Recharts)                             │
│  └─ State Management (React Hooks)                          │
└────────────────┬──────────────────────────────────────────────┘
                 │ HTTP/JSON
┌────────────────▼──────────────────────────────────────────────┐
│              BACKEND (Express Node.js)                         │
├──────────────────────────────────────────────────────────────┤
│  API Routes Layer                                            │
│  ├─ GET  /api/user/:username          (fetch user data)     │
│  ├─ GET  /api/user/:username/scores   (fetch top plays)     │
│  ├─ POST /api/replay/download         (get .osr file)       │
│  └─ POST /api/analyze                 (analyze replay)      │
│                                                              │
│  Service Layer                                              │
│  ├─ OSU API Service                                         │
│  │   └─ fetch user data, scores, replay metadata           │
│  ├─ Replay Service                                         │
│  │   └─ download .osr files                                │
│  ├─ Parser Service                                         │
│  │   └─ parse .osr binary → frame data                     │
│  └─ Analysis Service                                       │
│      └─ calculate drift, timing patterns                   │
│                                                              │
│  Data Models                                                │
│  ├─ User (username, uid, stats)                            │
│  ├─ Score (beatmap_id, accuracy, date)                     │
│  ├─ ReplayFrame (cursor_x, cursor_y, timestamp, keys)      │
│  └─ Analysis (drift_data, timing_data, summary)            │
└────────────────┬──────────────────────────────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
        ▼                   ▼
   ┌─────────────┐    ┌──────────────────┐
   │ osu! API v2 │    │ osu! Servers     │
   │ (user data) │    │ (.osr downloads) │
   └─────────────┘    └──────────────────┘
```

---

## 3. DATA FLOW

### Flow 1: User Lookup
```
User enters username
  ↓
Frontend sends: GET /api/user/username
  ↓
Backend calls: osu API v2 /api/v2/users/{username}
  ↓
Backend returns: { id, username, avatar_url, stats }
  ↓
Frontend displays user info
```

### Flow 2: Get Recent Plays
```
Frontend requests: GET /api/user/{username}/scores
  ↓
Backend calls: osu API v2 /api/v2/users/{uid}/scores/best?limit=50
  ↓
Backend returns: [ { beatmap_id, title, accuracy, date, score }, ... ]
  ↓
Frontend displays list of replays
```

### Flow 3: Download & Analyze Replay
```
User selects a replay
  ↓
Frontend sends: POST /api/analyze { username, score_id }
  ↓
Backend:
  1. Downloads .osr file from osu servers
  2. Parses binary file → extract replay frames [ {x, y, time, keys}, ... ]
  3. Fetches beatmap data (hit object positions/timings)
  4. Runs analysis:
     - Cursor drift: avg distance(cursor, hit_object)
     - Timing deviation: early/late hits
     - Accuracy zones: hit distribution
  5. Returns JSON: { drift, timing, accuracy_zones, summary }
  ↓
Frontend receives analysis result
  ↓
Frontend displays charts and summary
```

---

## 4. REPLAY FILE PARSING

### .osr Format (osu Replay File)
Binary format containing:
- **Metadata** (game mode, hit 300s/100s/50s, misses, score, date, etc.)
- **Compression** (LZMA compressed)
- **Replay Data** (stream of replay frames)

### Replay Frame Structure
Each frame contains:
- `time_offset` - milliseconds from previous frame
- `x` - cursor x position (0-512)
- `y` - cursor y position (0-384)
- `keys` - button state (bitmask: left_click, right_click, smoke)

### Library: osureplaydecoder
```
npm install osureplaydecoder
// Decodes .osr → { replay_data, beatmap_hash, player_name, ... }
```

---

## 5. ANALYSIS ENGINE

### Input
- Replay frames: `[ { time, x, y, keys }, ... ]`
- Beatmap data: `[ { x, y, time, object_type }, ... ]` (from API or cached)

### Output (JSON)
```json
{
  "cursor_drift": {
    "avg_offset_x": -12.5,
    "avg_offset_y": 8.3,
    "summary": "You tend to aim slightly left and down"
  },
  "timing": {
    "early_hits": 45,
    "late_hits": 52,
    "avg_offset_ms": 18,
    "consistency": "Moderate"
  },
  "accuracy_zones": {
    "distribution": [ { x, y, hits }, ... ]
  },
  "overall_summary": "Good accuracy but cursor drifts right under pressure"
}
```

### Calculations
1. **Cursor Drift**
   - For each hit, compare cursor position to hit object position
   - Calculate: `offset = cursor_pos - hit_object_pos`
   - Average all offsets

2. **Timing**
   - For each hit, compare actual time vs expected time
   - Categorize: early (-50 to 0ms), late (0 to +50ms)
   - Calculate average offset

3. **Accuracy Zones**
   - Bin cursor positions into grid (e.g., 10x10 zones)
   - Count hits in each zone
   - Identify hot spots

---

## 6. PROJECT STRUCTURE

```
osu-gameplay-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UsernameInput.jsx
│   │   │   ├── ReplaySelector.jsx
│   │   │   ├── AnalysisDisplay.jsx
│   │   │   └── Charts.jsx
│   │   ├── hooks/
│   │   │   ├── useOsuUser.js
│   │   │   └── useAnalysis.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.js
│   │   ├── services/
│   │   │   ├── osuApiService.js
│   │   │   ├── replayService.js
│   │   │   ├── parserService.js
│   │   │   └── analysisService.js
│   │   ├── models/
│   │   │   └── types.js
│   │   ├── config/
│   │   │   └── env.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
└── ARCHITECTURE.md (this file)
```

---

## 7. KEY DEPENDENCIES

### Frontend
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "axios": "^1.6.0",
  "recharts": "^2.10.0",
  "tailwindcss": "^3.4.0"
}
```

### Backend
```json
{
  "express": "^4.18.0",
  "axios": "^1.6.0",
  "osureplaydecoder": "^0.1.0",
  "dotenv": "^16.0.0"
}
```

---

## 8. ENVIRONMENT & SECRETS

### Backend (.env)
```
OSU_API_ID=your_client_id
OSU_API_SECRET=your_client_secret
OSU_API_TOKEN=personal_access_token
NODE_ENV=development
PORT=5000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
```

---

## 9. API ENDPOINTS

### GET /api/user/:username
Fetch user profile
```
Request: GET /api/user/fieryrage
Response: { id, username, avatar_url, country, playcount: 1234, stats }
```

### GET /api/user/:username/scores
Fetch recent/top scores
```
Request: GET /api/user/fieryrage/scores?type=best&limit=50
Response: [
  {
    id: 1234567,
    beatmap_id: 456789,
    title: "Shotgun Orchestra",
    artist: "Infected Mushroom",
    accuracy: 98.5,
    date: "2025-12-01",
    replay_available: true
  },
  ...
]
```

### POST /api/analyze
Analyze a replay
```
Request: POST /api/analyze
Body: { username: "fieryrage", score_id: 1234567 }

Response: {
  cursor_drift: { avg_offset_x: -12.5, avg_offset_y: 8, summary: "..." },
  timing: { early: 45, late: 52, avg_offset_ms: 18, consistency: "Moderate" },
  accuracy_zones: { distribution: [...] },
  overall_summary: "..."
}
```

---

## 10. TIMELINE ESTIMATE

1. **Backend Setup** (30 min)
   - Express server, routes, env config

2. **osu API Integration** (45 min)
   - Get OAuth token working
   - Fetch user & scores

3. **Replay Parsing** (1 hour)
   - Download .osr files
   - Parse binary format

4. **Analysis Logic** (1.5 hours)
   - Implement drift, timing, accuracy calculations

5. **Frontend Setup** (30 min)
   - React + Tailwind boilerplate

6. **UI Components** (1.5 hours)
   - User input, replay selector, results

7. **Charts & Display** (1 hour)
   - Recharts integration
   - Dashboard layout

8. **Testing & Polish** (1 hour)
   - Error handling, edge cases

**Total: ~7-8 hours**

---

## 11. DEPLOYMENT READY

- Frontend: Deploy to Vercel/Netlify
- Backend: Deploy to Railway/Render/Heroku
- No database needed (stateless API)
- Can add caching layer later

---

**Next Step:** Implement backend setup (Express + routes structure)
