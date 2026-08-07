import { state } from './state.js';
import { supabase } from './supabase.js'

// Simple DOM query helper: selects the first matching element for the given CSS selector.
export const $ = s => document.querySelector(s);

// Escapes text so it can safely be injected into HTML without risk of markup injection.
export const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };

// Generates a short unique identifier using a random value and current timestamp.
export const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);



// Returns a stable owner identifier kept in localStorage.
// If the ID does not exist yet, a new one is generated and stored.
export function getOwnerId(){
	let id = localStorage.getItem('nsika_owner_id');
	if(!id){
		id = uid();
		localStorage.setItem('nsika_owner_id', id);
	}
	return id;
}

// Converts a timestamp into a readable relative time string like "2h ago".
export function timeAgo(ts){
	const s = Math.floor((Date.now()-ts)/1000);
	if(s<60) return 'just now';
	const m = Math.floor(s/60);
	if(m<60) return `${m}m ago`;
	const h = Math.floor(m/60);
	if(h<24) return `${h}h ago`;
	const d = Math.floor(h/24);
	if(d<30) return `${d}d ago`;
	const mo = Math.floor(d/30);
	if(mo<12) return `${mo}mo ago`;
	return `${Math.floor(d/365)}y ago`;
}

// Color palette used to create placeholder images when a vendor has no photo.
const mutedPalette = ['#C4A882','#A3B39C','#A8A0B0','#C5B9A9','#B0A89E','#D1CCC5'];

// Builds a simple SVG placeholder image encoded as a data URI.
// Uses the first character of the vendor name and a color tile background.
export function makePlaceholder(name, idx){
	const c = mutedPalette[idx % mutedPalette.length];
	const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${c}"/><text x="100" y="108" font-family="sans-serif" font-weight="700" font-size="80" fill="#fff" text-anchor="middle">${(name||'?').charAt(0)}</text></svg>`
	)}`;
	return svg;
}

// Normalize a raw vendor row from the database into the app's vendor object shape.
// This function also provides defaults for missing values and generates fallback IDs.
export function mapVendorRow(row){
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
		ownerId: row.owner_id || null
	};
}

// Returns true when the current authenticated user matches the vendor owner.
export function isOwner(v){
    return !!(
        state.user &&
        v &&
        state.user.id === v.ownerId
    );
}

// Display a global loader overlay and set optional status text.
export function showLoader(message="dikilani pang'ono..."){
    const loader = document.getElementById("global-loader");
    const text = document.getElementById("loader-text");
    if(!loader) return;
    text.textContent = message;
    loader.style.display = "flex";
}

// Hide the global loader overlay.
export function hideLoader(){
    const loader = document.getElementById("global-loader");
    if(!loader) return;
    loader.style.display = "none";
}


export function showOffline(){

    $("#offline-screen").classList.remove("hidden");

}
export function hideOffline(){

    $("#offline-screen").classList.add("hidden");

}

export function refreshIcons(){
    lucide.createIcons();
}

export function handleNavWidth(){

    const nav = document.querySelector(".bottom-nav");
    if(!nav) return;

    const opening = !nav.classList.contains("expanded");

    nav.classList.toggle("expanded");

    const icon = document.querySelector("#nav-toggle svg");

    if(icon){

        // Phase 1: shrink the current icon out.
        const shrink = icon.animate(
            [
                { transform: "scale(1) rotate(0deg)", opacity: 1 },
                { transform: "scale(0.6) rotate(-45deg)", opacity: 0 }
            ],
            {
                duration: 140,
                easing: "ease-in",
                fill: "forwards"
            }
        );

        shrink.finished.then(() => {

            icon.setAttribute(
                "data-lucide",
                opening ? "arrow-left" : "arrow-right"
            );

            refreshIcons();

            // Phase 2: grow the freshly-swapped icon back in. Query
            // again — refreshIcons() replaced the DOM node, so `icon`
            // is now stale and animating it further would do nothing.
            const newIcon = document.querySelector("#nav-toggle svg");
            if(newIcon){
                newIcon.animate(
                    [
                        { transform: "scale(0.6) rotate(45deg)", opacity: 0 },
                        { transform: "scale(1) rotate(0deg)", opacity: 1 }
                    ],
                    {
                        duration: 180,
                        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                        fill: "forwards"
                    }
                );
            }
        });
    }

}

// Locks/unlocks background scrolling while a sheet is open. Uses a
// counter, not a boolean, so if two sheets could ever be triggered in
// quick succession, closing one doesn't prematurely unlock scroll
// while another is still meant to be open.
let openSheetCount = 0;

export function lockBodyScroll(){
    openSheetCount++;
    if(openSheetCount === 1){
        const activeScreen = document.querySelector('.screen.active');
        if(activeScreen) activeScreen.style.overflow = 'hidden';
    }
}

export function unlockBodyScroll(){
    openSheetCount = Math.max(0, openSheetCount - 1);
    if(openSheetCount === 0){
        const activeScreen = document.querySelector('.screen.active');
        if(activeScreen) activeScreen.style.overflow = '';
    }
}

// Returns the currently logged-in user's business.
export async function getMyBusiness(){

    if(!state.user){
        console.warn("No logged-in user");
        return null;
    }

    const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", state.user.id)
        .maybeSingle();

    if(error) throw error;

    return data;
}
export async function deleteProfile(){

    const { error, count } = await supabase
        .from("profiles")
        .delete({ count: "exact" })
        .eq("id", state.user.id);

    if(error) throw error;

    if(count !== 1){
        throw new Error("Profile was not deleted.");
    }

}

