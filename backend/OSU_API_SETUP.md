# Setting Up osu! API Credentials

## Overview
The osu! Gameplay Analyzer uses the **osu! API v2**, which requires OAuth2 authentication. This guide walks you through getting the necessary credentials.

---

## Step 1: Create an osu! Account

If you don't have an account, create one at: https://osu.ppy.sh/

---

## Step 2: Register an OAuth2 Application

1. Go to: https://osu.ppy.sh/home/account/edit
2. Scroll down to **"OAuth Applications"**
3. Click **"New OAuth Application"**
4. Fill in the form:
   - **Application Name**: `osu-gameplay-analyzer` (or your preferred name)
   - **Application Redirect URIs**: `http://localhost:5000/callback`
     (This can be anything for server-to-server communication, but use a valid URL)
5. Click **"Register"**

6. You'll see two credentials:
   - **Client ID** (e.g., `1234`)
   - **Client Secret** (e.g., `abcdefgh...`) ⚠️ **Keep this SECRET!**

7. Copy these values

---

## Step 3: Add Credentials to `.env`

1. In the `backend/` directory, create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edit `backend/.env` and add your credentials:
   ```env
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:5173

   # Your osu! API credentials
   OSU_API_ID=1234
   OSU_API_SECRET=abcdefgh1234567890xyz
   OSU_API_TOKEN=unused_for_now
   ```

3. **Save the file** ✅

---

## Step 4: Install Dependencies & Test

1. Navigate to the backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ╔════════════════════════════════════════╗
   ║  osu! Gameplay Analyzer Backend        ║
   ║  Running on http://localhost:5000      ║
   ║  Environment: development              ║
   ╚════════════════════════════════════════╝
   ```

---

## Step 5: Test the API

### Test with a real username:

```bash
# Get user profile
curl http://localhost:5000/api/user/fieryrage

# Get user's best scores
curl http://localhost:5000/api/user/fieryrage/scores?type=best&limit=5

# Get user's recent scores
curl http://localhost:5000/api/user/fieryrage/scores?type=recent&limit=5
```

### Using Postman or REST Client:

**GET** `http://localhost:5000/api/user/fieryrage`

Expected response:
```json
{
  "id": 2388650,
  "username": "fieryrage",
  "avatar_url": "https://a.ppy.sh/2388650",
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

---

## Troubleshooting

### ❌ "Failed to get OAuth2 token"
- Check that `OSU_API_ID` and `OSU_API_SECRET` are correct
- Make sure they're in the `.env` file
- Restart the server after editing `.env`

### ❌ "User not found"
- Check the username spelling (case-insensitive but must be exact)
- Try with a known username like `fieryrage`, `cookiezi`, or `hvick225`

### ❌ "ENOTFOUND osu.ppy.sh"
- You're offline or have connectivity issues
- Check your internet connection

### ❌ "Unauthorized: Check API credentials"
- Your Client ID or Client Secret is incorrect
- Re-generate them from https://osu.ppy.sh/home/account/edit

---

## OAuth2 Flow Explained

The app uses the **Client Credentials** flow:

```
1. App sends: POST https://osu.ppy.sh/oauth/token
   ├─ client_id: your_id
   ├─ client_secret: your_secret
   └─ grant_type: client_credentials

2. osu! API responds: { access_token: "...", expires_in: 86400 }

3. App uses token: GET https://osu.ppy.sh/api/v2/users/fieryrage
   └─ Authorization: Bearer {access_token}

4. Token is cached and reused until expiry (then refresh)
```

The service automatically handles token refresh, so you don't need to worry about it.

---

## API Endpoints Used

- `POST /oauth/token` - Get OAuth2 access token
- `GET /api/v2/users/{username}` - Fetch user profile
- `GET /api/v2/users/{id}/scores/best` - Fetch best scores
- `GET /api/v2/users/{id}/scores/recent` - Fetch recent scores

See full docs: https://osu.ppy.sh/docs/index.html

---

## Security Notes

⚠️ **Never commit `.env` to git!**
- `.gitignore` already includes `.env`
- Always use environment variables for secrets
- Never hardcode credentials

---

## Next Steps

✅ Backend can now fetch real osu! data
⏭️ Next: Set up React frontend to call these endpoints
