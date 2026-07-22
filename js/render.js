import { state } from './state.js';
import { $, esc, makePlaceholder, timeAgo } from './utils.js';

export function catCard(c){
	return `<div class="cat-card" onclick="pickCategory('${c.id}')">
		<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg>
		<span>${c.name}</span>
	</div>`;
}

export function renderCategories(){ $('#cat-grid').innerHTML = state.cats.map(catCard).join(''); }

export function vCard(v, editable=false){
	const cat = state.cats.find(c=>c.id===v.category) || {name:'Vendor'};
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

export function filteredVendors(q, town, cat){
 q = (q||'').toLowerCase();
	return state.vendors.filter(v=>v.isActive).filter(v=>{
		const matchTown = town==='All' || (v.town+' '+v.area).toLowerCase().includes(town.toLowerCase());
		const matchQ = !q || (v.name+' '+v.description+' '+v.category).toLowerCase().includes(q);
		const matchCat = !cat || v.category===cat;
		return matchTown && matchQ && matchCat;
	}).sort((a,b)=>b.createdAt - a.createdAt);
}

export function renderHome(){
	const q = $('#home-search').value;
	const list = filteredVendors(q, state.selectedTown);
	$('#home-list').innerHTML = list.length ? list.slice(0,8).map(v=>vCard(v)).join('')
		: `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><div>No vendors found. Be the first to list!</div></div>`;
}

export function renderExplore(){
	const q = $('#explore-search').value;
	const heading = state.activeExploreCat ? state.cats.find(c=>c.id===state.activeExploreCat)?.name + ' vendors' : 'All vendors';
	$('#explore-heading').textContent = heading;
	const list = filteredVendors(q, state.selectedTown, state.activeExploreCat);
	$('#explore-list').innerHTML = list.length
		? list.map(v=>vCard(v)).join('')
		: `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><div>No vendors match your search.</div></div>`;
}

export function openProfile(id){ state.currentProfileId=id; if(window.go) window.go('profile'); }

export function renderProfile(id){
	const v = state.vendors.find(x=>x.id===id);
	if(!v){ if(window.go) window.go('home'); return; }
	const cat = state.cats.find(c=>c.id===v.category) || {name:'Vendor'};
	const wa = (v.whatsapp||v.phone).replace(/\D/g,'');
	const photos = v.photoUrls.length ? v.photoUrls : [makePlaceholder(v.name,0)];
	$('#profile-content').innerHTML = `
		<div class="profile-hero">
			<img class="profile-img" src="${photos[0]}" alt="">
			<div class="seller-card">
				<div class="profile-title">${esc(v.name)}</div>
				<div class="profile-sub">
					<span class="badge">${esc(cat.name)}</span>
					<span class="v-meta" style="color:var(--text-muted)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22S4 16 4 10a8 8 0 1 1 16 0c0 6-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(v.town)}</span>
				</div>

				<div class="seller-top-row">
					<div class="profile-desc">${esc(v.description)}</div>
					<div class="profile-actions">
						<a class="btn btn-primary" href="tel:${v.phone}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.86 19.86 0 0 1-8.63-3.07 19.52 19.52 0 0 1-6-6A19.86 19.86 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.5 2.1l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.9.7 2.9.8a2 2 0 0 1 1.7 2z"/></svg> Call</a>
						<a class="btn btn-outline" href="https://wa.me/${wa}" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l2.5-5.9A8.38 8.38 0 0 1 4.5 11 8.5 8.5 0 0 1 13 2.5a8.48 8.48 0 0 1 8 8z"/></svg> WhatsApp</a>
					</div>
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
		</div>
	`;
}

export function renderMy(){
	const list = state.vendors.filter(v=>v.isActive && v.ownerId === localStorage.getItem('nsika_owner_id')).sort((a,b)=>b.createdAt - a.createdAt);
	$('#my-list').innerHTML = list.length
		? list.map(v=>vCard(v,true)).join('')
		: `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V10l7-4 7 4v11"/></svg><div>No listings yet. Add your first shop.</div></div>`;
}
