import { state } from './state.js';
import { uid, makePlaceholder, $ } from './utils.js';
import { save } from './storage.js';
import { showToast } from './ui.js';
import { load } from "./storage.js";
import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";

export function populateSelect(elId, selected=''){
	const sel = document.getElementById(elId);
	sel.innerHTML = '<option value="">Pick a category</option>' + state.cats.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${c.name}</option>`).join('');
}

export async function handlePhoto(input, idx){

    if(!input.files?.length) return;

    const file = input.files[0];

    const compressed = await imageCompression(file,{
        maxSizeMB:0.3,
        maxWidthOrHeight:1280,
        useWebWorker:true,
        initialQuality:0.8
    });

    const slot = input.parentElement;

    let img = slot.querySelector("img");

    if(!img){

        img = document.createElement("img");
        slot.appendChild(img);

    }

    img.src = URL.createObjectURL(compressed);

    slot.classList.add("has-img");

    const icon = slot.querySelector("i");

    if(icon) icon.style.display = "none";

    state.signupPhotos[idx] = compressed;

}

export async function submitVendor(event) {
    event.preventDefault();
     showLoader("Submitting your business...");
    const form = event.target;

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        hideLoader();
        showToast("You must be logged in to submit a business.");
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

    // Create the business
    const { data, error } = await supabase
        .from("businesses")
        .insert(business)
        .select()
        .single();

    if (error) {
        console.error("Business creation error:", error);
        hideLoader()
        showToast("Error creating business: " + error.message);
        return;
    }

    try {

        // Upload photos to Storage
        const photoUrls = await uploadBusinessPhotos(data.id);

        // Save photo URLs to the database
        if (photoUrls.length > 0) {

            const imageRows = photoUrls.map(url => ({
                business_id: data.id,
                image_url: url
            }));

            const { error: imageError } = await supabase
                .from("business_images")
                .insert(imageRows);

            if (imageError) {
                console.error("Image DB error:", imageError);
                showToast("Business created, but images couldn't be linked.");
                return;
            }

        }
        hideLoader();
        showToast("Your business is now live!");

    } catch (err) {

        console.error("Photo upload error:", err);
        showToast("Business created, but photo upload failed.");

    }

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
    showToast("Error creating account: " + error.message);
    return;
  }



  showToast("Account created. Now add your business details.");

  // move to listing form
  window.go('add');
}

export async function loginVendor(event){

    event.preventDefault();

    const form = event.target;

    const email = form.email.value.trim();
    const password = form.password.value;

    const { data, error } = await supabase.auth.signInWithPassword({

        email,
        password

    });

    if(error){

        showToast("Error signing in: " + error.message);
        return;

    }



const check = await supabase.auth.getSession();

    showToast("Welcome back!");

    await load();

    window.go("my");

}

export async function openAddListing() {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast("You must be logged in to add a business.");
        window.go("login");
        return;
    }

    window.go("add");
}

export async function uploadBusinessPhotos(businessId) {
    const photoUrls = [];
    for (let i = 0; i < state.signupPhotos.length; i++) {
        const file = state.signupPhotos[i];
        if (!file) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `${businessId}/${filename}`;
        const { error } = await supabase.storage
            .from("business-images")
            .upload(path, file);
        if (error) {
            console.error("Photo upload error:", error);
            throw error;
        }
        const { data } = supabase.storage
            .from("business-images")
            .getPublicUrl(path);
        photoUrls.push(data.publicUrl);
    }
    return photoUrls;
}