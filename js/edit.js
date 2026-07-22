import { state } from './state.js';
import { $ } from './utils.js';
import { save } from './storage.js';
import { showToast } from './ui.js';

export function openEdit(id){
	const v = state.vendors.find(x=>x.id===id);
	if(!v || v.ownerId !== localStorage.getItem('nsika_owner_id')) return;
	$('#edit-id').value = v.id;
	$('#edit-name').value = v.name;
	$('#edit-phone').value = v.phone;
	$('#edit-whatsapp').value = v.whatsapp || '';
	const sel = document.getElementById('edit-category');
	sel.innerHTML = '<option value="">Pick a category</option>' + state.cats.map(c=>`<option value="${c.id}" ${v.category===c.id?'selected':''}>${c.name}</option>`).join('');
	$('#edit-town').value = v.town;
	$('#edit-description').value = v.description;
	$('#edit-overlay').classList.add('open');
	$('#edit-sheet').classList.add('open');
}

export function closeEdit(){
	$('#edit-overlay').classList.remove('open');
	$('#edit-sheet').classList.remove('open');
}

export function saveEdit(e){
	e.preventDefault();
	const d = Object.fromEntries(new FormData(e.target).entries());
	const v = state.vendors.find(x=>x.id===d.id);
	if(!v || v.ownerId !== localStorage.getItem('nsika_owner_id')){ closeEdit(); return; }
	v.name=d.name.trim(); v.phone=d.phone.trim(); v.whatsapp=d.whatsapp.trim();
	v.category=d.category; v.town=d.town.trim(); v.area=d.town.trim(); v.description=d.description.trim();
	save(); closeEdit(); showToast('Listing updated');
	if(state.currentScreen==='my') {
		if(window.renderMy) window.renderMy();
		else if(window.go) window.go('my');
	}
	if(state.currentScreen==='profile') {
		if(window.renderProfile) window.renderProfile(v.id);
	}
}

export function deleteListing(){
	const id = document.querySelector('#edit-id').value;
	const v = state.vendors.find(x=>x.id===id);
	if(!v || v.ownerId !== localStorage.getItem('nsika_owner_id')) return;
	if(confirm('Delete this listing?')){ v.isActive=false; save(); closeEdit(); showToast('Listing deleted'); if(state.currentScreen==='profile'){ if(window.go) window.go('my'); } else { if(window.renderMy) window.renderMy(); } }
}

export function headerAction(){
	if(!state.currentProfileId) return;
	const v = state.vendors.find(x=>x.id===state.currentProfileId);
	if(!v || v.ownerId !== localStorage.getItem('nsika_owner_id')) return;
	openEdit(state.currentProfileId);
}

