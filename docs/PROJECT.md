# How the project works

Plain-English notes on how osustats.app is built, how it talks to osu!, and
how changes get from an idea to the live site. For how things *look*, see
[DESIGN.md](DESIGN.md).

---

## 1. What runs where

| Part | What it is | Hosted on | Deploys from |
|---|---|---|---|
| **Frontend** (`frontend/`) | The website itself: React 18, Vite, Tailwind CSS | Vercel | `master` |
| **Backend** (`backend/`) | A small Node/Express server that talks to osu! for us | Render | `master` |
| **Saved osu! results and the visit counter** | Upstash Redis | Upstash | (no code) |

- **The site:** osustats.app.
- **Why the website doesn't talk to osu! directly:** the osu! API needs a
  secret key, so the browser asks *our* backend, and the backend asks osu!.

---

## 2. Where everything lives

```
backend/src/
  server.js              starts the server (security headers, rate limit, CORS)
  config/env.js          reads settings like the osu! key from the .env file
  routes/api.js          the web addresses the frontend calls, caching, error messages
  services/osuApiService.js   everything that talks to osu! (login, profile, top plays)
  services/rateLimiter.js     keeps requests to osu! within 60 a minute
  services/cache.js      the cache: memory first, then Upstash, then osu!
                         (the version in each cache name, e.g. scores:v2, goes
                         up whenever the saved shape changes, so old copies
                         are ignored)
  services/store.js      talks to Upstash (saved osu! results, visit counter)

frontend/src/
  App.jsx                page frame: header, footer, page width
  pages/HomePage.jsx     search boxes, loading players, single vs comparison view
  components/
    UserProfile.jsx      player card with banner
    ImprovementVelocity.jsx  activity card and chart
    PlaystyleCard.jsx    archetype, mod breakdown, traits, "?" popup
    ScoresList.jsx       top plays (rows on wide screens, cards on phones), filters, map covers
    ComparisonView.jsx   two players side by side
    Tooltip.jsx          the one tooltip used everywhere
    UsernameInput.jsx    a search box and its button
    UpdatedNote.jsx      "Updated 12 min ago · Refresh" above each player card
    modUtils.js          mod rules and mod colours (one place only)
    dateUtils.js         how dates and months are written ("18 Nov 2024", "Apr 2026")
  services/api.js        how the frontend calls the backend
  App.css                page background, score-row covers, player-card banner

docs/
  DESIGN.md              how the site looks and why (rules, values, rejected ideas)
  PROJECT.md             this file
```

---

## 3. What happens when someone searches

1. They type a name, and the address becomes `/name`. A comparison address
   looks like `/name/vs/other`.
2. The frontend asks the backend for the **profile** and the **top plays**,
   both at the same time.
3. The backend looks the player up **once**, and both requests share that one
   lookup.
4. It fetches the 200 top plays from osu! as 2 pages of 100, both at once.
   So a new search costs **3 osu! requests** (a comparison costs 6).
5. Results are kept for **30 minutes**: in memory, and in Upstash so they
   survive the server restarting or going to sleep. A repeat search within
   that time costs nothing. If Upstash is down, the site works without it.
6. If two people search the same player at the same moment, they share one
   fetch.
7. Failed lookups (for example a typo) are **not** cached, so trying again
   really tries again.
8. If a slow answer for an old search arrives after a newer search, it's
   thrown away, so you never see the wrong player.
9. **Refresh:** each player card says how old its data is ("Updated 12 min
   ago") and has a Refresh button. It asks osu! for new data, but only once
   the data is more than a minute old, so it can't be used to burn through
   the request budget.
10. **When things go wrong, the visitor gets a plain sentence,** never a
    technical error: the player doesn't exist; osu! is busy ("Try again in a
    minute"); osu! isn't answering; or the server took too long.
11. **The website waits up to 60 seconds for an answer.** The free Render
    plan puts the backend to sleep, and waking it takes 30–50 seconds. (It
    used to give up after 10 seconds, so the first visit after a quiet spell
    failed.)

---

## 4. Facts about the osu! API worth knowing

These were checked against osu-web's source code, not guessed.

- **Lazer plays:**
  - Score requests send the header `x-api-version: 20220705`. Without it,
    osu! uses an old format where **lazer plays show a score of 0**.
  - A play is from lazer if it has **no `legacy_score_id`**.
- **Which score number is shown:**
  - stable plays show their original score (`legacy_total_score`);
  - lazer plays show `total_score`, the "standardised" number the osu!
    website shows (capped near 1,000,000).
  - That's why lazer plays drop to the bottom when you sort by Score.
- **Difficulty name and star rating** come in each play's `beatmap`, as
  `version` and `difficulty_rating`. The star rating is without mods, as on
  osu!'s own profile list; with mods would need an extra request per map.
- **Hit counts** come in each play's `statistics` as `great` (300s), `ok`
  (100s), `meh` (50s) and `miss`. osu! leaves out any count that's zero, so
  a missing one means 0.
- **Accuracy is rounded down to 2 decimals,** exactly like osu!. 99.746%
  shows as 99.74%.
- **Every play links to `osu.ppy.sh/scores/{id}`,** which works for stable
  and lazer plays alike.
- **Map covers** come from each play's `beatmapset.covers['card@2x']`.
- **Player banners** come from the profile's `cover.url`. Everyone has one,
  because osu! gives players a default.
- **Flags:** `https://osu.ppy.sh/assets/images/flags/{code}.svg`, where the
  code is the flag emoji's code points (GB → `1f1ec-1f1e7`).
- **Login:** the backend gets a token from osu! and reuses it. If osu!
  rejects it, the backend gets a new one and retries **once**. If many
  requests arrive while it's fetching a token, they wait for that one token.
- **Rate limit:**
  - osu!'s API terms (in their API docs) say **no more than 60 requests a
    minute**, with some bursting allowed. Going over can get the API key
    revoked. osu-web's code would technically allow 1,200, but the terms
    are what count.
  - The backend paces itself (`rateLimiter.js`): a burst of 20, then one a
    second. Requests queue for their turn. If one would wait more than 10
    seconds, the visitor is told osu! is busy instead.
  - If osu! still answers "too many requests", every request pauses for as
    long as osu! asks, and the request is tried once more.
  - **One new player search costs 3 calls.** A comparison costs 6.

---

## 5. Running it on your own computer

```bash
# backend
cd backend
cp .env.example .env     # put your osu! API ID and secret in .env
npm install
npm run dev              # runs on localhost:5000

# frontend (in another window)
cd frontend
npm install
npm run dev              # opens on localhost:5174; /api is passed to the backend
```

Or run both in one window from the top folder: `npm install && npm run dev`.

You get the osu! API ID and secret from your osu! account settings → OAuth.

---

## 6. How a change gets to the live site

The rules (they exist so the history stays clean and in Marcel's name):

1. **All work happens on the `cleanup` branch,** never directly on `master`.
2. **Commits are authored as**
   `Marcel <88894994+marcel4277@users.noreply.github.com>`, with no extra
   "Co-authored-by" or other trailer lines.
3. **Merging:**
   - Open https://github.com/marcel4277/osu-stats/compare/master...cleanup.
   - Click **Create pull request**.
   - In the green button's dropdown, choose **Squash and merge**, not "Create
     a merge commit".
   - Click **Confirm**.
   - Vercel and Render then deploy `master` on their own.
4. **After a merge,** `cleanup` gets restarted from the new `master` before
   the next change. Building on top of the old, already-squashed commits is
   what caused a merge conflict once.
5. **The "Unverified" label** on branch commits is expected and harmless.
   The squashed commit on `master` is signed by GitHub.
6. **Every pull request gets a Vercel preview link** in its comments, and it
   loads real players. The backend accepts the live site plus this project's
   own preview addresses (`osu-stats-…-marcel4277s-projects.vercel.app`,
   the CORS setting in `backend/src/server.js`), and nothing else.
   - A preview is only the *website* part of the change. It talks to the live
     backend, so backend changes can't be seen on a preview until they're
     merged.
   - The preview needs `VITE_API_URL` switched on for the **Preview**
     environment in Vercel (Settings → Environment Variables), not just
     Production. Without it, a preview asks itself for players and fails.
   - Visits to a preview don't add to the visit counter; only the live site
     counts.

**Checks before any change goes up:**
- **The build must pass:** `cd frontend && npx vite build`.
- **Visual changes are checked in a real browser at desktop, comparison and
  phone width,** using fake player data, since the dev environment can't
  reach osu!.
- **Contrast is measured, not eyeballed.** See DESIGN.md section 10 for the
  targets.

---

## 7. To-do list

### Before promoting the site publicly

1. **Check the Render plan:** the free plan sleeps, so the first visit after
   a quiet spell takes 30–50 seconds. The website now waits that long instead
   of failing, and saved results survive the sleep (they're in Upstash), but
   the wait itself only goes away on a paid plan.
2. **Other game modes:** add a mode selector, or say clearly that the site is
   osu!standard only.
3. **Link previews:** a title, description and image when someone pastes a
   player link into Discord or Twitter.
4. **Check everything on a real phone.** The phone layout (cards instead of
   rows, header-only banner, stacked stats) is built and tested in a
   phone-sized browser, but not yet on an actual device, and the comparison
   view hasn't been looked at on a phone at all.
5. **Friendly error pages** for restricted players and players with no
   plays. (osu! being busy or down already gets a plain message.)
6. **Check the name doesn't clash with an existing site,** and talk to the
   osu! team before a big launch. Their API terms are 60 requests a minute;
   the backend keeps to that (section 4).

### Features

- **Number differences in the comparison view.**
- **Click a month in the activity chart** to filter the top plays to it.
- **Star rating per play:** no-mod first. Mod-adjusted needs extra osu!
  calls and a long cache.

### Small fixes

- **Filtered-out rows still open their score when clicked.** It's arguably
  fine, but it's never been decided.
- **The API sends accuracy as text and game mode as a number.** It was left
  alone on purpose: changing the format means deploying the backend and
  frontend together, or pages break in between.

### Nice to have

- **Error monitoring.**
- **Automated tests** for the playstyle maths, lazer scores and caching,
  plus linting and a CI check on every pull request.
- **Vite upgrade:** clears the remaining warnings in the dev tools only.
- **A real site icon.**

### Design issues

See DESIGN.md, section 11.

---

## 8. Starting a new piece of work

1. Read [DESIGN.md](DESIGN.md) (anything visual) and this file (anything
   else) first. Most "obvious" improvements were already tried, and the
   rejected lists say why they didn't work.
2. Follow section 6 exactly: the `cleanup` branch, commits in Marcel's name
   with no extra lines, and squash merges.
3. Fix problems properly when you spot them, and measure rather than guess.
4. When a change alters a rule or a value in DESIGN.md, update the doc in
   the same commit.

