# PBTrack — Gig Driver Finance Dashboard

Premium finance dashboard for gig drivers. Tracks earnings, auto-imports bank transactions via Plaid, shows Splitwise debts, and calculates your smart daily target.

---

## What it does

- **Smart Daily Target** — calculates exactly how much you need to earn today based on bills, debts, and days left in month
- **Earnings Tracker** — log Uber/Lyft income, see weekly/monthly progress
- **Auto Bank Sync** — Plaid imports all transactions automatically
- **Spending Categories** — see where your money goes
- **Bill Schedule** — upcoming bills with overdue alerts
- **Splitwise Integration** — see who you owe directly in the app
- **Login/Signup** — your private data accessible from any device

---

## Setup (do this once)

### Step 1 — Create a Supabase account (free)

1. Go to **supabase.com** and sign up
2. Create a **New Project** (name it `pbtrack`)
3. Wait for it to set up (~1 min)
4. Go to **Settings → API**
5. Copy your **Project URL** and **service_role key** (not the anon key)

### Step 2 — Set up the database

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `database.sql` and paste it
4. Click **Run**
5. You should see "Success" — your tables are created

### Step 3 — Create your .env file

1. Copy `.env.example` to a new file called `.env`
2. Fill in your values:
   - `SUPABASE_URL` — from Supabase Settings → API
   - `SUPABASE_SERVICE_KEY` — the service_role key (long one)
   - `JWT_SECRET` — any random long string (make one up)
   - `PLAID_CLIENT_ID` — from dashboard.plaid.com
   - `PLAID_SECRET` — your sandbox secret from Plaid
   - `SPLITWISE_CONSUMER_KEY` — from splitwise.com/apps
   - `SPLITWISE_CONSUMER_SECRET` — from splitwise.com/apps

### Step 4 — Deploy to Render (free hosting)

1. Push this folder to a GitHub repository
2. Go to **render.com** and sign up with GitHub
3. Click **New → Web Service**
4. Select your GitHub repo
5. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
6. Add your environment variables (copy from your .env file)
7. Click **Create Web Service**
8. Wait ~2 min — your app is live at `https://your-name.onrender.com`

### Step 5 — Update APP_URL

Once deployed, copy your Render URL and update the `APP_URL` variable in Render's environment settings. This is needed for Splitwise OAuth to work.

---

## Using the app

1. Open your app URL
2. Create an account
3. Add your bills manually (Settings → Bills)
4. Connect your bank (Spending → Connect Bank)
5. Connect Splitwise (Debts → Connect Splitwise)
6. Start logging your Uber/Lyft earnings each day

---

## Test with sandbox

Before using real bank accounts, test with Plaid sandbox:
- Username: `user_good`
- Password: `pass_good`

This simulates a real bank connection safely.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Login / Signup page |
| `app.html` | Main dashboard |
| `server.js` | Backend API |
| `package.json` | Dependencies |
| `database.sql` | Database setup (run once in Supabase) |
| `.env.example` | Environment variable template |
| `.gitignore` | Keeps .env private |
