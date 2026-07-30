import { state } from './state.js';
import { uid, makePlaceholder, $ } from './utils.js';
import { save } from './storage.js';
import { showToast } from './ui.js';
import { load } from "./storage.js";
import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { shakeField, shakeSubmit, animateCardIn} from './animations.js';

// Populate a category select element with options from the loaded category list.
// The selected parameter controls which category option should be pre-selected.
export function populateSelect(elId, selected=''){
	const sel = document.getElementById(elId);
	sel.innerHTML = '<option value="">Sankhani gulu lomwe business lanu ili </option>' + state.cats.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${c.name}</option>`).join('');
}

// Handle image selection on a signup photo input.
// Compresses the selected image, previews it in the form slot, and stores it in temporary state.
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

// Submit a new vendor listing. This function validates the current auth session,
// inserts the business into Supabase, uploads photos, and links uploaded images.
export async function submitVendor(event) {
    event.preventDefault();
    showLoader("business yanu ikulowetsedwa mmakina athu...");
    const form = event.target;

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        hideLoader();
        showToast("Mukuyenera kupanga login kuti muyike business yanu.");
        return;
    }

    const business = {
        owner_id: user.id,
        name: form.name.value,
        phone: form.phone.value,
        whatsapp: form.whatsapp.value || form.phone.value,
        category_id: form.category.value,
        description: form.description.value,
        latitude: state.location.lat,
        longitude: state.location.lng,
        address: state.location.address,
        town: state.location.town
    };

    const { data, error } = await supabase
        .from("businesses")
        .insert(business)
        .select()
        .single();

    if (error) {
        console.error("Business creation error:", error);
        hideLoader();
        showToast("Business yanu yakanika kuyikidwa chifukwa: " + error.message);
        return;
    }

    try {
        const photoUrls = await uploadBusinessPhotos(data.id);
        let imageRows = [];

        if (photoUrls.length > 0) {
            imageRows = photoUrls.map(url => ({
                business_id: data.id,
                image_url: url,
                is_cover: photoUrls.indexOf(url) === 0
            }));

            const { error: imageError } = await supabase
                .from("business_images")
                .insert(imageRows);

            if (imageError) {
                console.error("Image DB error:", imageError);
                showToast("Business yapangidwa,koma zithunzi zanu sizinaikidwe.");
            }
        }

        // Merge the new vendor into local state directly instead of a
        // full load() round-trip — makes it show up immediately.
        const newVendor = {
            id: String(data.id),
            ownerId: data.owner_id,
            name: data.name,
            phone: data.phone,
            whatsapp: data.whatsapp,
            category: data.category_id,
            categoryName: state.cats.find(c => c.id === data.category_id)?.name ?? "",
            address: data.address,
            town: data.town,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description,
            photoUrls: photoUrls,
            images: imageRows.map((row, i) => ({ image_url: row.image_url, is_cover: i === 0 })),
            createdAt: new Date(data.created_at).getTime(),
            isActive: data.is_active
        };

        state.vendors.unshift(newVendor);

        hideLoader();
        showToast("Business yanu ili live tsopano!");
        confetti({
            particleCount: 60,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#B8623F', '#ffffff'] // match--primary + neutral
        });
        state.location = { lat: null, lng: null, address: "", town: "" };
        go("home");

        // New vendor lands first (state.vendors is createdAt-desc sorted
        // and we unshifted) — animate just that card in.
        requestAnimationFrame(() => {
            const firstCard = document.querySelector('#home-list .v-card');
            if(firstCard && firstCard.dataset.id === newVendor.id) animateCardIn(firstCard);
        });
    } catch (err) {
        console.error("Photo upload error:", err);
        hideLoader(); // was missing in the original — loader would hang forever on this path
        showToast("Business yayikidwa, koma zithunzi zanu zakanika.");
    }
}
// Register a new vendor account with email/password and store the user's full name in metadata.
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

    const msg = error.message.toLowerCase();
    if(msg.includes('email') || msg.includes('registered')){
        shakeField(form.email);
    } else if(msg.includes('password')){
        shakeField(form.password);
    } else {
        shakeSubmit(form);
    }
    return;
  }

  showToast("Account yapangidwa, tsopano ikani ma details a business yanu.");
  window.go('add');
}

// Handle vendor login form submission.
// Signs in with Supabase and reloads app data after success.


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
        showToast("Takanika kukupangani sign-in chifukwa: " + error.message);
        shakeField(form.email);
        shakeField(form.password);
        return;
    }

    const check = await supabase.auth.getSession();
    showToast("Takulandilani!");
    await load();
    window.go("my");
}

// Ensure the user is logged in before showing the add business screen.
export async function openAddListing() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast("Mukuyenera kupanga login kuti muyike business yanu.");
      window.go("login");
      return;
    }

    window.go("add");
}

// Upload all selected signup photos for a business to Supabase storage.
// Returns an array of public URLs for the uploaded images.
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