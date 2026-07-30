// Simple DOM query helper: selects the first matching element for the given CSS selector.
export const $ = s => document.querySelector(s);

// Escapes text so it can safely be injected into HTML without risk of markup injection.
export const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };

// Generates a short unique identifier using a random value and current timestamp.
export const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);

import { state } from './state.js';

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

// motion.js

export function animateCards() {
    const cards = document.querySelectorAll(".v-card", ".cat-card");
    cards.forEach((card, i) => {
        card.animate(
            [
                {
                    opacity: 0,
                    transform: "translateY(12px)"
                },
                {
                    opacity: 1,
                    transform: "translateY(0)"
                }
            ],
            {
                duration: 250,
                delay: i * 30,
                easing: "ease-out",
                fill: "both"
            }
        );
    });
}

export function animateSettings(){
    const items = document.querySelectorAll(".settings-item");
    items.forEach((item, index)=>{
        item.animate(
            [
                {
                    opacity:0,
                    transform:"translateY(10px)"
                },

                {
                    opacity:1,
                    transform:"translateY(0)"
                }

            ],

            {
                duration:250,
                delay:index*30,
                easing:"ease-out",
                fill:"both"
            }
        );
    });
}