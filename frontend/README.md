# Frontend - osu! Gameplay Analyzer

## 🚀 Quick Start

### 1️⃣ Install Dependencies

In PowerShell (from `frontend` folder):
```powershell
npm install
```

### 2️⃣ Start Development Server

```powershell
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3️⃣ Open in Browser

Go to: **http://localhost:5173/**

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── UsernameInput.jsx      ← Search bar component
│   │   ├── UserProfile.jsx        ← User stats display
│   │   └── ScoresList.jsx         ← Scores table
│   ├── services/
│   │   └── api.js                 ← Axios client for backend
│   ├── App.jsx                    ← Main app component
│   ├── App.css                    ← Global styles
│   ├── main.jsx                   ← Entry point
│   └── index.html                 ← HTML template
├── public/
│   └── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.local                     ← Backend URL
└── .gitignore
```

---

## 🎨 Features

### Current Features (V1)
✅ Username search  
✅ User profile display (avatar, rank, PP, accuracy)  
✅ Best scores table (with clickable rows)  
✅ Selected score details  
✅ Dark gamer aesthetic (Tailwind + custom colors)  
✅ Responsive design  
✅ Error handling  

### Components

**UsernameInput** - Search box
- Text input for username
- Search button
- Loading state feedback

**UserProfile** - User stats card
- User avatar
- Username and country
- Stats grid (rank, PP, accuracy)

**ScoresList** - Scores table
- Beatmap name/artist
- Accuracy %%
- Score points
- Combo
- Date
- Clickable rows to select score

**Selected Score** - Score details
- Shows detailed info for clicked score
- Replay availability indicator
- Placeholder for analysis (coming soon)

---

## 🔌 API Connection

The frontend calls your backend at:
```
http://localhost:5000/api/
```

This is configured in `.env.local`:
```env
VITE_API_URL=http://localhost:5000
```

**Endpoints used:**
- `GET /api/user/:username` - Fetch user profile
- `GET /api/user/:username/scores?type=best&limit=50` - Fetch best scores

---

## 🎯 Make Sure Backend is Running!

Before starting the frontend, your backend must be running:

```powershell
cd backend
npm run dev
```

Then in a separate terminal:
```powershell
cd frontend
npm run dev
```

---

## 🎨 Dark Gamer Theme

Custom Tailwind colors:
- `bg-osu-dark` - Main dark background (#0a0a0a)
- `bg-osu-darker` - Darker background (#050505)
- `text-osu-purple` - Purple accent (#b84ed6)
- `text-osu-pink` - Pink accent (#ff6b9d)
- `text-osu-cyan` - Cyan accent (#00d4ff)

All components use dark mode with purple/pink/cyan accents.

---

## 🐛 Troubleshooting

### ❌ "Cannot reach backend"
- Make sure backend is running on port 5000
- Check `.env.local` has `VITE_API_URL=http://localhost:5000`

### ❌ Port 5173 already in use
- Edit `vite.config.js` and change port:
  ```js
  server: {
    port: 5174,  // Try a different port
  }
  ```

### ❌ Dependencies not installed
```powershell
npm install
```

### ❌ Styles not loading
```powershell
npm run dev
```

---

## 📦 Build for Production

```powershell
npm run build
```

Outputs to: `dist/` folder

---

## 🔄 Development Workflow

1. **Backend running** on `http://localhost:5000`
2. **Frontend running** on `http://localhost:5173`
3. **Edit components** in `src/components/`
4. **Edit services** in `src/services/`
5. **Styles** use Tailwind CSS (no CSS files to edit, use class names)
6. **Hot reload** works automatically

---

## ⏭️ Next Steps

- [ ] Implement replay download and parsing
- [ ] Implement analysis logic (drift, timing)
- [ ] Add graphs/charts (Recharts)
- [ ] Display analysis results
- [ ] Add result export/sharing

---

## 📝 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Recharts** - Charts (ready to use)

---

**Ready to test? Run both servers and search for a player!** 🚀
