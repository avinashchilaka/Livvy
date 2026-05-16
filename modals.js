function openModal(id) {
  document.getElementById(id).classList.add('open');
  if(id==='targetBreakMod') populateTargetBreak();
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.ov').forEach(el=>{
  el.addEventListener('click',e=>{ if(e.target===el) el.classList.remove('open'); });
});
