# Backend Setup - osu! Gameplay Analyzer

## Quick Start (Copy-Paste Ready)

### 1️⃣ Create `.env` File

**In VS Code:** Create a new file named `.env` in the `backend/` folder with this content:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# osu! API Configuration (Get from https://osu.ppy.sh/home/account/edit)
OSU_API_ID=your_client_id_here
OSU_API_SECRET=your_client_secret_here
OSU_API_TOKEN=unused_for_server_to_server
```

**Alternative:** Copy from template:
```bash
cp .env.example .env
```

---

### 2️⃣ Install Dependencies

**In PowerShell (from backend folder):**
```powershell
npm install
```

---

### 3️⃣ Start Development Server

**In PowerShell (from backend folder):**
```powershell
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║  osu! Gameplay Analyzer Backend        ║
║  Running on http://localhost:5000      ║
║  Environment: development              ║
╚════════════════════════════════════════╝
```

✅ **Server is running!**

---

## Testing the API

### Health Check

**In PowerShell:**
```powershell
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-04-05T12:00:00.000Z",
  "environment": "development"
}
```

---

### Fetch User Profile

**In PowerShell:**
```powershell
curl http://localhost:5000/api/user/fieryrage
```

Expected response:
```json
{
  "id": 2388650,
  "username": "fieryrage",
  "avatar_url": "https://a.ppy.sh/2388650?1234567890.jpeg",
  "country": "US",
  "playcount": 12345,
  "stats": {
    "global_rank": 1502,
    "country_rank": 150,
    "pp": 5230.45,
    "accuracy": "99.12"
  }
}
```

**Try with other usernames:**
```powershell
curl http://localhost:5000/api/user/cookiezi
curl http://localhost:5000/api/user/hvick225
```

---

### Fetch User's Best Scores

**In PowerShell:**
```powershell
curl "http://localhost:5000/api/user/fieryrage/scores?type=best&limit=5"
```

Expected response:
```json
{
  "username": "fieryrage",
  "user_id": 2388650,
  "type": "best",
  "scores": [
    {
      "id": 1234567,
      "beatmap_id": 2000001,
      "beatmap_md5": "abcd1234...",
      "title": "Shotgun Orchestra",
      "artist": "Infected Mushroom",
      "accuracy": "98.50",
      "score": 1234567,
      "combo": 500,
      "mods": [],
      "date": "2025-12-01T10:30:00Z",
      "replay_available": true
    },
    {
      "id": 1234568,
      "beatmap_id": 2000002,
      "beatmap_md5": "efgh5678...",
      "title": "Remote Control",
      "artist": "IOSYS",
      "accuracy": "97.20",
      "score": 1100000,
      "combo": 450,
      "mods": ["HD"],
      "date": "2025-11-28T15:45:00Z",
      "replay_available": true
    }
  ]
}
```

---

### Fetch User's Recent Scores

**In PowerShell:**
```powershell
curl "http://localhost:5000/api/user/fieryrage/scores?type=recent&limit=3"
```

---

### Analyze a Replay (Mock)

**In PowerShell:**
```powershell
$json = @{
    username = "fieryrage"
    score_id = 1234567
} | ConvertTo-Json

curl -Method POST `
  -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body $json
```

Expected response:
```json
{
  "success": true,
  "username": "fieryrage",
  "score_id": 1234567,
  "cursor_drift": {
    "avg_offset_x": -12.5,
    "avg_offset_y": 8.3,
    "consistency": 0.85,
    "summary": "You tend to aim slightly left and down. Consistency is good."
  },
  "timing": {
    "early_hits": 45,
    "late_hits": 52,
    "avg_offset_ms": 18,
    "consistency": "Moderate",
    "summary": "You hit slightly late on average (18ms). This is within normal range."
  },
  "accuracy_zones": {
    "distribution": [
      {"x": 100, "y": 100, "hits": 45},
      {"x": 150, "y": 150, "hits": 62},
      {"x": 200, "y": 200, "hits": 58}
    ]
  },
  "overall_summary": "Good consistency. Focus on timing to reduce late hits."
}
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.js                 # Environment variable loader
│   ├── routes/
│   │   └── api.js                 # API endpoints (GET /api/*, POST /api/*)
│   ├── services/
│   │   ├── osuApiService.js       # ✅ osu API v2 integration (OAuth2)
│   │   ├── replayService.js       # TODO: Replay file download
│   │   ├── parserService.js       # TODO: .osr file parsing
│   │   └── analysisService.js     # TODO: Replay analysis logic
│   └── server.js                  # Express app setup & middleware
├── package.json                   # Dependencies
├── .env                           # ← Create this file (has your secrets)
├── .env.example                   # Template (DO NOT EDIT)
├── .gitignore                     # Prevents .env from git
├── OSU_API_SETUP.md               # Full OAuth2 setup guide
└── README.md                      # This file
```

---

## All API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/health` | API health check |
| GET | `/api/user/:username` | Fetch user profile |
| GET | `/api/user/:username/scores` | Fetch user's best/recent scores |
| POST | `/api/analyze` | Analyze a replay (mock for now) |

---

## Troubleshooting

### ❌ Port already in use
If you get "EADDRINUSE", the port 5000 is already taken.

**Solution:** Change PORT in `.env`:
```env
PORT=5001
```

Then restart the server and test:
```powershell
curl http://localhost:5001/health
```

### ❌ Cannot find module 'express'
You haven't installed dependencies.

**Solution:**
```powershell
npm install
```

### ❌ "Cannot read property 'OSU_API_ID' of undefined"
The `.env` file is missing or not being read.

**Solution:**
1. Create `.env` file in `backend/` folder (not the root!)
2. Add the variables (see Quick Start section)
3. Restart the server

### ❌ "User not found" error
The username might not exist or have no scores public.

**Try these usernames (always have public scores):**
- `fieryrage`
- `cookiezi`
- `hvick225`
- `- GN`

### ❌ Cannot connect to osu.ppy.sh
You need real OAuth2 credentials first.

**Steps:**
1. Go to https://osu.ppy.sh/home/account/edit
2. Find "OAuth Applications" section
3. Click "New OAuth Application"
4. Name: `osu-gameplay-analyzer`
5. Redirect URI: `http://localhost:5000/callback`
6. Copy Client ID and Client Secret into `.env`

See [OSU_API_SETUP.md](./OSU_API_SETUP.md) for detailed steps.

---

## Current Implementation Status

✅ **Done:**
- Express server with middleware
- CORS support
- Error handling
- osu API v2 integration (OAuth2)
- User profile fetching
- User scores fetching
- Mock analysis endpoint

⏳ **TODO:**
- Replay file download
- .osr file parsing
- Analysis logic (drift, timing)
- Frontend integration

---

## Running Commands Reference

### Start server (auto-reload on file changes):
```bash
npm run dev
```

### Start server (no auto-reload):
```bash
npm start
```

### Test health:
```bash
curl http://localhost:5000/health
```

### Test user lookup:
```bash
curl http://localhost:5000/api/user/fieryrage
```

### Test scores (best):
```bash
curl "http://localhost:5000/api/user/fieryrage/scores?type=best&limit=5"
```

### Test scores (recent):
```bash
curl "http://localhost:5000/api/user/fieryrage/scores?type=recent&limit=5"
```

---

**Next:** Set up React frontend to call these endpoints! 🚀
