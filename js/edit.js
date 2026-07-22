import { state } from './state.js';
import { $ } from './utils.js';
import { supabase } from './supabase.js';
import { showToast } from './ui.js';
import { load } from "./storage.js";
import { renderHome, renderMy, renderProfile } from "./render.js";

async function getUser(){
	const { data:{user} } = await supabase.auth.getUser();
	return user;
}

export async function openEdit(id){

    const { data:{user} } = await supabase.auth.getUser();

    if(!user) return;


    const v = state.vendors.find(x=>x.id===id);

    if(!v) return;


    if(v.ownerId !== user.id){
        console.warn("Unauthorized edit attempt");
        return;
    }


    $('#edit-id').value = v.id;
    $('#edit-name').value = v.name || '';
    $('#edit-phone').value = v.phone || '';
    $('#edit-whatsapp').value = v.whatsapp || '';
    $('#edit-town').value = v.town || '';
    $('#edit-description').value = v.description || '';


    $('#edit-category').innerHTML =
        '<option value="">Pick a category</option>' +
        state.cats.map(c =>
            `<option value="${c.id}" ${v.category===c.id?'selected':''}>
                ${c.name}
            </option>`
        ).join('');


    $('#edit-overlay').classList.add('open');
    $('#edit-sheet').classList.add('open');
}

export function closeEdit(){
	$('#edit-overlay').classList.remove('open');
	$('#edit-sheet').classList.remove('open');
}

export async function saveEdit(event) {

    event.preventDefault();

    const form = event.target;

    const id = form.id.value;

    const { data: { user } } = await supabase.auth.getUser();


    const updates = {

        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        whatsapp: form.whatsapp.value.trim(),
        category_id: form.category.value,
        town: form.town.value.trim(),
        area: form.area.value.trim(),
        description: form.description.value.trim(),

        updated_at: new Date()

    };


    const { error } = await supabase
        .from("businesses")
        .update(updates)
        .eq("id", id)
        .eq("owner_id", user.id);


    if(error){

        console.error(error);
        showToast(error.message);
        return;

    }


    await load();

    renderHome();
    renderMy();
    renderProfile(id);

    closeEdit();

    showToast("Business updated!");

}

export function deleteListing(){
	const id = document.querySelector('#edit-id').value;
	const v = state.vendors.find(x=>x.id===id);
	if(!v || v.ownerId !== localStorage.getItem('nsika_owner_id')) return;
	if(confirm('Delete this listing?')){ v.isActive=false; save(); closeEdit(); showToast('Listing deleted'); if(state.currentScreen==='profile'){ if(window.go) window.go('my'); } else { if(window.renderMy) window.renderMy(); } }
}
export async function headerAction(){

    if(!state.currentProfileId) return;


    const { data:{user} } = await supabase.auth.getUser();

    if(!user) return;


    const v = state.vendors.find(
        x => x.id === state.currentProfileId
    );


    if(!v || v.ownerId !== user.id) return;


    openEdit(state.currentProfileId);
}
