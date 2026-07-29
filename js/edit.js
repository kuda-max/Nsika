import { state } from './state.js';
import { $ } from './utils.js';
import { supabase } from './supabase.js';
import { showToast } from './ui.js';
import { load } from "./storage.js";
import { renderHome, renderMy, renderProfile } from "./render.js";
import { showLoader, hideLoader } from "./utils.js";
import { renderEditImages } from "./image-manager.js";

// Helper to return the currently authenticated user object.
async function getUser(){
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
    showToast("Business yanu yasinthidwa!");
}

// Delete the listing currently loaded into the edit form.
export async function deleteListing(){
    showLoader("Business yanu yikuchotsedwa...");
    const id = document.querySelector('#edit-id').value;

    const v = state.vendors.find(x => x.id === id);

    if(!v) return;


    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();


    if(userError || !user || v.ownerId !== user.id){
        hideLoader();
        showToast("Businessyi singatheke kuchosedwa.");
        return;
    }

    if(!confirm("Business yanu ichotsedwe? mukatero sizitheka kuibwezeletsa.")){
        hideLoader();
        return;
    }

    try {
        // 1. Load image records belonging to this business.
        const { data: images, error: imageFetchError } = await supabase
            .from("business_images")
            .select("image_url")
            .eq("business_id", id);

        if(imageFetchError) throw imageFetchError;

        // 2. Remove each image file from Supabase storage.
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

        // 3. Delete image rows from the database.
        const { error: imageDeleteError } = await supabase
            .from("business_images")
            .delete()
            .eq("business_id", id);

        if(imageDeleteError) throw imageDeleteError;

        // 4. Delete the business record itself.
        const { error: businessDeleteError } = await supabase
            .from("businesses")
            .delete()
            .eq("id", id);

        if(businessDeleteError) throw businessDeleteError;

        state.vendors = state.vendors.filter(x => x.id !== id);
        closeEdit();
        hideLoader();
        showToast("Business yanu yachotsedwa.");

        if(state.currentScreen === 'profile'){
            if(window.go) window.go('my');
        } else {
            if(window.renderMy) window.renderMy();
        }
    } catch(err){
        hideLoader();
        console.error("Business yanu yakanika kuchotsedwa chifukwa: ", err);
        showToast("Business yanu yakanika kuchotsedwa.");
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

