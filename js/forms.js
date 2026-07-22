import { state } from './state.js';
import { uid, makePlaceholder, $ } from './utils.js';
import { save } from './storage.js';
import { showToast } from './ui.js';
import { supabase } from "./supabase.js";

export function populateSelect(elId, selected=''){
	const sel = document.getElementById(elId);
	sel.innerHTML = '<option value="">Pick a category</option>' + state.cats.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${c.name}</option>`).join('');
}

// export function handlePhoto(input, idx){
// 	if(!input.files || !input.files[0]) return;
// 	const slot = input.parentElement;
// 	const reader = new FileReader();
// 	reader.onload = e => {
// 		const img = new Image();
// 		img.onload = () => {
// 			const c = document.createElement('canvas'), x = c.getContext('2d');
// 			const w = 400, h = Math.round(img.height * (w/img.width));
// 			c.width = w; c.height = h;
// 			x.drawImage(img,0, 0, w, h);
// 			const url = c.toDataURL('image/jpeg', 0.75);
// 			let im = slot.querySelector('img');
// 			if(!im){ im = document.createElement('img'); slot.appendChild(im); }
// 			im.src = url; slot.classList.add('has-img'); slot.querySelector('svg').style.display='none';
// 			state.signupPhotos[idx] = url;
// 		};
// 		img.src = e.target.result;
// 	};
// 	reader.readAsDataURL(input.files[0]);
// }

export async function submitVendor(event) {
  event.preventDefault();

  const form = event.target;

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();


  if (userError || !user) {
    alert("You must be logged in first");
    return;
  }


  const business = {
    owner_id: user.id,
    name: form.name.value,
    phone: form.phone.value,
    whatsapp: form.whatsapp.value || form.phone.value,
    category_id: form.category.value,
    town: form.town.value,
    description: form.description.value
  };


  const { data, error } = await supabase
    .from("businesses")
    .insert(business)
    .select()
    .single();


  if (error) {
    console.error("Business creation error:", error);
    alert(error.message);
    return;
  }


  console.log("Business created:", data);

  alert("Your business is now live!");
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