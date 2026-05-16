# Livvy — Gig Driver Finance Dashboard

> Personal finance command center built specifically for Uber/Lyft drivers.  
> Tracks daily earnings manually, auto-imports bank spending via Plaid,  
> calculates a smart daily target based on real bills and debts, and uses  
> Claude AI for briefings, chat, and budget suggestions.

---

## What This App Does

Livvy is a full-stack web app accessible from any device via a URL.  
It is **not** a generic finance app — every feature is designed around  
the reality of gig driving: variable income, daily targets, shift tracking,  
and managing multiple debts alongside monthly bills.

### Core Features

**Home Tab**
- Smart daily target ring — shows exactly how much to earn today
- Target is calculated from overdue bills + upcoming bills + one-time payments + next month rent + daily ops ($86.37) + Splitwise debts — updated in real time
- AI morning briefing from Claude — personalized daily insights
- Dismissable alerts for overdue bills, bills due soon, and goal hits
- Break-even tracker — are you in profit or deficit today?
- Upcoming bills preview + recent Plaid transactions

**Earnings Tab — Manual Logs Only**
- Log Uber, Lyft, Cash, Other earnings manually
- Shift timer — start/stop with live hours + $/hr display
- Editable shift log — set exact start/end times if you forgot to start
- Best earning days chart (Mon–Sun average)
- Weekly projection based on current daily average
- Monthly goal progress bar
- Full earnings history with edit and delete

**Spending Tab — Plaid Transactions Only**
- All bank transactions auto-imported from Plaid
- Donut chart showing spending breakdown by category
- 7-day cash flow bar chart (earnings vs spending side by side)
- AI budget suggestions — Claude analyzes 3 months of history and suggests limits per category AND flags high-spend merchants (e.g. Starbucks $120/mo)
- Budget progress bars with color-coded limits
- Category filter chips — tap to see only food, transport, etc.
- Tap any transaction to edit its category
- Merchant rules — when you change a category, choose to apply it to ALL past, present, and future transactions from that merchant permanently

**Bills Tab — All Obligations**
- Recurring monthly bills (rent, Tesla, insurance, subscriptions)
- One-time payments (vehicle registration, borrowed money, tires, repairs)
- Both types shown in one list sorted by due date
- Pay / Skip / Undo skip / Edit on every item
- Paying a bill immediately recalculates the home target
- Auto-detection of recurring charges from Plaid transactions

**More Tab**
- Bank accounts from Plaid with live balances
- Splitwise balances (who you owe)
- Manual debts (Eddie, personal loans)
- AI Chat — ask anything about your finances
- Settings — monthly goal, daily quota
- Backup and restore data

---

## Architecture

```
Browser (app.html)
    │
    ├── Manual earnings → S.earnings[] (never touched by Plaid)
    ├── Plaid transactions → S.expenses[] (never touched by manual log)
    ├── Bills + one-time → S.bills[] + S.onetime[]
    └── Merchant rules → S.rules{} (applied on every sync)
    │
    ↓
Node.js server (server.js) on Render
    │
    ├── Supabase (PostgreSQL) — stores all user data
    ├── Plaid API — bank transaction sync (production mode)
    ├── Splitwise API — debt balances
    └── Anthropic Claude API — briefing, chat, budget suggestions
```

**Critical rule enforced in both frontend and backend:**  
`earnings[]` = manual logs ONLY — Plaid NEVER writes here  
`expenses[]` = Plaid ONLY — manual logs NEVER go here  
Daily target reads from `bills[]` and `debts[]` ONLY

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML + modular JS (app.html + 10 JS files + styles.css) |
| Backend | Node.js + Express (server.js) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (bcryptjs + jsonwebtoken) |
| Bank sync | Plaid (production mode) |
| Debt tracking | Splitwise OAuth API |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Hosting | Render (free tier) |
| Fonts | Inter + DM Mono (Google Fonts) |
| Merchant logos | Clearbit Logo API (free) |

---

## Files in This Repo

| File | Purpose |
|---|---|
| `app.html` | Dashboard shell — all 5 tabs and 13 modals, loads all JS modules |
| `styles.css` | All app CSS — design tokens, components, dark/light theme, utility classes |
| `storage.js` | localStorage helpers — saveLocal, loadLocal, loadRules, logout |
| `ui-helpers.js` | DOM utilities — flash messages, sync indicator |
| `data-io.js` | Backup and restore — exportData, importData |
| `modals.js` | Modal open/close + tap-outside-to-dismiss listener |
| `txn-row.js` | Transaction row rendering — merchant logos, category icons |
| `target-calc.js` | Daily target formula + all earnings/spending calculation helpers |
| `shift-timer.js` | Shift timer — start, stop, tick, save, restore on reload |
| `plaid.js` | Plaid bank sync — link, resync, transaction fetch, account load |
| `ai.js` | AI features — morning briefing, chat, budget suggestions |
| `app.js` | Core — state object, API layer, navigation, all render functions, init |
| `index.html` | Login and signup page |
| `server.js` | Backend API — auth, earnings, bills, Plaid, Splitwise, AI |
| `package.json` | Node.js dependencies |
| `.env.example` | Environment variable template — copy to `.env` |
| `.gitignore` | Keeps `.env` and `node_modules` out of GitHub |
| `README.md` | This file |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.  
Never commit `.env` to GitHub — it is in `.gitignore`.

```
SUPABASE_URL              = https://xxxx.supabase.co
SUPABASE_SERVICE_KEY      = eyJ... (service_role key — NOT anon key)
JWT_SECRET                = any long random string (32+ chars)
PLAID_CLIENT_ID           = from dashboard.plaid.com → Developers → Keys
PLAID_SECRET              = production secret from Plaid dashboard
PLAID_ENV                 = production
SPLITWISE_CONSUMER_KEY    = from splitwise.com/apps
SPLITWISE_CONSUMER_SECRET = from splitwise.com/apps
ANTHROPIC_API_KEY         = sk-ant-... from console.anthropic.com
APP_URL                   = https://pbtrack.onrender.com
PORT                      = 3000
```

---

## Database Tables

| Table | What it stores |
|---|---|
| `users` | Accounts, settings, budget limits, merchant rules |
| `earnings` | Manual earnings only (Uber/Lyft/Cash) — is_manual always true |
| `bills` | Recurring monthly bills |
| `onetime_payments` | One-time payments with a specific due date |
| `debts` | Manual debts (Eddie, loans) |
| `transactions` | Plaid bank transactions only — expenses, never earnings |
| `plaid_tokens` | Plaid access tokens per institution |
| `splitwise_tokens` | Splitwise OAuth access token |
| `shifts` | Shift log history (start time, end time, hours, earnings) |

---

## Setup Instructions (First Time)

### 1. Supabase
1. Go to supabase.com and create a free project
2. Go to SQL Editor → New Query
3. Paste the entire contents of `database.sql` and click Run
4. Go to Settings → API and copy:
   - Project URL → `SUPABASE_URL`
   - service_role key (the long one) → `SUPABASE_SERVICE_KEY`

### 2. Plaid (Production)
1. Go to dashboard.plaid.com → Developers → Keys
2. Copy Client ID → `PLAID_CLIENT_ID`
3. Copy Production secret → `PLAID_SECRET`
4. Set `PLAID_ENV=production`

### 3. Splitwise
1. Go to splitwise.com → Apps → Register your application
2. App name: Livvy
3. Homepage URL: https://pbtrack.onrender.com
4. Callback URL: https://pbtrack.onrender.com/api/splitwise/callback
5. Copy Consumer Key and Secret

### 4. Anthropic
1. Go to console.anthropic.com
2. API Keys → Create Key → name it Livvy
3. Copy the key → `ANTHROPIC_API_KEY`
4. Add $5 credit minimum to your account

### 5. GitHub
1. Push all files to github.com/avinashchilaka/PBTrack
2. Do not push `.env` — it is gitignored

### 6. Render
1. Go to render.com → New Web Service
2. Connect github.com/avinashchilaka/PBTrack
3. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free
4. Add all environment variables from your `.env` file
5. Click Deploy Web Service
6. App goes live at https://pbtrack.onrender.com

---

## Updating the App

When you want to add new features or fix something:
1. Make changes to files
2. Upload to GitHub (or use Jules to push via PR)
3. Render auto-detects the GitHub change and redeploys
4. New version is live in 3-5 minutes

---

## Connecting Banks (After Deploy)

1. Open pbtrack.onrender.com
2. Go to Spending tab
3. Tap Connect Bank
4. Plaid Link opens — log in with your real bank credentials
5. Transactions start importing automatically
6. Merchant rules apply on every future sync

Banks to connect:
- Varo Bank
- Uber Debit Card
- Discover Card
- Capital One (if applicable)

---

## Smart Daily Target Formula

The home target ring is calculated using this 6-part formula:

```
1. Overdue bills (past due, unpaid) ÷ days left in month
2. Each upcoming bill ÷ days until that bill is due
3. One-time payments ÷ days until each payment is due
4. Next month rent ($2,084) ÷ days left in month
5. Splitwise monthly contribution ÷ 30
6. Daily ops ($86.37/day fixed)

Total per day - today's earnings already logged + today's spending
= Your real target for today
```

If you're behind (overdue bills) the number goes up automatically.  
If you log earnings, the number goes down in real time.  
Paying a bill immediately recalculates the target.

---

## Merchant Rules

When you tap a Plaid transaction and change its category:
- A popup asks: "Apply to ALL transactions from this merchant?"
- If yes: every past, present, and future transaction from that merchant gets the new category
- Rules are saved to the database and re-applied on every Plaid sync
- Example: Change "Tesla Supercharger" from "other" to "transportation" once — it stays forever

---

## Version History

| Version | Description |
|---|---|
| v1.x | Original single HTML file, localStorage only, no backend |
| v2.x | Added backend + Plaid + AI but broke daily target formula |
| v3.0 | Complete rebuild — strict data separation, all features working |
| v3.1 | Frontend split into modular JS files — no behavior changes |

---

## Live URL

**https://pbtrack.onrender.com**

Note: Free Render tier sleeps after 15 minutes of inactivity.  
First load after sleep takes 30-60 seconds to wake up.  
All subsequent loads are instant.
