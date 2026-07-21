/* ===== Data ===== */
const LS_KEY = 'nsika_v2_vendors';
const cats = [
  {id:'tailoring', name:'Tailoring', icon:'<path d="M9 6a3 3 0 0 1 6 0h2a1 1 0 0 1 1 1v1H5V7a1 1 0 0 1 1-1h2z"/><rect x="6" y="9" width="12" height="12" rx="1"/>'},
  {id:'mechanics', name:'Mechanics', icon:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.9 4.9l2.8 2.8m9.4 9.4l2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m9.4-9.4l2.8-2.8"/>'},
  {id:'food', name:'Food', icon:'<path d="M2 12h20v1a10 10 0 0 1-20 0v-1z"/>'},
  {id:'salons', name:'Salons', icon:'<circle cx="12" cy="8" r="4"/><path d="M6 22v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4"/>'},
  {id:'repairs', name:'Repairs', icon:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>'},
  {id:'shops', name:'General Shops', icon:'<path d="M2 21h20M4 21V10l8-5 8 5v11"/>'}
];

let vendors = [];
let currentScreen = 'home';
let prevScreen = 'home';
let selectedTown = 'All';
let currentProfileId = null;
let signupPhotos = [null,null,null];

/* ===== Helpers ===== */
const $ = s => document.querySelector(s);
const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };
const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);

// Anonymous per-device "owner" id. There's no real auth yet (that
// comes with the Supabase backend later), so ownership of a listing
// is tracked as: "was this listing created on this device/browser?"
// This is what gates edit/delete access — mock/seed data has no
// owner_id, so it's never editable, which is intentional.
function getOwnerId(){
  let id = localStorage.getItem('nsika_owner_id');
  if(!id){ id = uid(); localStorage.setItem('nsika_owner_id', id); }
  return id;
}
function timeAgo(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return 'just now'; const m=Math.floor(s/60);
  if(m<60) return `${m}m ago`; const h=Math.floor(m/60);
  if(h<24) return `${h}h ago`; const d=Math.floor(h/24);
  if(d<30) return `${d}d ago`; const mo=Math.floor(d/30);
  if(mo<12) return `${mo}mo ago`; return `${Math.floor(d/365)}y ago`;
}

/* ===== Theme ===== */
function effectiveTheme(){
  const attr = document.documentElement.getAttribute('data-theme');
  if(attr) return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(t){
  if(t==='dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.setAttribute('data-theme','light');
  localStorage.setItem('nsika_theme', t);
  $('#icon-moon').style.display = t==='dark' ? 'none':'block';
  $('#icon-sun').style.display = t==='dark' ? 'block':'none';
}
function toggleTheme(){
  applyTheme(effectiveTheme()==='dark' ? 'light':'dark');
}
const savedTheme = localStorage.getItem('nsika_theme');
if(savedTheme) applyTheme(savedTheme);
else applyTheme(effectiveTheme());

/* ===== Mock / Seed Data =====
   mock-data.json is shaped like a real Supabase "vendors" table row
   (snake_case fields, ISO timestamps) so that swapping this fetch()
   for a real supabaseClient.from('vendors').select() call later is a
   near drop-in change instead of a rewrite. mapVendorRow() below is
   the one place that translates between "what the DB gives us" and
   "what the render functions expect" — keep that mapping here even
   after the real backend is wired up. */
const mutedPalette = ['#C4A882','#A3B39C','#A8A0B0','#C5B9A9','#B0A89E','#D1CCC5'];
function makePlaceholder(name, idx){
  const c = mutedPalette[idx % mutedPalette.length];
  const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${c}"/><text x="100" y="108" font-family="sans-serif" font-weight="700" font-size="80" fill="#fff" text-anchor="middle">${(name||'?').charAt(0)}</text></svg>`
  )}`;
  return svg;
}

// Converts one row from mock-data.json (or, later, a Supabase response)
// into the internal shape the render functions use.
function mapVendorRow(row){
  return {
    id: row.id || uid(),
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp || row.phone,
    category: row.category,
    town: row.town,
    area: row.area,
    description: row.description,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
    isActive: row.is_active !== false,
    ownerId: row.owner_id || null // mock/demo data has no owner -> never editable
  };
}

// Small built-in fallback used only if mock-data.json can't be fetched
// (e.g. the page was opened directly as a file:// URL, where fetch()
// of local files is blocked by the browser). Run a local server
// (e.g. `python3 -m http.server`) to load the full mock-data.json set.
function fallbackSeed(){
  const data = [
    {name:"Grace's Tailoring", phone:"+265991234567", whatsapp:"+265991234567", category:"tailoring", town:"Area 25, Lilongwe", area:"Area 25", desc:"Custom chitenje outfits, alterations, and school uniforms. Quick turnaround."},
    {name:"Baba Garage", phone:"+265881112233", whatsapp:"+265881112233", category:"mechanics", town:"Blantyre CBD", area:"Blantyre CBD", desc:"Toyota & Nissan specialist. Engine diagnostics, brake pads, suspension."},
    {name:"Auntie Flora's Kitchen", phone:"+265992223344", whatsapp:"+265992223344", category:"food", town:"Zomba", area:"Zomba", desc:"Daily lunch plates: nsima with chicken, beef, or beans. Catering available."}
  ];
  return data.map((d,i)=>({
    id: uid(), name: d.name, phone: d.phone, whatsapp: d.whatsapp || d.phone,
    category: d.category, town: d.town, area: d.area, description: d.desc,
    photoUrls: [makePlaceholder(d.name, i)],
    createdAt: Date.now() - (i+1)*8e8, isActive: true
  }));
}

async function load(){
  // 1. Prefer whatever's cached in localStorage (so edits/new listings
  //    made during testing persist across page reloads).
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY));
    if (cached && cached.length) { vendors = cached; return; }
  } catch(e){ /* ignore bad cache, fall through to fetch */ }

  // 2. No cache yet — load the mock dataset, mapped to internal shape.
  try {
    const res = await fetch('mock-data.json');
    if(!res.ok) throw new Error('mock-data.json fetch failed: ' + res.status);
    const rows = await res.json();
    vendors = rows.map(mapVendorRow);
  } catch(e){
    console.warn('Could not load mock-data.json (are you running this from a local server?). Falling back to a small built-in dataset.', e);
    vendors = fallbackSeed();
  }
  save();
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(vendors)); }

/* ===== Routing ===== */
const screens = { home:'home', explore:'explore', profile:'profile', add:'add', my:'my' };
function go(name){
  if(name==='profile' && !currentProfileId) return;
  Object.values(screens).forEach(s=> $('#screen-'+s).classList.remove('active'));
  $('#screen-'+name).classList.add('active');
  prevScreen = currentScreen; currentScreen = name;

  // nav
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(['home','explore','add','my'].includes(name)) $('#nav-'+name).classList.add('active');

  // header
  const backBtn = $('#header-back');
  const editBtn = $('#header-edit');
  const title = $('#header-title');
  backBtn.style.display = (name==='profile') ? 'inline-flex' : 'none';
  if(name==='profile'){
    const v = vendors.find(x=>x.id===currentProfileId);
    const isOwner = !!v && v.ownerId === getOwnerId();
    editBtn.style.display = isOwner ? 'inline-flex' : 'none';
  } else {
    editBtn.style.display = 'none';
  }
  title.textContent = {add:'Join Nsika', my:'My Shop', profile:'Vendor', explore:'Explore'}[name] || 'Nsika';

  if(name==='home') renderHome();
  if(name==='explore') renderExplore();
  if(name==='my') renderMy();
  if(name==='profile') renderProfile(currentProfileId);
}
function back(){ if(currentScreen==='profile') go(prevScreen || 'home'); else go('home'); }

/* ===== Rendering ===== */
function catCard(c){
  return `<div class="cat-card" onclick="pickCategory('${c.id}')">
    <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg>
    <span>${c.name}</span>
  </div>`;
}
function renderCategories(){ $('#cat-grid').innerHTML = cats.map(catCard).join(''); }

function vCard(v, editable=false){
  const cat = cats.find(c=>c.id===v.category) || {name:'Vendor'};
  const img = v.photoUrls[0] || makePlaceholder(v.name, 0);
  const wa = (v.whatsapp||v.phone).replace(/\D/g,'');
  const phone = v.phone.replace(/\D/g,'');
  return `
 <div class="v-card">
      <img class="v-thumb" src="${img}" alt="" ${editable ? `onclick="openEdit('${v.id}')"` : `onclick="openProfile('${v.id}')"`}>
      <div class="v-info">
        <h3 ${editable ? `onclick="openEdit('${v.id}')"` : `onclick="openProfile('${v.id}')"`}>${esc(v.name)}</h3>
        <div class="badge">${esc(cat.name)}</div>
        <div class="v-meta"><svg viewBox="0 0 24 24"><path d="M12 22S4 16 4 10a8 8 0 1 1 16 0c0 6-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(v.town)}</div>
        ${editable ? '' : `
        <div class="v-actions">
          <a class="btn btn-primary" href="tel:${v.phone}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.86 19.86 0 0 1-8.63-3.07 19.52 19.52 0 0 1-6-6A19.86 19.86 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.5 2.1l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.9.7 2.9.8a2 2 0 0 1 1.7 2z"/></svg> Call</a>
          <a class="btn btn-outline" href="https://wa.me/${wa}" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l2.5-5.9A8.38 8.38 0 0 1 4.5 11 8.5 8.5 0 0 1 13 2.5a8.48 8.48 0 0 1 8 8z"/></svg> Message</a>
        </div>`}
      </div>
    </div>`;
}

function filteredVendors(q, town, cat){
 q = (q||'').toLowerCase();
  return vendors.filter(v=>v.isActive).filter(v=>{
    const matchTown = town==='All' || (v.town+' '+v.area).toLowerCase().includes(town.toLowerCase());
    const matchQ = !q || (v.name+' '+v.description+' '+v.category).toLowerCase().includes(q);
    const matchCat = !cat || v.category===cat;
    return matchTown && matchQ && matchCat;
  }).sort((a,b)=>b.createdAt - a.createdAt);
}

function renderHome(){
  const q = $('#home-search').value;
  const list = filteredVendors(q, selectedTown);
  $('#home-list').innerHTML = list.length ? list.slice(0,8).map(v=>vCard(v)).join('')
    : `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><div>No vendors found. Be the first to list!</div></div>`;
}

let activeExploreCat = null;

// Tapping a category card takes you to Explore filtered by that category.
function pickCategory(id){ activeExploreCat=id; go('explore'); }

// Tapping "Explore" in the bottom nav resets to showing all vendors.
function openExploreAll(){ activeExploreCat = null; go('explore'); }

function renderExplore(){
  const q = $('#explore-search').value;
  const heading = activeExploreCat ? cats.find(c=>c.id===activeExploreCat)?.name + ' vendors' : 'All vendors';
  $('#explore-heading').textContent = heading;
  const list = filteredVendors(q, selectedTown, activeExploreCat);
  // NOTE: activeExploreCat is intentionally NOT cleared here anymore.
  // Clearing it on every render caused the category filter to silently
  // drop as soon as the user typed in the search box or the town chip
  // changed. It now only clears via openExploreAll() (nav bar tap).
  $('#explore-list').innerHTML = list.length
    ? list.map(v=>vCard(v)).join('')
    : `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><div>No vendors match your search.</div></div>`;
}

function openProfile(id){ currentProfileId=id; go('profile'); }

function renderProfile(id){
  const v = vendors.find(x=>x.id===id);
  if(!v){ go('home'); return; }
  const cat = cats.find(c=>c.id===v.category) || {name:'Vendor'};
  const wa = (v.whatsapp||v.phone).replace(/\D/g,'');
  const photos = v.photoUrls.length ? v.photoUrls : [makePlaceholder(v.name,0)];
  $('#profile-content').innerHTML = `
    <div class="profile-hero">
      <img class="profile-img" src="${photos[0]}" alt="">
      <div class="profile-title">${esc(v.name)}</div>
      <div class="profile-sub">
        <span class="badge">${esc(cat.name)}</span>
        <span class="v-meta" style="color:var(--text-muted)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22S4 16 4 10a8 8 0 1 1 16 0c0 6-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(v.town)}</span>
      </div>
      <div class="profile-desc">${esc(v.description)}</div>
      <div class="profile-actions">
        <a class="btn btn-primary" href="tel:${v.phone}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.86 19.86 0 0 1-8.63-3.07 19.52 19.52 0 0 1-6-6A19.86 19.86 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.5 2.1l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.9.7 2.9.8a2 2 0 0 1 1.7 2z"/></svg> Call</a>
        <a class="btn btn-outline" href="https://wa.me/${wa}" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l2.5-5.9A8.38 8.38 0 0 1 4.5 11 8.5 8.5 0 0 1 13 2.5a8.48 8.48 0 0 1 8 8z"/></svg> WhatsApp</a>
      </div>
      ${photos.length>1 ? `
 <div class="detail-block">
          <h4>Photos</h4>
 <div class="photo-scroll">${photos.slice(1).map(u=>`<img src="${u}" alt="">`).join('')}</div>
        </div>
      ` : ''}
 <div class="detail-block">
        <h4>Details</h4>
        <p>Phone: ${esc(v.phone)}</p>
        <p>Category: ${esc(cat.name)}</p>
        <p style="margin-top:8px; color:var(--text-muted); font-size:13px;">Listed ${timeAgo(v.createdAt)}</p>
      </div>
    </div>
  `;
}

function renderMy(){
  const list = vendors.filter(v=>v.isActive && v.ownerId === getOwnerId()).sort((a,b)=>b.createdAt - a.createdAt);
  $('#my-list').innerHTML = list.length
    ? list.map(v=>vCard(v,true)).join('')
    : `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V10l7-4 7 4v11"/></svg><div>No listings yet. Add your first shop.</div></div>`;
}

/* ===== Search & Filters ===== */
function onSearch(){ renderHome(); renderExplore(); }
function setTown(el, town){
  selectedTown = town;
  const rows = document.querySelectorAll('.chip-row');
  rows.forEach(row=>{
    row.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    const match = Array.from(row.children).find(c=>c.textContent.trim()===(town==='All'?'All Areas':town));
    if(match) match.classList.add('active');
  });
  renderHome(); renderExplore();
}

/* ===== Forms / Photos ===== */
function populateSelect(elId, selected=''){
  // NOTE: elId is passed as a bare id ("signup-category"), not a CSS
  // selector, so this uses getElementById rather than the $() helper
  // (which is document.querySelector and needs a "#" prefix). Using
  // $() here silently returned null and crashed on .innerHTML.
  const sel = document.getElementById(elId);
  sel.innerHTML = '<option value="">Pick a category</option>' + cats.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${c.name}</option>`).join('');
}
populateSelect('signup-category');

function handlePhoto(input, idx){
  if(!input.files || !input.files[0]) return;
  const slot = input.parentElement;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'), x = c.getContext('2d');
      const w = 400, h = Math.round(img.height * (w/img.width));
      c.width = w; c.height = h;
      x.drawImage(img,0, 0, w, h);
      const url = c.toDataURL('image/jpeg', 0.75);
      let im = slot.querySelector('img');
      if(!im){ im = document.createElement('img'); slot.appendChild(im); }
      im.src = url; slot.classList.add('has-img'); slot.querySelector('svg').style.display='none';
      signupPhotos[idx] = url;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}
function submitVendor(e){
  e.preventDefault();
  const f = e.target;
  const d = Object.fromEntries(new FormData(f).entries());
  const v = {
    id: uid(), name: d.name.trim(), phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim() || d.phone.trim(),
    category: d.category, town: d.town.trim(), area: d.town.trim(),
    description: d.description.trim(),
    photoUrls: signupPhotos.filter(Boolean),
    createdAt: Date.now(), isActive: true,
    ownerId: getOwnerId()
  };
  vendors.unshift(v); save();
  showToast('Listing created');
  f.reset(); signupPhotos=[null,null,null];
  document.querySelectorAll('.photo-slot').forEach(s=>{
    s.classList.remove('has-img'); const im=s.querySelector('img');
    if(im) im.remove(); s.querySelector('svg').style.display='block';
  });
  go('my');
}

/* ===== Edit ===== */
function openEdit(id){
  const v = vendors.find(x=>x.id===id);
  if(!v || v.ownerId !== getOwnerId()) return; // not yours — refuse silently
  $('#edit-id').value = v.id;
  $('#edit-name').value = v.name;
  $('#edit-phone').value = v.phone;
  $('#edit-whatsapp').value = v.whatsapp || '';
  populateSelect('edit-category', v.category);
  $('#edit-town').value = v.town;
  $('#edit-description').value = v.description;
  $('#edit-overlay').classList.add('open');
  $('#edit-sheet').classList.add('open');
}
function closeEdit(){
  $('#edit-overlay').classList.remove('open');
  $('#edit-sheet').classList.remove('open');
}
function saveEdit(e){
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const v = vendors.find(x=>x.id===d.id);
  if(!v || v.ownerId !== getOwnerId()){ closeEdit(); return; } // not yours — refuse silently
  v.name=d.name.trim(); v.phone=d.phone.trim(); v.whatsapp=d.whatsapp.trim();
  v.category=d.category; v.town=d.town.trim(); v.area=d.town.trim(); v.description=d.description.trim();
  save(); closeEdit(); showToast('Listing updated');
  if(currentScreen==='my') renderMy();
  if(currentScreen==='profile') renderProfile(v.id);
}
function deleteListing(){
  const id = $('#edit-id').value;
  const v = vendors.find(x=>x.id===id);
  if(!v || v.ownerId !== getOwnerId()) return; // not yours — refuse silently
  if(confirm('Delete this listing?')){ v.isActive=false; save(); closeEdit(); showToast('Listing deleted'); if(currentScreen==='profile') go('my'); else renderMy(); }
}
function headerAction(){
  if(!currentProfileId) return;
  const v = vendors.find(x=>x.id===currentProfileId);
  if(!v || v.ownerId !== getOwnerId()) return; // not yours — refuse silently
  openEdit(currentProfileId);
}

/* ===== Utilities ===== */
function showToast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ===== Boot ===== */
async function init(){
  await load();
  renderCategories();
  renderHome();
}
init();