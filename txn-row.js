// ═══════════════════════════════════════════════════════
// MERCHANT LOGOS
// ═══════════════════════════════════════════════════════
const DOMAINS={
  'uber':'uber.com','lyft':'lyft.com','doordash':'doordash.com','grubhub':'grubhub.com',
  'mcdonalds':'mcdonalds.com','mcdonald':'mcdonalds.com','starbucks':'starbucks.com',
  'amazon':'amazon.com','walmart':'walmart.com','target':'target.com',
  'netflix':'netflix.com','spotify':'spotify.com','shell':'shell.com',
  'chevron':'chevron.com','chipotle':'chipotle.com','subway':'subway.com',
  'chick-fil-a':'chickfila.com','chick fil a':'chickfila.com','cvs':'cvs.com',
  'walgreens':'walgreens.com','tesla':'tesla.com','apple':'apple.com',
  'google':'google.com','att':'att.com','t-mobile':'t-mobile.com',
  'paypal':'paypal.com','venmo':'venmo.com','instacart':'instacart.com',
  'uber eats':'ubereats.com','costco':'costco.com','whole foods':'wholefoods.com',
};
const CAT_IC={food:'🍔',transportation:'🚗',shopping:'🛍️',entertainment:'🎬',utilities:'💡',health:'💊',housing:'🏠',other:'📦',debt:'💳',subscription:'📱',transfers:'↔️',income:'💰',auto:'🚘'};

function logoEl(desc,cat) {
  const d=(desc||'').toLowerCase();
  let dom=null;
  for(const [k,v] of Object.entries(DOMAINS)){if(d.includes(k)){dom=v;break;}}
  if(!dom){const w=d.split(/\s+/).filter(x=>x.length>3)[0];if(w)dom=w+'.com';}
  if(dom) return `<div class="tlogo"><img src="https://logo.clearbit.com/${dom}" onerror="this.parentElement.innerHTML='${CAT_IC[cat]||'💳'}';this.parentElement.style.fontSize='.95rem'" alt=""></div>`;
  return `<div class="tlogo icon-md">${CAT_IC[cat]||'💳'}</div>`;
}

function txnRow(t,idx) {
  const isInc=t.is_income||t.category==='income';
  const sign=isInc?'+':'-'; const color=isInc?'var(--green)':'var(--red)';
  return `<div class="txn" onclick="openTxnDetail(${idx})">
    ${logoEl(t.description,t.category)}
    <div class="tbody">
      <div class="tname">${t.label||t.description||'Transaction'}</div>
      <div class="tmeta">${t.date} · ${ttc(t.category||'Other')}${t.institution?' · '+t.institution:''}</div>
    </div>
    <div class="tamt" style="color:${color}">${sign}${fmt(t.amount)}</div>
  </div>`;
}
