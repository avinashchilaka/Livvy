// ═══════════════════════════════════════════════════════
// PLAID
// ═══════════════════════════════════════════════════════
async function openPlaidLink() {
  const r=await req('/api/plaid/link-token',{method:'POST'});
  if(!r?.link_token) return alert('Could not connect. Try again.');
  const handler=Plaid.create({
    token:r.link_token,
    onSuccess:async(public_token,meta)=>{
      setSyncing(true);
      const ex=await req('/api/plaid/exchange-token',{method:'POST',body:{public_token,institution_name:meta.institution?.name}});
      if(ex?.ok){await syncPlaid();await loadAccounts();}
      setSyncing(false);
    },
    onExit:err=>{if(err)console.error(err);}
  });
  handler.open();
}
async function fullResync() {
  if(!confirm('This will re-fetch ALL transactions from your banks including deposits. Takes 10-20 seconds. Continue?')) return;
  setSyncing(true);
  document.getElementById('syncLbl').textContent='Full sync...';
  try {
    // Reset cursor and clear old transactions
    await req('/api/plaid/reset-sync', {method:'POST'});
    // Clear local cache
    S.expenses=[];
    saveLocal();
    // Re-sync from scratch
    await syncPlaid();
    alert('✅ Full sync complete! Check Income tab for deposits.');
  } catch(e) { alert('Sync failed. Try again.'); }
  setSyncing(false);
}

async function syncPlaid() {
  setSyncing(true);
  const r=await req('/api/plaid/transactions');
  if(r?.transactions) {
    r.transactions.forEach(t=>{
      // Income/deposits ARE included in expenses with is_income:true
      // so they show in the Income tab on the Spend page
      // They are excluded from spending totals by the !e.is_income filter elsewhere
      const key=getMKey(t.description);
      if(S.rules[key]) t.category=S.rules[key];
      // Auto-categorize transfers
      const desc=(t.description||'').toLowerCase();
      if(!S.rules[key] && (desc.includes('save your change')||desc.includes('backup balance')||desc.includes('transfer')||desc.includes('zelle'))) {
        t.category='transfers'; t.is_income=false;
      }
      if(!S.expenses.some(e=>e.plaid_id===t.plaid_id)) S.expenses.push(t);
      else{const idx=S.expenses.findIndex(e=>e.plaid_id===t.plaid_id);if(idx>=0&&S.rules[key])S.expenses[idx].category=t.category;}
    });
    saveLocal();renderHome();
    if(document.getElementById('page-spend').classList.contains('active')) renderSpend();
  }
  setSyncing(false);
}
async function loadAccounts() {
  const r=await req('/api/plaid/accounts');
  if(r?.accounts){S.accounts=r.accounts;saveLocal();renderMore();renderHome();}
}
