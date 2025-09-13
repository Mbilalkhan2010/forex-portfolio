
// Simple static Forex portfolio app (no backend)
// Data persisted to localStorage under key 'forex_trades_v1'

const LS_KEY = 'forex_trades_v1';
let trades = [];

// Helpers
function saveAll(){
  localStorage.setItem(LS_KEY, JSON.stringify(trades));
  renderAll();
}
function loadAll(){
  const raw = localStorage.getItem(LS_KEY);
  trades = raw ? JSON.parse(raw) : [];
  renderAll();
}
function formatNumber(n){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

// Navigation
document.querySelectorAll('.sidebar nav a').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    document.querySelectorAll('.sidebar nav a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    showView(a.dataset.view);
  });
});

function showView(view){
  document.querySelectorAll('.view').forEach(v=> v.style.display='none');
  document.getElementById('view-'+view).style.display = '';
  window.scrollTo(0,0);
}

// Init UI buttons
document.getElementById('btnAddTrade').addEventListener('click', ()=> openModal());
document.getElementById('cancelTrade').addEventListener('click', ()=> closeModal());
document.getElementById('saveTrade').addEventListener('click', ()=> saveTrade());
document.getElementById('btnExport').addEventListener('click', ()=> exportCSV());
document.getElementById('btnImport').addEventListener('click', ()=> document.getElementById('csvFile').click());
document.getElementById('csvFile').addEventListener('change', handleCSVImport);
document.getElementById('clearFilter').addEventListener('click', ()=> {document.getElementById('searchTrades').value='';document.getElementById('filterSide').value=''; renderTradesTable();});
document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', ()=>{ if(confirm('Clear all data?')){ trades=[]; saveAll(); }});

// Modal controls
function openModal(){
  document.getElementById('modal').style.display='flex';
  // clear inputs
  ['t_date','t_pair','t_side','t_size','t_open','t_close','t_profit','t_note'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  document.getElementById('t_date').valueAsDate = new Date();
}
function closeModal(){ document.getElementById('modal').style.display='none'; }

function saveTrade(){
  const t = {
    id: Date.now(),
    date: document.getElementById('t_date').value,
    pair: document.getElementById('t_pair').value || '',
    side: document.getElementById('t_side').value || 'Buy',
    size: parseFloat(document.getElementById('t_size').value) || 0,
    open: parseFloat(document.getElementById('t_open').value) || 0,
    close: parseFloat(document.getElementById('t_close').value) || 0,
    profit: parseFloat(document.getElementById('t_profit').value) || 0,
    note: document.getElementById('t_note').value || ''
  };
  trades.push(t);
  saveAll();
  closeModal();
}

// Render functions
function renderAll(){
  renderSummary();
  renderTradesTable();
  renderPortfolio();
  updateCharts();
  applySettingsToUI();
}

function renderSummary(){
  const net = trades.reduce((s,t)=> s + (parseFloat(t.profit)||0), 0);
  const wins = trades.filter(t=> (parseFloat(t.profit)||0) > 0).length;
  const losses = trades.filter(t=> (parseFloat(t.profit)||0) < 0).length;
  document.getElementById('netPl').innerText = formatNumber(net);
  document.getElementById('plBreakdown').innerText = `Wins: ${wins} · Losses: ${losses}`;
  const openCount = trades.filter(t=> !t.closed).length;
  document.getElementById('openCount').innerText = openCount;
}

function renderTradesTable(){
  const tbody = document.querySelector('#tradesTable tbody');
  tbody.innerHTML = '';
  const search = document.getElementById('searchTrades').value.toLowerCase();
  const sideF = document.getElementById('filterSide').value;
  const list = trades.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
  list.forEach(t=>{
    if(search && !(t.pair.toLowerCase().includes(search) || (t.note||'').toLowerCase().includes(search))) return;
    if(sideF && t.side !== sideF) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.date}</td>
      <td>${t.pair}</td>
      <td>${t.side}</td>
      <td>${t.size}</td>
      <td>${t.open}</td>
      <td>${t.close}</td>
      <td>${formatNumber(t.profit)}</td>
      <td>${t.note || ''}</td>
      <td><button data-id="${t.id}" class="delBtn">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.delBtn').forEach(b=> b.addEventListener('click', e=>{
    const id = Number(e.currentTarget.dataset.id);
    if(confirm('Delete this trade?')){ trades = trades.filter(x=> x.id !== id); saveAll(); }
  }));
}

// Portfolio (simple aggregation by pair)
function renderPortfolio(){
  const map = {};
  trades.forEach(t=>{
    if(!map[t.pair]) map[t.pair] = {pair:t.pair, qty:0, pnl:0};
    map[t.pair].qty += t.size;
    map[t.pair].pnl += (parseFloat(t.profit)||0);
  });
  const arr = Object.values(map);
  const container = document.getElementById('portfolioList');
  container.innerHTML = '';
  if(arr.length===0){ container.innerHTML = '<div class="muted">No positions yet.</div>'; return; }
  arr.forEach(p=>{
    const div = document.createElement('div'); div.className='p-item';
    div.innerHTML = `<div>${p.pair}</div><div>Lots: ${p.qty} · P&L: ${formatNumber(p.pnl)}</div>`;
    container.appendChild(div);
  });
}

// Charts
let equityChart=null, allocChart=null;
function updateCharts(){
  const labels = trades.slice().sort((a,b)=> new Date(a.date) - new Date(b.date)).map(t=> t.date || '');
  const cum = [];
  let s = 0;
  trades.slice().sort((a,b)=> new Date(a.date) - new Date(b.date)).forEach(t=>{ s += (parseFloat(t.profit)||0); cum.push(s); });
  // equity chart
  const eqCtx = document.getElementById('equityChart').getContext('2d');
  if(equityChart) equityChart.destroy();
  equityChart = new Chart(eqCtx, { type:'line', data:{ labels, datasets:[{label:'Cumulative P&L', data:cum, fill:true, tension:0.3}]}, options:{responsive:true, plugins:{legend:{display:false}}}});
  // allocation pie
  const map = {};
  trades.forEach(t=>{ map[t.pair] = (map[t.pair]||0) + (parseFloat(t.profit)||0); });
  const pairs = Object.keys(map);
  const vals = pairs.map(p=> map[p]);
  const allocCtx = document.getElementById('allocChart').getContext('2d');
  if(allocChart) allocChart.destroy();
  allocChart = new Chart(allocCtx, { type:'pie', data:{ labels:pairs, datasets:[{data:vals}]}, options:{responsive:true} });
}

// CSV export/import
function exportCSV(){
  if(trades.length===0){ alert('No trades to export'); return; }
  const header = ['date','pair','side','size','open','close','profit','note'];
  const rows = trades.map(t=> header.map(h=> JSON.stringify(t[h]||'')).join(','));
  const csv = [header.join(',')].concat(rows).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'trades.csv'; a.click(); URL.revokeObjectURL(url);
}

function handleCSVImport(e){
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    const text = ev.target.result;
    parseCSVText(text).forEach(r=>{
      trades.push({ id: Date.now() + Math.random(), date: r.date, pair: r.pair, side: r.side, size: parseFloat(r.size)||0, open: parseFloat(r.open)||0, close: parseFloat(r.close)||0, profit: parseFloat(r.profit)||0, note: r.note||'' });
    });
    saveAll();
  };
  reader.readAsText(f);
  e.target.value = '';
}

function parseCSVText(text){
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,''));
  const out = [];
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(',').map(c=> c.replace(/^"|"$/g,''));
    const obj = {};
    headers.forEach((h,idx)=> obj[h]= cols[idx] || '');
    out.push(obj);
  }
  return out;
}

// Settings (local storage)
function saveSettings(){
  const name = document.getElementById('ownerInput').value || 'You';
  const title = document.getElementById('titleInput').value || 'Forex Portfolio Dashboard';
  const sc = document.getElementById('sidebarColor').value;
  const bg = document.getElementById('bgColor').value;
  localStorage.setItem('fp_owner', name);
  localStorage.setItem('fp_title', title);
  localStorage.setItem('fp_sidebar', sc);
  localStorage.setItem('fp_bg', bg);
  applySettingsToUI();
  alert('Settings saved');
}
function applySettingsToUI(){
  const name = localStorage.getItem('fp_owner') || document.getElementById('ownerName').innerText;
  const title = localStorage.getItem('fp_title') || document.getElementById('dashboardTitle').innerText;
  const sc = localStorage.getItem('fp_sidebar') || getComputedStyle(document.documentElement).getPropertyValue('--sidebar') || '#1f2937';
  const bg = localStorage.getItem('fp_bg') || getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#f4f4f4';
  document.getElementById('ownerName').innerText = name;
  document.getElementById('dashboardTitle').innerText = title;
  document.getElementById('siteName').innerText = name + ' Portfolio';
  document.getElementById('sidebar').style.background = sc;
  document.body.style.background = bg;
  // fill inputs
  document.getElementById('ownerInput').value = name;
  document.getElementById('titleInput').value = title;
  document.getElementById('sidebarColor').value = sc;
  document.getElementById('bgColor').value = bg;
}

// Init
document.getElementById('year').innerText = new Date().getFullYear();
loadAll();
showView('dashboard');
