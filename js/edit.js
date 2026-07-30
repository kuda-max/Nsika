import { state } from './state.js';
import { $, refreshIcons } from './utils.js';
import { supabase } from './supabase.js';
import { showToast } from './ui.js';
import { load } from "./storage.js";
import { renderHome, renderMy, renderProfile } from "./render.js";
import { showLoader, hideLoader } from "./utils.js";
import { renderEditImages } from "./image-manager.js";
import { requireInternet } from './network.js';
import { pulseCard, animateCardOut, markCardSyncing, clearCardSyncing, resetSheetStyles } from './animations.js';

// Helper to return the currently authenticated user object.
export async function getUser(){
    
	const { data:{user} } = await supabase.auth.getUser();
	return user;
}

// Open the edit form for a vendor listing, pre-filling fields with current values.
export async function openEdit(id){
    const { data:{user} } = await supabase.auth.getUser();
    if(!user) return;


    const v = state.vendors.find(x=>x.id===id);

    if(!v) return;


    if(v.ownerId !== user.id){
        console.warn("Unauthorized edit attempt");
        window.close()
        return;
    }
    resetSheetStyles($('#edit-sheet'), $('#edit-overlay'));

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


    renderEditImages(v);
    $('#edit-overlay').classList.add('open');
    $('#edit-sheet').classList.add('open');
}

// Close the edit overlay and sheet to hide the edit UI.
export function closeEdit(){
	$('#edit-overlay').classList.remove('open');
	$('#edit-sheet').classList.remove('open');
}

// Persist edits for a business listing, validating ownership first.
export async function saveEdit(event) {
    event.preventDefault();
    const form = event.target;
    const { data:{user} } = await supabase.auth.getUser();

    if(!user) {
        showToast("Chonde pangani kaye login.");
        return;
    }

    const id = form.id.value;
    const idx = state.vendors.findIndex(x => x.id === id);
    if(idx === -1) return;

    const backup = { ...state.vendors[idx] };

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

    state.vendors[idx] = {
        ...state.vendors[idx],
        name: updates.name,
        phone: updates.phone,
        whatsapp: updates.whatsapp,
        category: updates.category_id,
        categoryName: state.cats.find(c => c.id === updates.category_id)?.name ?? state.vendors[idx].categoryName,
        town: updates.town,
        area: updates.area,
        description: updates.description
    };

    closeEdit();
    renderMy();
    if(state.currentScreen === 'home') renderHome();
    if(state.currentScreen === 'explore') renderExplore();
    if(state.currentScreen === 'profile') renderProfile(id);

    requestAnimationFrame(() => {
        document.querySelectorAll(`.v-card[data-id="${id}"]`).forEach(pulseCard);
        markCardSyncing(id);
    });

    const { error } = await supabase
        .from("businesses")
        .update(updates)
        .eq("id", id)
        .eq("owner_id", user.id);

    clearCardSyncing(id);

    if(error){
        console.error(error);
        state.vendors[idx] = backup;
        renderMy();
        if(state.currentScreen === 'home') renderHome();
        if(state.currentScreen === 'explore') renderExplore();
        if(state.currentScreen === 'profile') renderProfile(id);
        showToast("Zosintha sizinathe kusungidwa: " + error.message);
        return;
    }

    showToast("Business yanu yasinthidwa!");
}
// Delete the listing currently loaded into the edit form.
export async function deleteListing(){
    const id = document.querySelector('#edit-id').value;
    const v = state.vendors.find(x => x.id === id);
    if(!v) return;

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if(userError || !user || v.ownerId !== user.id){
        showToast("Business yi singatheke kuchosedwa.");
        return;
    }

    if(!confirm("Business yanu ichotsedwe? mukatero sizitheka kuibwezeletsa.")){
        return;
    }

    // Animate the card out everywhere it currently appears, then remove
    // from state and re-render — no blocking loader needed, the removal
    // itself is the feedback.
    const cardEls = document.querySelectorAll(`.v-card[data-id="${id}"]`);
    await Promise.all(Array.from(cardEls).map(el => animateCardOut(el)));

    const backup = state.vendors;
    state.vendors = state.vendors.filter(x => x.id !== id);
    closeEdit();

    renderMy();
    if(state.currentScreen === 'home') renderHome();
    if(state.currentScreen === 'explore') renderExplore();
    if(state.currentScreen === 'profile') go('my');

    try {
        const { data: images, error: imageFetchError } = await supabase
            .from("business_images")
            .select("image_url")
            .eq("business_id", id);
        if(imageFetchError) throw imageFetchError;

        if(images && images.length){
            const filePaths = images.map(img => {
                const url = new URL(img.image_url);
                return url.pathname.split("/business-images/")[1];
            });
            const { error: storageError } = await supabase.storage
                .from("business-images")
                .remove(filePaths);
            if(storageError) throw storageError;
        }

        const { error: imageDeleteError } = await supabase
            .from("business_images")
            .delete()
            .eq("business_id", id);
        if(imageDeleteError) throw imageDeleteError;

        const { error: businessDeleteError } = await supabase
            .from("businesses")
            .delete()
            .eq("id", id);
        if(businessDeleteError) throw businessDeleteError;

        showToast("Business yanu yachotsedwa.");
    } catch(err){
        console.error("Business yanu yakanika kuchotsedwa chifukwa: ", err);
        // Roll back — the card comes back.
        state.vendors = backup;
        renderMy();
        if(state.currentScreen === 'home') renderHome();
        if(state.currentScreen === 'explore') renderExplore();
        showToast("Business yanu yakanika kuchotsedwa. Tayesaninso.");
    }
}

// Handle the header edit action when viewing a vendor profile.
// Only opens editing if the current user owns the displayed profile.
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

