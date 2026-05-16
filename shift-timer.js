// ═══════════════════════════════════════════════════════
// SHIFT TIMER
// ═══════════════════════════════════════════════════════
function toggleShift() { if(localStorage.getItem('pb_shift')) endShift(); else startShift(); }
function startShift() {
  localStorage.setItem('pb_shift',Date.now());
  localStorage.setItem('pb_shift_e',todayEarnings());
  const btn=document.getElementById('shiftBtn');
  if(btn){btn.textContent='🛑 End Shift';btn.style.background='var(--red)';}
  document.getElementById('shiftStatLine').style.display='block';
  document.getElementById('shiftCard').style.background='var(--s1)';
  _shiftInterval=setInterval(tickShift,1000);tickShift();
}
function endShift() {
  const start=parseInt(localStorage.getItem('pb_shift')||0);
  const el=Date.now()-start, hours=el/3600000;
  const h=Math.floor(hours),m=Math.floor((hours-h)*60);
  clearInterval(_shiftInterval);_shiftInterval=null;
  // Prompt user to enter earnings — auto-calc was unreliable
  const earnedStr=prompt(`Shift ended: ${h}h ${m}m\nHow much did you earn this shift? ($)`,'0');
  if(earnedStr===null){
    // User cancelled — restart timer
    _shiftInterval=setInterval(tickShift,1000);tickShift();
    localStorage.setItem('pb_shift',start);
    return;
  }
  const earned=Math.max(0,parseFloat(earnedStr)||0);
  localStorage.removeItem('pb_shift');localStorage.removeItem('pb_shift_e');
  const shift={id:Date.now()+'',date:_todayStr,start:new Date(start).toTimeString().slice(0,5),end:new Date().toTimeString().slice(0,5),hours:Math.round(hours*10)/10,earned:Math.round(earned*100)/100,perHour:hours>.05?Math.round(earned/hours*100)/100:0};
  S.shifts.unshift(shift);if(S.shifts.length>50)S.shifts.pop();
  req('/api/shifts',{method:'POST',body:shift});saveLocal();
  const btn=document.getElementById('shiftBtn');
  if(btn){btn.textContent='🚗 Start Shift';btn.style.background='';}
  document.getElementById('shiftStatLine').style.display='none';
  document.getElementById('shiftDisp').textContent='00:00:00';
  document.getElementById('shiftCard').style.background='';
  alert(`✅ Shift saved!\n${h}h ${m}m · ${fmt(earned)} earned · ${fmt(shift.perHour)}/hr`);
}
function tickShift() {
  const start=parseInt(localStorage.getItem('pb_shift')||0); if(!start) return;
  const el=Date.now()-start;
  const h=Math.floor(el/3600000),m=Math.floor((el%3600000)/60000),s=Math.floor((el%60000)/1000);
  const pad=n=>String(n).padStart(2,'0');
  document.getElementById('shiftDisp').textContent=`${pad(h)}:${pad(m)}:${pad(s)}`;
  const startE=parseFloat(localStorage.getItem('pb_shift_e')||0);
  const earned=Math.max(0,todayEarnings()-startE), hrs=el/3600000;
  document.getElementById('shiftStatLine').textContent=`${h}h ${m}m · ${fmt(earned)} earned · ${fmt(hrs>.05?earned/hrs:0)}/hr`;
}
function saveManualShift() {
  const date=document.getElementById('sDate').value||_todayStr;
  const start=document.getElementById('sStart').value;
  const end=document.getElementById('sEnd').value;
  const earned=parseFloat(document.getElementById('sEarned').value)||0;
  const notes=document.getElementById('sNotes').value.trim();
  if(!start||!end) return alert('Please set start and end time');
  const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  const hours=Math.max(0,((eh*60+em)-(sh*60+sm))/60);
  const shift={id:Date.now()+'',date,start,end,hours:Math.round(hours*10)/10,earned,perHour:hours>0?Math.round(earned/hours*100)/100:0,notes};
  S.shifts.unshift(shift);if(S.shifts.length>50)S.shifts.pop();
  req('/api/shifts',{method:'POST',body:shift});saveLocal();closeModal('editShiftMod');
  ['sDate','sStart','sEnd','sEarned','sNotes'].forEach(id=>document.getElementById(id).value='');
  renderEarnings();
}
function restoreShift() {
  if(!localStorage.getItem('pb_shift')) return;
  const btn=document.getElementById('shiftBtn');
  if(btn){btn.textContent='🛑 End Shift';btn.style.background='var(--red)';}
  document.getElementById('shiftStatLine').style.display='block';
  _shiftInterval=setInterval(tickShift,1000);tickShift();
}
