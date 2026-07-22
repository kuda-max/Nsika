export const $ = s => document.querySelector(s);
export const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };
export const uid = () => Math.random().toString(36).slice(2)+Date.now().toString(36);
import { state } from './state.js';

export function getOwnerId(){
	let id = localStorage.getItem('nsika_owner_id');
	if(!id){ id = uid(); localStorage.setItem('nsika_owner_id', id); }
	return id;
}

export function timeAgo(ts){
	const s = Math.floor((Date.now()-ts)/1000);
	if(s<60) return 'just now'; const m=Math.floor(s/60);
	if(m<60) return `${m}m ago`; const h=Math.floor(m/60);
	if(h<24) return `${h}h ago`; const d=Math.floor(h/24);
	if(d<30) return `${d}d ago`; const mo=Math.floor(d/30);
	if(mo<12) return `${mo}mo ago`; return `${Math.floor(d/365)}y ago`;
}

const mutedPalette = ['#C4A882','#A3B39C','#A8A0B0','#C5B9A9','#B0A89E','#D1CCC5'];
export function makePlaceholder(name, idx){
	const c = mutedPalette[idx % mutedPalette.length];
	const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${c}"/><text x="100" y="108" font-family="sans-serif" font-weight="700" font-size="80" fill="#fff" text-anchor="middle">${(name||'?').charAt(0)}</text></svg>`
	)}`;
	return svg;
}

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




export function isOwner(v){

    return !!(
        state.user &&
        v &&
        state.user.id === v.ownerId
    );

}