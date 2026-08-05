import { load } from './storage.js';
import { supabase } from "./supabase.js";
import { renderCategories, renderHome } from './render.js';
import * as forms from './forms.js';
import { state } from './state.js';
import { closeEdit } from './edit.js';
import { closeProfileEdit } from './settings.js';
import {$} from './utils.js';
import {syncChipIndicator,attachShakeValidation, initStickySearchShadow, makeSheetDraggable } from './animations.js';
import { requestUserLocation } from './map.js';
import {initTopbarSearch} from './search.js';
import { go } from './navigation.js';

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
initTopbarSearch();
}

function dteststuff(){
    
function distanceKm(lat1, lng1, lat2, lng2){
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Sanity check the math itself first, no geolocation involved —
// Blantyre CBD to Zomba is a known real-world distance (~60km by road,
// so straight-line should read a bit less, ~55-58km).
console.log('Blantyre -> Zomba (sanity check):',
    distanceKm(-15.7861, 35.0058, -15.3833, 35.3333).toFixed(1), 'km');

// Now test the actual geolocation call + sort behavior against your
// real state.vendors, without rendering anything.
console.log('Requesting location...');
navigator.geolocation.getCurrentPosition(
    position => {
        const { latitude: lat, longitude: lng } = position.coords;
        console.log('Got location:', lat, lng);

        const withCoords = state.vendors.filter(v => v.latitude != null && v.longitude != null);
        const withoutCoords = state.vendors.filter(v => v.latitude == null || v.longitude == null);

        console.log(`${withCoords.length} vendors have coords, ${withoutCoords.length} don't.`);
        if(withoutCoords.length){
            console.log('Missing coords:', withoutCoords.map(v => v.name));
        }

        const sorted = withCoords
            .map(v => ({
                name: v.name,
                town: v.town,
                km: distanceKm(lat, lng, v.latitude, v.longitude)
            }))
            .sort((a, b) => a.km - b.km);

        console.table(sorted.map(v => ({ name: v.name, town: v.town, km: v.km.toFixed(2) })));
    },
    err => {
        console.log('Location denied/failed:', err.message, '(code', err.code, ')');
        console.log('This is the fallback path — Home would stay newest-first.');
    },
    { timeout: 8000, maximumAge: 5 * 60 * 1000 }
);
console.log('Vendor count right now:', state.vendors.length);
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
    requestUserLocation();
    go('home');
}


