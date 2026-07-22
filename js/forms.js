import { state } from './state.js';
import { uid, makePlaceholder, $ } from './utils.js';
import { save } from './storage.js';
import { showToast } from './ui.js';
import { supabase } from "./supabase.js";

export function populateSelect(elId, selected=''){
	const sel = document.getElementById(elId);
	sel.innerHTML = '<option value="">Pick a category</option>' + state.cats.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${c.name}</option>`).join('');
}

export function handlePhoto(input, idx){
	if(!input.files || !input.files[0]) return;
	const slot = input.parentElement;
	const reader = new FileReader();
	reader.onload = e => {
		const img = new Image();
		img.onload = () => {
			const c = document.createElement('canvas'), x = c.getContext('2d');
			const w = 400, h = Math.round(img.height * (w/img.width));
			c.width = w; c.height = h;
			x.drawImage(img,0, 0, w, h);
			const url = c.toDataURL('image/jpeg', 0.75);
			let im = slot.querySelector('img');
			if(!im){ im = document.createElement('img'); slot.appendChild(im); }
			im.src = url; slot.classList.add('has-img'); slot.querySelector('svg').style.display='none';
			state.signupPhotos[idx] = url;
		};
		img.src = e.target.result;
	};
	reader.readAsDataURL(input.files[0]);
}

export function submitVendor(e){
	e.preventDefault();
	const f = e.target;
	const d = Object.fromEntries(new FormData(f).entries());
	const v = {
		id: uid(), name: d.name.trim(), phone: d.phone.trim(),
		whatsapp: d.whatsapp.trim() || d.phone.trim(),
		category: d.category, town: d.town.trim(), area: d.town.trim(),
		description: d.description.trim(),
		photoUrls: state.signupPhotos.filter(Boolean),
		createdAt: Date.now(), isActive: true,
		ownerId: localStorage.getItem('nsika_owner_id') || uid()
	};
	state.vendors.unshift(v); save();
	showToast('Listing created');
	f.reset(); state.signupPhotos=[null,null,null];
	document.querySelectorAll('.photo-slot').forEach(s=>{
		s.classList.remove('has-img'); const im=s.querySelector('img');
		if(im) im.remove(); s.querySelector('svg').style.display='block';
	});
	if(window.go) window.go('my');
}

export async function registerVendor(event) {
  event.preventDefault();

  const form = event.target;

  const full_name = form.full_name.value;
  const email = form.email.value;
  const password = form.password.value;


  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name
      }
    }
  });


  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }


  console.log("Account created:", data);

  alert("Account created. Now add your business details.");

  // move to listing form
  window.go('add');
}