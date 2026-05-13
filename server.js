require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Supabase ─────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Plaid ────────────────────────────────────────────────
const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: { headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
    'PLAID-SECRET':    process.env.PLAID_SECRET,
  }},
}));

// ── JWT Auth Middleware ───────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, monthly_goal } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Check if user exists
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from('users').insert({
      name, email, password_hash: hash,
      monthly_goal: monthly_goal || 9500,
      daily_quota: 400,
    }).select().single();

    if (error) throw error;

    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, user: { id: user.id, name, email, monthly_goal: user.monthly_goal } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.json({ token, user: { id: user.id, name: user.name, email, monthly_goal: user.monthly_goal } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════
// EARNINGS ROUTES
// ════════════════════════════════════════════════════════

app.get('/api/earnings', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('earnings')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.post('/api/earnings', auth, async (req, res) => {
  const { amount, platform, date, note, is_manual } = req.body;
  const { data, error } = await supabase.from('earnings').insert({
    user_id: req.user.id, amount, platform, date, note, is_manual: is_manual !== false
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/earnings/:id', auth, async (req, res) => {
  await supabase.from('earnings').delete()
    .eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════
// BILLS ROUTES
// ════════════════════════════════════════════════════════

app.get('/api/bills', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('bills').select('*').eq('user_id', req.user.id).order('due_day');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.post('/api/bills', auth, async (req, res) => {
  const { name, amount, due_day, category } = req.body;
  const { data, error } = await supabase.from('bills').insert({
    user_id: req.user.id, name, amount, due_day, category, paid: false
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/bills/:id', auth, async (req, res) => {
  const { data, error } = await supabase.from('bills')
    .update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/bills/:id', auth, async (req, res) => {
  await supabase.from('bills').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════
// DEBTS ROUTES
// ════════════════════════════════════════════════════════

app.get('/api/debts', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('debts').select('*').eq('user_id', req.user.id).order('amount', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.post('/api/debts', auth, async (req, res) => {
  const { name, amount, original, monthly_payment, notes } = req.body;
  const { data, error } = await supabase.from('debts').insert({
    user_id: req.user.id, name, amount, original: original || amount, monthly_payment, notes
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/debts/:id', auth, async (req, res) => {
  const { data, error } = await supabase.from('debts')
    .update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ════════════════════════════════════════════════════════
// SETTINGS ROUTES
// ════════════════════════════════════════════════════════

app.get('/api/settings', auth, async (req, res) => {
  const { data } = await supabase.from('users')
    .select('monthly_goal, daily_quota').eq('id', req.user.id).single();
  res.json(data || {});
});

app.put('/api/settings', auth, async (req, res) => {
  const { monthly_goal, daily_quota } = req.body;
  await supabase.from('users').update({ monthly_goal, daily_quota }).eq('id', req.user.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════
// PLAID ROUTES
// ════════════════════════════════════════════════════════

app.post('/api/plaid/link-token', auth, async (req, res) => {
  try {
    const r = await plaid.linkTokenCreate({
      user: { client_user_id: req.user.id },
      client_name: 'PBTrack',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: r.data.link_token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/plaid/exchange-token', auth, async (req, res) => {
  try {
    const { public_token, institution_name } = req.body;
    const r = await plaid.itemPublicTokenExchange({ public_token });

    await supabase.from('plaid_tokens').upsert({
      user_id:      req.user.id,
      institution:  institution_name,
      access_token: r.data.access_token,
      item_id:      r.data.item_id,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/plaid/transactions', auth, async (req, res) => {
  try {
    const { data: tokens } = await supabase
      .from('plaid_tokens').select('*').eq('user_id', req.user.id);
    if (!tokens?.length) return res.json({ transactions: [] });

    const all = [];
    for (const t of tokens) {
      let cursor = t.cursor || null, hasMore = true;
      while (hasMore) {
        const r = await plaid.transactionsSync({
          access_token: t.access_token,
          ...(cursor ? { cursor } : {}),
        });
        r.data.added.forEach(tx => all.push(mapTx(tx, t.institution)));
        cursor  = r.data.next_cursor;
        hasMore = r.data.has_more;
      }
      // Save cursor for next sync
      await supabase.from('plaid_tokens')
        .update({ cursor }).eq('id', t.id);
    }

    // Store transactions in DB (upsert — no duplicates)
    if (all.length) {
      await supabase.from('transactions').upsert(
        all.map(t => ({ ...t, user_id: req.user.id })),
        { onConflict: 'plaid_id' }
      );
    }

    // Return all user's Plaid transactions
    const { data: txns } = await supabase
      .from('transactions').select('*').eq('user_id', req.user.id)
      .eq('is_plaid', true).order('date', { ascending: false }).limit(300);

    res.json({ transactions: txns || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function mapTx(t, source) {
  const isIncome = t.amount < 0;
  const catMap   = {
    'TRANSPORTATION':'transportation','AUTO':'transportation',
    'FOOD_AND_DRINK':'food','GENERAL_MERCHANDISE':'shopping',
    'HOME_IMPROVEMENT':'housing','MEDICAL':'health',
    'ENTERTAINMENT':'entertainment','UTILITIES':'utilities',
    'RENT_AND_UTILITIES':'utilities','LOAN_PAYMENTS':'debt',
    'INCOME':'income','TRAVEL':'transportation',
  };
  return {
    plaid_id:    t.transaction_id,
    date:        t.date,
    amount:      Math.abs(t.amount),
    description: t.name,
    category:    catMap[t.personal_finance_category?.primary?.toUpperCase()] || 'other',
    account_id:  t.account_id,
    institution: source,
    is_plaid:    true,
    is_income:   isIncome,
  };
}

// ════════════════════════════════════════════════════════
// SPLITWISE ROUTES
// ════════════════════════════════════════════════════════

app.get('/api/splitwise/auth-url', auth, (req, res) => {
  const callbackUrl = `${process.env.APP_URL}/api/splitwise/callback`;
  const url = `https://secure.splitwise.com/oauth/authorize?response_type=code`
    + `&client_id=${process.env.SPLITWISE_CONSUMER_KEY}`
    + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
    + `&state=${req.user.id}`;
  res.json({ url });
});

app.get('/api/splitwise/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    const callbackUrl = `${process.env.APP_URL}/api/splitwise/callback`;

    // Exchange code for token
    const r = await fetch('https://secure.splitwise.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        code,
        client_id:     process.env.SPLITWISE_CONSUMER_KEY,
        client_secret: process.env.SPLITWISE_CONSUMER_SECRET,
        redirect_uri:  callbackUrl,
      }),
    });
    const data = await r.json();

    await supabase.from('splitwise_tokens').upsert({
      user_id:      userId,
      access_token: data.access_token,
    });
    res.redirect('/app.html?splitwise=connected');
  } catch (e) {
    res.redirect('/app.html?splitwise=error');
  }
});

app.get('/api/splitwise/balances', auth, async (req, res) => {
  try {
    const { data: tokenRow } = await supabase
      .from('splitwise_tokens').select('access_token').eq('user_id', req.user.id).single();
    if (!tokenRow) return res.json({ balances: [] });

    const r = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
      headers: { Authorization: `Bearer ${tokenRow.access_token}` }
    });
    const { user } = await r.json();

    const r2 = await fetch('https://secure.splitwise.com/api/v3.0/get_friends', {
      headers: { Authorization: `Bearer ${tokenRow.access_token}` }
    });
    const { friends } = await r2.json();

    const balances = [];
    (friends || []).forEach(f => {
      (f.balance || []).forEach(b => {
        const amt = parseFloat(b.amount);
        if (amt < 0) { // You owe them
          balances.push({
            name:   `${f.first_name} ${f.last_name || ''}`.trim(),
            amount: Math.abs(amt),
            currency: b.currency_code,
          });
        }
      });
    });
    res.json({ balances });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════════════════
// SERVE FRONTEND
// ════════════════════════════════════════════════════════

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'app.html')));

app.listen(PORT, () => {
  console.log(`✅ PBTrack running at http://localhost:${PORT}`);
});
