🚀 FULL STACK SETUP - osu! Gameplay Analyzer
==============================================

Your frontend and backend are now ready!

📋 COMPLETE PROJECT STRUCTURE
=============================

osu!/
├── backend/                  ✅ API Server (running on :5000)
│   ├── src/
│   │   ├── config/env.js
│   │   ├── routes/api.js
│   │   ├── services/
│   │   │   ├── osuApiService.js
│   │   │   ├── replayService.js
│   │   │   ├── parserService.js
│   │   │   └── analysisService.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/                 ✅ React UI (running on :5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── UsernameInput.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   └── ScoresList.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── App.css
│   ├── public/index.html
│   ├── .env.local
│   └── package.json
│
├── ARCHITECTURE.md
├── QUICK_REFERENCE.txt
└── FULL_STACK_SETUP.md (this file)


🎯 STEP-BY-STEP SETUP
=====================

1. BACKEND SETUP (already done ✅)
   ✅ .env file created with OAuth2 credentials
   ✅ npm dependencies ready

2. FRONTEND SETUP
   Run in PowerShell (from root or frontend folder):
   
   npm install

   Wait for dependencies to install...


3. START BOTH SERVERS (in separate PowerShell windows)

   TERMINAL 1 - Backend:
   cd backend
   npm run dev
   
   Expected output:
   ╔════════════════════════════════════════╗
   ║  osu! Gameplay Analyzer Backend        ║
   ║  Running on http://localhost:5000      ║
   ║  Environment: development              ║
   ╚════════════════════════════════════════╝

   TERMINAL 2 - Frontend:
   cd frontend
   npm run dev
   
   Expected output:
   VITE v5.0.8 ready in 123 ms
   ➜  Local:   http://localhost:5173/
   ➜  press h to show help


✅ TESTING
==========

1. Open browser: http://localhost:5173/

2. Search for a player:
   - Type: "fieryrage"
   - Click "Search"
   - Should show profile and scores ✓

3. Click on a score to see details

4. If you see user data and scores, YOU'RE DONE! 🎉


🛠️ COMMANDS REFERENCE
====================

Backend:
  cd backend
  npm install           ← Install deps (only once)
  npm run dev          ← Start development server
  npm start            ← Start production server

Frontend:
  cd frontend
  npm install           ← Install deps (only once)
  npm run dev          ← Start development server
  npm run build        ← Build for production
  npm run preview      ← Preview production build


📊 CURRENT FEATURES
===================

Backend ✅
- OAuth2 authentication with osu! API v2
- User profile fetching (real data)
- User scores fetching (best/recent)
- Error handling
- CORS support

Frontend ✅
- Username search bar
- User profile card with stats
- Scores table (clickable)
- Selected score details
- Dark gamer aesthetic
- Responsive design
- Loading states
- Error messages


⏭️ NEXT FEATURES TO BUILD
==========================

Analysis Engine:
  - Download .osr replay files
  - Parse replay data (cursor positions, timings)
  - Calculate drift, timing, accuracy zones
  - Generate analysis results

Frontend Analytics:
  - Heatmaps of cursor positions
  - Timing distribution graphs
  - Accuracy zone visualization
  - Summary insights


🔧 TROUBLESHOOTING
==================

Can't connect to backend?
  → Check backend is running (port 5000)
  → Check .env has valid OAuth credentials
  → Restart both servers

Blank page on frontend?
  → Check browser console for errors (F12)
  → Verify Frontend URL in .env.local: VITE_API_URL=http://localhost:5000

Port already in use?
  → Change PORT in backend/.env
  → Change port in frontend/vite.config.js

Dependencies error?
  → npm install
  → Delete node_modules/ and try again
  → npm cache clean --force


💡 HOW IT WORKS
===============

1. You type a username in the frontend search box
2. Frontend sends: GET http://localhost:5000/api/user/fieryrage
3. Backend receives request, needs to authenticate with osu! API
4. Backend sends: POST https://osu.ppy.sh/oauth/token
   (requesting access token using your OAuth credentials)
5. osu! API returns access token
6. Backend sends: GET https://osu.ppy.sh/api/v2/users/fieryrage
   (with Bearer token in Authorization header)
7. osu! API returns user data
8. Backend sends user data back to frontend
9. Frontend displays user profile and scores


🎉 YOU'RE ALL SET!
==================

Start both servers and you have a working app!

Backend: npm run dev      (port 5000)
Frontend: npm run dev     (port 5173)

Open: http://localhost:5173

Search for any osu! player and see their profile + scores!

Ready to build analysis features? Let me know! 🚀
