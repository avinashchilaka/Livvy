function exportData() {
  const b=new Blob([JSON.stringify({state:S,exported:new Date().toISOString()},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`livvy-backup-${_todayStr}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importData(inp) {
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{try{const d=JSON.parse(e.target.result);if(d.state){Object.assign(S,d.state);saveLocal();renderHome();alert('✅ Data restored!');}}catch{alert('Invalid backup file');}};
  r.readAsText(f);
}
