# PBTrack Complete Development Audit
## Every Change, Every Response, In Order

---

## INITIAL STATE (Before any changes)
App was live at pbtrack.onrender.com with:
- Login/signup working
- Basic earnings tracker
- Plaid bank sync (sandbox)
- Splitwise integration
- Bills tracker, debt tracker, spending tab

---

## ROUND 1 — First Features Requested

**You requested:**
- AI transaction categorization endpoint
- Merchant logos on transactions (Clearbit)
- Morning AI daily briefing card on home screen

**What was built:**
- `/api/ai/categorize` endpoint in server.js using Claude API
- Clearbit logo API integration on transaction rows
- AI briefing card on home screen ("You need $380 today...")
- Claude model: claude-sonnet-4-20250514 (wrong — caused issues later)

**Your response:**
- App crashed on deploy — "Cannot find module @anthropic-ai/sdk"
- Render build command needed `npm install` to pick up new package
- After fixing: briefing card showed but kept spinning/loading

---

## ROUND 2 — Greeting + Target Fix

**You reported:**
- "Good morning" showing at 10:51 PM
- Daily target showing $5,983 (insane number)

**What was fixed:**
- Greeting now uses live `new Date().getHours()` on every load
- Daily target formula fixed — excluded Splitwise $110K from driving goal
- New formula: (monthly goal - earned) / days left in month

**Your response:**
- "Good evening" now showing correctly ✅
- Target now showing $468 — much more realistic ✅
- AI briefing still spinning (Anthropic SDK issue)

---

## ROUND 3 — Spending Tab Improvements

**You requested:**
- Donut chart for spending categories
- Daily earnings vs spending bar chart
- Better categorization (Trip/Tips showing as "other")
- Capital letters on category names

**What was built:**
- Spending donut chart with color-coded categories
- Daily cash flow bar chart (green earnings, red spending)
- Auto-categorization rules (Trip → income, Tips → income)
- Category names properly capitalized
- Page persistence (stays on same tab after refresh)

**Your response:**
- Charts looking good ✅
- But earnings tab still empty — Plaid data not pulling in
- Negative amounts still showing for some transactions
- Bills tab still empty

---

## ROUND 4 — Earnings Sync Fix

**You reported:**
- Earnings tab showing zero
- Negative amounts on transactions
- Bills empty

**What was fixed:**
- server.js mapTx function updated to flip signs correctly
- Auto-import Uber/Lyft into earnings table from Plaid
- Added plaid_id column to earnings table
- SQL: `ALTER TABLE earnings ADD COLUMN IF NOT EXISTS plaid_id TEXT UNIQUE`
- SQL: `DELETE FROM transactions; UPDATE plaid_tokens SET cursor = NULL`

**Your response:**
- After re-sync: earnings populated ✅
- Uber/Lyft/Tips all showing from Plaid ✅
- But "Trip" and "Tips" labels not clear
- Bills still empty

---

## ROUND 5 — Labels + Bills Auto-Detection

**You reported:**
- "Other · Trip" should say "Uber · Trip"
- Bills tab completely empty
- Need Yesterday filter on earnings (working after midnight)

**What was built:**
- Added Yesterday tab + date picker to earnings history
- Trip → "Uber · Fare", Tips → "Uber · Tip"
- Auto-detect recurring bills from transactions
- Suggested bills: AT&T $541, Tesla Subscription $106, Crunchyroll $2.99, etc.
- Bill ordinal suffixes (1st, 2nd, 3rd — but had 21TH bug)

**Your response:**
- Yesterday filter working ✅
- But bills auto-detected duplicated many times (Skool added 6 times)
- "21TH" instead of "21st" — ordinal bug

---

## ROUND 6 — Deduplication + Ordinal Fix

**You reported:**
- Duplicate bills (Skool ×6, Apple Services ×4, Wells Fargo ×2)
- "21TH" ordinal suffix bug

**What was fixed:**
- Bill deduplication — each bill only added once
- Ordinal suffix corrected (1st, 2nd, 3rd, 4th, 21st)
- SQL: `DELETE FROM bills` to clear duplicates

**Your response:**
- Bills now showing correctly ✅
- Discover credit card showing wrong (owed shown in green)
- Break-even tracker confusing
- AI still broken

---

## ROUND 7 — Accounts Tab + AI Fix

**You requested:**
- Replace Debts tab with Accounts tab
- Show connected bank accounts with balances
- Fix AI model name (claude-sonnet-4-20250514 → claude-sonnet-4-5)
- Smart alerts for upcoming bills (not Splitwise popup)
- Recent Activity on home = green earnings + red spending mixed

**What was built:**
- New Accounts tab with bank balances, Splitwise debts, manual debts, payoff timeline
- Smart alerts: overdue bills, bills due soon, daily goal progress
- Mixed earnings/spending feed on home screen
- Rules engine for categories (WUVISAAFT → Family Support, etc.)
- AI model fixed to claude-sonnet-4-5

**Your response:**
- Accounts tab looking great ✅
- AI Chat working ✅
- But "Other" category still a mess
- Some transactions still wrongly categorized
- Discover credit showing $1,373 (asked about it)

---

## ROUND 8 — Category Cleanup + SQL Updates

**You reported:**
- WUVISAAFT, Apple Cash, Cash App still in "Other"
- Category names lowercase

**What was fixed:**
- SQL updates to fix existing transaction categories in database
- Transfers, subscriptions, auto, family support all corrected
- Category display capitalization fixed

**Your response:**
- Categories much cleaner ✅
- "You Owe" section on home screen — wanted it removed

---

## ROUND 9 — Home Screen Cleanup

**You requested:**
- Remove "You Owe (Splitwise)" from home screen
- Fix ordinal suffixes again

**What was fixed:**
- Splitwise section removed from home
- Ordinals fully fixed

**Your response:**
- Home screen cleaner ✅
- Discussed the Uber payment flow confusion
- Realized duplicate counting issue: Trip/Tips + InstantPay both being counted

---

## ROUND 10 — Uber Payment Flow Discussion

**You explained:**
- Two payment methods: Uber Pro Card (auto per trip) vs Varo (manual cashout)
- When using Varo: InstantPay = real income, Trip/Tips = intermediate
- When using Uber Pro Card: Trip/Tips = real income
- Currently using Varo for cashouts
- Want one editable earning entry per platform per day

**Decision made:**
- Earnings tab = MANUAL LOGS ONLY
- Plaid income goes to Budget tab only
- One entry per platform per day (Uber, Lyft, Cash, Other)
- Edit throughout the day, saves as running total
- InstantPay/UberProCard transfers → categorized as "transfers" not income

---

## PHASE 1 BUILD

**Features built:**

### Smart Daily Target Formula
- Old: (monthly goal - earned) / days left
- New: (upcoming bills - bank balance - cash on hand) / days until first bill + 7-day avg daily spending
- Dynamic: updates when bills paid, earnings logged, bank syncs
- Shows breakdown card: Bills coverage/day + Essentials/day + Available funds = Real target

### Budget Tab (New 7th tab)
- Monthly earned vs spent overview
- Net this month
- Daily target breakdown
- Income by source (Uber/Lyft/Cash)
- Spending by category with progress bars
- Editable budget limits

### Editable Daily Earnings
- + FAB opens daily log modal (not quick log)
- Fields: Uber, Lyft, Cash, Other amounts
- One entry per platform per day
- Updates existing entry, doesn't create duplicate
- Saves dailyLogs to state

### Cash on Hand
- Input field in Accounts tab
- Included in daily target calculation

### Bills Sorted + Editable
- Overdue first, then by due_day
- ✏️ edit button on each bill
- Edit modal: name, amount, due_day, category

### Best Earning Days Chart Fix
- Uses daily totals not individual transactions
- Better bar height scaling

### AI Model Name
- Fixed to claude-sonnet-4-5 everywhere

### PATCH Endpoint
- Added PATCH /api/earnings/:id to server.js

**Your response:**
- App loaded ✅
- Bills tab sorted with edit buttons ✅
- Budget tab showing ✅
- AI briefing still spinning
- Discover credit card showing in green (should be red)

---

## PHASE 2 BUILD

**Features built:**

### Shift Tracker
- Start/End shift button in Earnings tab
- Live timer (HH:MM:SS)
- Shows hours driven, earnings this shift, $/hour
- Saves last 30 shifts to localStorage
- Restores active timer on page reload

### Clickable Stats
- Uber/Lyft/Net on home → drill-down modal
- This Week/This Month on earnings → drill-down
- Platform breakdown modal

### Today's Earnings Fix
- getTodayEarnings() checks dailyLogs first, then all earnings
- Now shows correctly including Plaid

### Weekly Projection Improved
- Shows on-track vs behind vs real target
- "Need $X more this week" when behind

### InstantPay as Transfers
- Added to rules: uber instantpay, instantpay deposit, uber pro card
- server.js transferPatterns updated
- These no longer count as income or spending

### Credit Card Display
- Credit: owed in RED, available in GREEN
- Debit: balance in GREEN
- Applies to ALL credit type accounts

### Version-Based Cache Clearing
- APP_VERSION = 'v3.0'
- On version change: clears state cache
- KEEPS token and user (stays logged in)

**Your response:**
- Shift tracker working ✅
- Credit card colors correct ✅
- But earnings today showing $0 (old logging system)
- Weekly projection better ✅

---

## PHASE 3 BUILD

**Features built:**

### Earnings Tab = Manual Logs Only
- renderEarningsHistory() filters: is_manual === true AND !plaid_id
- No more Plaid trips/tips in earnings tab
- Plaid income goes to Budget tab only

### Edit Earnings Modal
- ✏️ button on every manual earning
- Change amount, platform, date, note
- Calls PATCH /api/earnings/:id

### Delete Earnings
- × button working correctly
- Calls DELETE /api/earnings/:id

### Skip Bills
- Skip button on each unpaid bill
- Skipped bills excluded from target calculation
- Shows "Skipped" chip
- Unskip button to restore
- SQL: ALTER TABLE bills ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false

### Transaction Detail Popup
- Tap any transaction → modal
- Shows: amount, date, category, account, bank source

### Category Drill Down
- Tap any category bar → all transactions for that category
- Tap donut chart → same
- Each transaction tappable for full detail

### All Transactions Clickable
- Every transaction row tappable
- Opens detail modal

### Stop Plaid Inserting Into Earnings
- server.js: removed auto-insert of Plaid income to earnings table
- ALL Plaid transactions → transactions table only
- Earnings table = manual entries only

### Compact Bills Layout
- One line per bill
- ✓ Pay, Skip, ✏️ all on same row

### Category Name Display Fix
- family_support → "Family Support"
- Uses: cat.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())

### Logout Keeps Cache
- logout() only removes pb_token and pb_user
- Keeps pb_state (financial data)
- Faster reload after login

### Accounts Tab Refresh
- After Plaid connects: loadPlaidAccounts() auto-called
- After syncPlaid: renderAccounts() if on accounts page
- Splitwise OAuth return handled

### AI Briefing Fix
- Hidden by default (display:none)
- Only shows after server confirms awake
- × dismiss button
- 30-second timeout

**Your response:**
- Categories clickable ✅
- Bills have skip button ✅
- Earnings tab manual only ✅
- But accounts tab STILL not showing connected banks
- Bills empty on Safari (fresh login)
- "Syncing with bank..." loop on home
- Safari vs Chrome showing different data

---

## PLAID CRISIS

**What happened:**
- You hit 20/10 trial connection limit
- Every time you deleted Supabase data and reconnected = new connection
- By connection 20 → completely blocked
- "Trial Connection Limit Exceeded" error

**What was done:**
- Switched to Sandbox mode (PLAID_ENV=sandbox)
- Sandbox credentials: user_good / pass_good / OTP: 1234
- Applied for Plaid Production access

**Production access form answers:**
- Business: PBTrack, personal finance for gig drivers
- Products: Transactions only
- Plan: Pay-as-you-go (~$0.30/month per account)
- Security: Single-user personal app, managed by Render/Supabase

**SQL needed to switch environments:**
```sql
DELETE FROM plaid_tokens;
DELETE FROM transactions;
```

---

## INIT FUNCTION FIXES (Jules PR)

**Jules fixed:**
- Removed duplicate setSyncing(true) call
- After data loads: renders Home, Bills, Accounts, Budget, Spending
- Earnings filtered to manual only during init
- Plaid INVALID_ACCESS_TOKEN error handled gracefully
- AI briefing 30-second timeout

---

## PENDING JULES TASKS (second prompt)

**Requested but not yet confirmed:**
- Accounts tab: show connected bank names/balances after Plaid connects
- Remove duplicate Connect Bank buttons (keep only in Accounts tab)
- Remove duplicate Splitwise connect (keep only in Accounts tab)
- Clean up Settings tab (remove Connected Accounts section)
- Dark/light mode via prefers-color-scheme
- + FAB only opens daily earnings log modal

---

## CURRENT STATE (As of end of session)

**Working ✅**
- Login/signup
- Manual earnings logging with edit/delete
- Bills add/pay/skip/edit sorted by urgency
- Spending tab with donut chart, categories clickable
- Ask AI chat (Claude responding)
- Shift tracker
- Smart daily target calculation
- Budget tab showing income/spending breakdown
- Clickable stats drill-down

**Broken/Incomplete ❌**
- Accounts tab not showing connected banks
- Recent Activity "Syncing with bank..." loop
- Bills empty on fresh device login
- Plaid production approval pending (submitted May 13, 2026)
- Sandbox showing fake data (Chase/BofA) not real data
- Safari vs Chrome cache mismatch

---

## TO RESTORE LAST WORKING STATE

The last working state was when Plaid production was connected and all real transactions were showing.

**Steps to restore:**
1. Wait for Plaid production approval email
2. In Render environment: set PLAID_ENV=production, PLAID_SECRET=production key
3. Run in Supabase:
```sql
DELETE FROM plaid_tokens;
DELETE FROM transactions;
UPDATE plaid_tokens SET cursor = NULL;
```
4. Reconnect bank in PBTrack → Accounts → Connect Bank
5. All real data will flow back in

**Git rollback (if needed):**
- Go to github.com/avinashchilaka/PBTrack
- Click History on app.html or server.js
- Find commit before issues started
- Use "Revert" or copy old file contents

---

## KEY DECISIONS MADE DURING DEVELOPMENT

1. **Earnings tab = manual logs ONLY** — Plaid income goes to Budget tab
2. **Uber InstantPay/UberProCard transfers** = skip (marked as transfers)
3. **WUVISAAFT** = family_support category
4. **Daily target** = dynamic (bills + 7-day spending avg), not fixed quota
5. **Splitwise** = shown in Accounts tab only, removed from home
6. **Credit cards** = owed in red, available in green
7. **One earning entry per platform per day** — edit throughout day

---

## ENVIRONMENT VARIABLES (Render)
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- JWT_SECRET
- PLAID_CLIENT_ID
- PLAID_SECRET (sandbox or production)
- PLAID_ENV (sandbox or production)
- ANTHROPIC_API_KEY
- APP_URL=https://pbtrack.onrender.com
- SPLITWISE_CONSUMER_KEY
- SPLITWISE_CONSUMER_SECRET

---

## DATABASE SQL COMMANDS USED THROUGHOUT

```sql
-- Add plaid_id to earnings
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS plaid_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS earnings_plaid_id_idx ON earnings(plaid_id) WHERE plaid_id IS NOT NULL;

-- Add skipped to bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false;

-- Clean up for environment switch
DELETE FROM plaid_tokens;
DELETE FROM transactions;
UPDATE plaid_tokens SET cursor = NULL;

-- Clean Plaid earnings from earnings table
DELETE FROM earnings WHERE is_manual = false OR plaid_id IS NOT NULL;

-- Fix category names in existing transactions
UPDATE transactions SET category = 'transfers' WHERE LOWER(description) LIKE '%wuvisaaft%';
UPDATE transactions SET category = 'subscription' WHERE LOWER(description) LIKE '%crunchyroll%';
UPDATE transactions SET category = 'subscription' WHERE LOWER(description) LIKE '%tesla subscription%';
UPDATE transactions SET category = 'auto' WHERE LOWER(description) LIKE '%tesla insurance%';
UPDATE transactions SET category = 'transfers' WHERE LOWER(description) LIKE '%uber pro card%';
UPDATE transactions SET category = 'transfers' WHERE LOWER(description) LIKE '%uber instantpay%';
```
