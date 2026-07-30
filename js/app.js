import { load } from './storage.js';
import { supabase } from "./supabase.js";
import { renderCategories, renderHome } from './render.js';
import * as forms from './forms.js';
import { state } from './state.js';
import { closeEdit } from './edit.js';
import { closeProfileEdit } from './settings.js';
import {$} from './utils.js';
import {syncChipIndicator,attachShakeValidation, initStickySearchShadow, makeSheetDraggable, initPullToRefresh} from './animations.js';

// Application initialization routine.
// Loads data, prepares the signup category select, renders initial screens,
// and checks whether a Supabase user session already exists.

function uiStuff(){
    makeSheetDraggable($('#edit-sheet'), $('#edit-overlay'), closeEdit);
    makeSheetDraggable($('#profile-sheet'), $('#profile-overlay'), closeProfileEdit);

        window.addEventListener("offline", ()=>{
    showOffline();
});

window.addEventListener("online", ()=>{

    hideOffline();
});
document.querySelectorAll('.chip-row').forEach(row => syncChipIndicator(row));
document.querySelectorAll('form.form').forEach(form => attachShakeValidation(form));
initStickySearchShadow();
initPullToRefresh($('#screen-home'), async () => {
    await load();
    renderHome();
});
}


export async function init(){
    await load();

    // Populate the signup category dropdown once data is loaded.
    forms.populateSelect('signup-category');

    // Render the initial category grid and home vendor list.
    renderCategories();
    renderHome();
    

    // Verify current authentication state with Supabase.
    const { data, error } = await supabase.auth.getUser();

    if(error || !data.user){
        state.user = null;
        await supabase.auth.signOut();
    } else {
        state.user = data.user;
    }
    uiStuff();
}


