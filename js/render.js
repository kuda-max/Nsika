import { state } from './state.js';
import { $, esc, makePlaceholder, timeAgo,isOwner } from './utils.js';

// Render a single category card used in the category grid.
// Clicking the card calls pickCategory with the category ID.
export function catCard(c){
	return `
	<div class="cat-card" onclick="pickCategory('${c.id}')">
		<div class="cat-icon">
			${c.icon || "📌"}
		</div>
		<span>${c.name}</span>
	</div>`;
}

// Render all category cards inside the category grid element.
export function renderCategories(){
	$('#cat-grid').innerHTML = state.cats.map(catCard).join('');
}

// Create a vendor card for home, explore, or my listings.
// If editable=true the card opens the edit flow, otherwise it opens the profile.
export function vCard(v, editable = false){
    const cat = {name: v.categoryName || 'Vendor'};
	const cover = v.images?.find(img => img.is_cover);

    const img =
        cover?.image_url ||
        v.photoUrls[0] ||
        makePlaceholder(v.name, 0);

    const wa = (v.whatsapp || v.phone).replace(/\D/g,'');
    const phone = v.phone.replace(/\D/g,'');

    return `
 <div class="v-card">
			<img class="v-thumb" src="${img}" alt="" ${editable ? `onclick="openEdit('${v.id}')"` : `onerror="this.src='${makePlaceholder(v.name,0)}'"  onclick="openProfile('${v.id}')"`}>
			<div class="v-info">
				<h3 ${editable ? `onclick="openEdit('${v.id}')"` : `onclick="openProfile('${v.id}')"`}>${esc(v.name)}</h3>
				<div class="badge">${esc(cat.name)}</div>
				<div class="v-meta"><i class="fa-solid fa-location-dot"></i> ${esc(v.town)}</div>
				${editable ? '' : `
				<div class="v-actions">
					<a class="btn btn-primary" href="tel:${v.phone}"><i class="fa-solid fa-phone"></i> Call</a>
					<a class="btn btn-outline" href="https://wa.me/${wa}" target="_blank"><i class="fa-brands fa-whatsapp"></i> Message</a>
				</div>`}
			</div>
		</div>`;
}

// Filter vendors by search query, town, and category.
// Returns active vendors sorted by newest first.
export function filteredVendors(q, town, cat) {
    q = (q || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

    const words = q.split(" ").filter(Boolean);

    return state.vendors
        .filter(v => v.isActive)
        .filter(v => {
            const searchable = [
                v.name,
                v.description,
                v.categoryName,
                v.phone,
                v.whatsapp,
                v.town,
                v.area
            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

            const matchTown =
                town === "All" ||
                `${v.town} ${v.area}`
                    .toLowerCase()
                    .includes(town.toLowerCase());

            const matchQ =
                words.length === 0 ||
                words.every(word => searchable.includes(word));

            const matchCat =
                !cat ||
                v.category === cat;

            return matchTown && matchQ && matchCat;
        })
        .sort((a, b) => b.createdAt - a.createdAt);
}

// Render the home screen vendor list using the home search input value.
export function renderHome(){
	const q = $('#home-search').value;
	const list = filteredVendors(q, state.selectedTown);
	$('#home-list').innerHTML = list.length
		? list.slice(0,8).map(v=>vCard(v)).join('')
		: `<div class="empty"><i class="fa-solid fa-magnifying-glass"></i><div>No vendors found. Be the first to list!</div></div>`;
}

// Render the explore screen vendor list and heading for the selected category.
export function renderExplore(){
	const q = $('#explore-search').value;
	const heading = state.activeExploreCat ? state.cats.find(c=>c.id===state.activeExploreCat)?.name + ' vendors' : 'All vendors';
	$('#explore-heading').textContent = heading;
	const list = filteredVendors(q, state.selectedTown, state.activeExploreCat);
	$('#explore-list').innerHTML = list.length
		? list.map(v=>vCard(v)).join('')
		: `<div class="empty"><i class="fa-solid fa-magnifying-glass"></i><div>No vendors match your search.</div></div>`;
}

// Open the profile screen for the given vendor ID.
export function openProfile(id){
	state.currentProfileId=id;
	if(window.go) window.go('profile');
}

// Render the profile screen content for a specific vendor.
export function renderProfile(id){
	const v = state.vendors.find(x=>x.id===id);
	if(!v){
		if(window.go) window.go('home');
		return;
	}

	const owner = isOwner(v);
	const editBtn = $('#header-edit');
	if(editBtn){
	    editBtn.style.display = owner ? '' : 'none';
	}

	const pauseBtn = $('#header-pause');
	if(pauseBtn){
	    pauseBtn.style.display = owner ? '' : 'none';
	    pauseBtn.innerHTML = v.isActive
	        ? '<i class="fa-solid fa-pause"></i>'
	        : '<i class="fa-solid fa-play"></i>';
	    pauseBtn.setAttribute('aria-label', v.isActive ? 'Pause listing' : 'Activate listing');
	}

	const cat = state.cats.find(c=>c.id===v.category) || {name:'Vendor'};
	const wa = (v.whatsapp||v.phone).replace(/\D/g,'');
	const photos = v.images?.length
	    ? [ ...(v.images.filter(i => i.is_cover).map(i => i.image_url)), ...(v.images.filter(i => !i.is_cover).map(i => i.image_url)) ]
	    : [makePlaceholder(v.name,0)];

	$('#profile-content').innerHTML = `
		<div class="profile-hero">
			<img class="profile-img" src="${photos[0]}" alt="">
			<div class="seller-card">
				<div class="profile-title">${esc(v.name)}</div>
				<div class="profile-sub">
					<span class="badge">${esc(cat.name)}</span>
					<span class="v-meta" style="color:var(--text-muted)"><i class="fa-solid fa-location-dot"></i> ${esc(v.address || v.town)}</span>
				</div>

				<div class="seller-top-row">
					<div class="profile-desc">${esc(v.description)}</div>
					<div class="profile-actions">
						<a class="btn btn-primary" href="tel:${v.phone}"><i class="fa-solid fa-phone"></i> Call</a>
						<a class="btn btn-outline" href="https://wa.me/${wa}" target="_blank"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
						${v.latitude && v.longitude ? `
<a class="btn btn-outline"
   target="_blank"
   href="https://www.google.com/maps?q=${v.latitude},${v.longitude}">
    <i class="fa-solid fa-location-arrow"></i>
    Directions
</a>
` : ""}
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

import { supabase } from './supabase.js';

// Render the current user's business listings in the "Shop Yanga" screen.
export async function renderMy(){
	const { data:{user} } = await supabase.auth.getUser();

	if(!user){
		$('#my-list').innerHTML = `
			<div class="empty">
				Chonde pangani login kuti muwone mndandanda wanu.
			</div>`;
		return;
	}

	const list = state.vendors
		.filter(v=>v.isActive && v.ownerId === user.id)
		.sort((a,b)=>b.createdAt - a.createdAt);

	$('#my-list').innerHTML = list.length
		? list.map(v=>vCard(v,true)).join('')
		: `<div class="empty">
			<i class="fa-solid fa-store"></i>
			<div>No listings yet. Add your first shop.</div>
		</div>`;
}
