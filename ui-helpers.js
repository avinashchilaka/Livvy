function setSyncing(v) {
  document.getElementById('syncDot').className='sync-dot'+(v?' syncing':'');
  document.getElementById('syncLbl').textContent=v?'Syncing...':'Live';
}

function flash(id,msg,color) {
  const el=document.getElementById(id);if(!el)return;
  el.textContent=msg;el.style.color=color;setTimeout(()=>el.textContent='',3000);
}
