# PBTrack — Gig Driver Finance Dashboard

A personal finance dashboard built specifically for gig drivers (Uber/Lyft). Tracks earnings, auto-imports bank transactions via Plaid, manages bills and debts, and calculates a smart dynamic daily target based on your real financial situation.

Live at: **pbtrack.onrender.com**

---

## What it does

### 🏠 Home
- **Smart Daily Target** — calculates exactly how much you need to earn today based on upcoming bills, available bank balance, cash on hand, and your 7-day average daily spending. Updates in real time as you log earnings and pay bills.
- **Today's Progress Ring** — visual progress toward daily target (manual logs only, no bank confusion)
- **Break-Even Tracker** — shows if today's earnings cover today's spending
- **Budget Status** — quick view of monthly spending vs limits per category
- **Upcoming Bills** — next bills due with days remaining
- **Recent Activity** — mixed feed of earnings (green) and spending (red)
- **Smart Alerts** — overdue bills, bills due soon, daily goal progress. Dismissable. Resets daily.

### ⚡ Earnings
- **Editable Daily Log** — one entry per platform per day (Uber/Lyft/Cash/Other). Tap + to update throughout the day instead of logging multiple times.
- **Best Earning Days** — bar chart showing which day of the week you earn most based on historical data
- **Weekly Projection** — based on your current week's daily average
- **Time Filters** — Yesterday, Week, Month, All, or pick a specific date
- **Monthly Goal Progress** — progress bar toward your monthly earnings goal

### 💳 Spending
- **Donut Chart** — visual category breakdown
- **Daily Cash Flow Chart** — green earnings vs red spending bars for last 7 days
- **Category Filter Chips** — tap any category to filter transactions
- **Color-Coded Transactions** — green border = income, blue = transport, orange = food, red = debt
- **All Transactions** — full list with merchant logos via Clearbit

### 📋 Bills
- **Auto-Detection** — scans Plaid transactions and suggests recurring charges to add as bills
- **Sorted by Due Date** — overdue bills appear first with 🚨 urgent badge
- **Editable** — tap ✏️ on any bill to change amount, due date, or category
- **Pay/Undo** — mark bills paid with one tap
- **Ordinal Dates** — shows 1st, 2nd, 3rd, 21st (not 21th)

### 🏦 Accounts
- **Financial Overview** — earned vs spent vs net for the month
- **Bank Account Balances** — all Plaid-connected accounts with live balances (debit/savings/credit)
- **Cash on Hand** — manually track cash, included in daily target calculation
- **Splitwise Debts** — who you owe and how much
- **Manual Debts** — add personal debts with payoff progress
- **Payoff Timeline** — snowball method projection for debt freedom

### 📊 Budget
- **Monthly Income vs Spending** — full picture separate from driving progress
- **Target Breakdown** — shows bills coverage + daily essentials + available funds = real daily target
- **Income by Source** — Uber, Lyft, Cash, bank deposits broken out
- **Category Breakdown** — spending by category with progress bars
- **Editable Budget Limits** — set your own monthly limits per category

### 💬 Ask AI
- **Chat with Claude** — ask anything about your finances
- **Pre-loaded suggestions** — "How am I doing this month?", "What's my biggest expense?", "Will I hit my goal?"
- **Context-aware** — Claude knows your earnings, spending, bills, and goals before you ask

---

## Smart Daily Target Formula

```
Step 1: Total upcoming bills (next 30 days)
        MINUS current debit/savings bank balance
        MINUS cash on hand
        = Gap (what you still need to earn)

Step 2: Gap ÷ days until earliest bill due
        = Bills portion of daily target

Step 3: Average daily spending from last 7 days (Plaid)
        = Dynamic essentials estimate

Step 4: Bills portion + Dynamic essentials
        = YOUR REAL DAILY TARGET
```

This updates automatically every time you log earnings, pay a bill, or your bank balance changes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single file) |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (90-day tokens) |
| Bank Sync | Plaid API (production) |
| Debt Tracking | Splitwise OAuth API |
| AI Features | Anthropic Claude (claude-sonnet-4-5) |
| Merchant Logos | Clearbit Logo API (free) |
| Hosting | Render (free tier) |

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Auth
JWT_SECRET=any_long_random_string

# Plaid (use 'production' for real banks)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_production_secret
PLAID_ENV=production

# Splitwise
SPLITWISE_CONSUMER_KEY=your_key
SPLITWISE_CONSUMER_SECRET=your_secret

# App
APP_URL=https://pbtrack.onrender.com

# Anthropic (for AI features)
ANTHROPIC_API_KEY=sk-ant-your_key
```

---

## Setup (do this once)

### Step 1 — Supabase database

1. Go to **supabase.com** → create a new project named `pbtrack`
2. Go to **SQL Editor** → paste contents of `database.sql` → Run
3. Run this additional SQL to add the plaid_id column:
```sql
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS plaid_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS earnings_plaid_id_idx 
ON earnings(plaid_id) WHERE plaid_id IS NOT NULL;
```

### Step 2 — Plaid account

1. Go to **dashboard.plaid.com** → sign up
2. Get your Client ID and Production secret from **Team → Keys**
3. Apply for Production access if needed (or use Development for up to 100 accounts)

### Step 3 — Anthropic API key

1. Go to **console.anthropic.com** → sign up
2. Create an API key
3. Add to Render environment as `ANTHROPIC_API_KEY`

### Step 4 — Deploy to Render

1. Push this repo to GitHub
2. Go to **render.com** → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free
5. Add all environment variables
6. Deploy — live in ~2 minutes

---

## Using the app

1. Open your app URL → create an account
2. Go to **Settings** → set your monthly earnings goal
3. Go to **Spending** → tap **Connect Bank** → link your bank via Plaid
4. Go to **Accounts** → tap **Connect** next to Splitwise
5. Go to **Bills** → tap **Add All** when recurring charges are detected
6. Tap **+** on home screen every day to log your earnings
7. Check **Home** each morning for your real daily target

---

## Transaction Rules

The app automatically categorizes transactions:

| Pattern | Category |
|---|---|
| WUVISAAFT | Family Support (transfers) |
| Tesla Supercharger | Transportation |
| Tesla Subscription | Subscription |
| Tesla Insurance | Auto |
| AT&T | Utilities |
| Crunchyroll, Cloaked, SmartCredit | Subscription |
| Apple Cash, Cash App sends | Transfers |
| Save Your Change, Backup Balance | Hidden (internal) |
| Lyft deposits, Uber InstantPay | Income |
| Trip, Tips (from Uber Pro Card) | Uber earnings |

---

## Plaid Sandbox Testing

Before using real banks:
- Username: `user_good`
- Password: `pass_good`

Switch back to production: set `PLAID_ENV=production` in Render environment.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Login / Signup page |
| `app.html` | Main dashboard (all 6 tabs) |
| `server.js` | Backend API (auth, Plaid, Splitwise, Claude AI) |
| `package.json` | Dependencies |
| `database.sql` | Database setup — run once in Supabase |
| `.env.example` | Environment variable template |
| `.gitignore` | Keeps .env private |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "@supabase/supabase-js": "^2.39.0",
  "plaid": "^14.0.0",
  "node-fetch": "^2.7.0",
  "@anthropic-ai/sdk": "^0.20.0"
}
```

---

## Roadmap

- [ ] Shift tracker (start/end shift, hourly earnings)
- [ ] Manual earnings smart dedup with Plaid transactions
- [ ] Push notifications for bill reminders
- [ ] Monthly PDF report
- [ ] Tax estimator (quarterly self-employment)
- [ ] Mileage tracker
- [ ] Net worth tracker over time
- [ ] Dark/light mode toggle
- [ ] Apple/Google Pay integration

---

Built for gig drivers who want real financial clarity. 💚
