import { state } from './state.js';
import { mapVendorRow, makePlaceholder } from './utils.js';

export async function load(){
	try {
		const cached = JSON.parse(localStorage.getItem(state.LS_KEY));
		if (cached && cached.length) { state.vendors = cached; return; }
	} catch(e){ }
	try {
		const res = await fetch('mock-data.json');
		if(!res.ok) throw new Error('mock-data.json fetch failed: ' + res.status);
		const rows = await res.json();
		state.vendors = rows.map(mapVendorRow);
	} catch(e){
		console.warn('Could not load mock-data.json, falling back to built-in dataset.', e);
		state.vendors = fallbackSeed();
	}
	save();
}

export function save(){ localStorage.setItem(state.LS_KEY, JSON.stringify(state.vendors)); }

function fallbackSeed(){
	const data = [
		{name:"Grace's Tailoring", phone:"+265991234567", whatsapp:"+265991234567", category:"tailoring", town:"Area 25, Lilongwe", area:"Area 25", desc:"Custom chitenje outfits, alterations, and school uniforms. Quick turnaround."},
		{name:"Baba Garage", phone:"+265881112233", whatsapp:"+265881112233", category:"mechanics", town:"Blantyre CBD", area:"Blantyre CBD", desc:"Toyota & Nissan specialist. Engine diagnostics, brake pads, suspension."},
		{name:"Auntie Flora's Kitchen", phone:"+265992223344", whatsapp:"+265992223344", category:"food", town:"Zomba", area:"Zomba", desc:"Daily lunch plates: nsima with chicken, beef, or beans. Catering available."}
	];
	return data.map((d,i)=>({
		id: Math.random().toString(36).slice(2)+Date.now().toString(36), name: d.name, phone: d.phone, whatsapp: d.whatsapp || d.phone,
		category: d.category, town: d.town, area: d.area, description: d.desc,
		photoUrls: [makePlaceholder(d.name, i)],
		createdAt: Date.now() - (i+1)*8e8, isActive: true
	}));
}

