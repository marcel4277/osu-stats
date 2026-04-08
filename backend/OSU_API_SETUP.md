# osu! API Setup

The backend uses **osu! API v2** with OAuth2 client credentials to fetch player data.

---

## Step 1: Get API credentials

1. Go to [osu! account settings](https://osu.ppy.sh/home/account/edit) and scroll to **OAuth Applications**
2. Click **New OAuth Application**
3. Give it any name, set redirect URI to `http://localhost:5000/callback`
4. Copy the **Client ID** and **Client Secret**

---

## Step 2: Add to `.env`

In `backend/`, create a `.env` file (copy from `.env.example`):

```env
OSU_CLIENT_ID=your_client_id
OSU_CLIENT_SECRET=your_client_secret
PORT=5000
FRONTEND_URL=http://localhost:5174
```

---

## Step 3: Run the backend

```bash
cd backend
npm install
npm run dev
```

---

## Troubleshooting

- **"Failed to get OAuth2 token"** — check `OSU_CLIENT_ID` and `OSU_CLIENT_SECRET` are correct
- **"User not found"** — username must be exact (case-insensitive)
- **"Unauthorized"** — re-generate credentials from osu! account settings

---

## Note

Never commit `.env` to git — credentials go in environment variables on your hosting platform (Render).
