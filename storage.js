function saveLocal() {
  localStorage.setItem('pb_state',JSON.stringify({earnings:S.earnings,expenses:S.expenses,bills:S.bills,onetime:S.onetime,debts:S.debts,splitwise:S.splitwise,accounts:S.accounts,rules:S.rules,budgets:S.budgets,settings:S.settings,shifts:S.shifts}));
}
function loadLocal() { try{const d=JSON.parse(localStorage.getItem('pb_state')||'{}');Object.assign(S,d);}catch{} }
function loadRules()  { try{const r=localStorage.getItem('pb_rules');if(r)Object.assign(S.rules,JSON.parse(r));}catch{} }
function logout() { localStorage.removeItem('pb_token');localStorage.removeItem('pb_user');window.location.href='/'; }
