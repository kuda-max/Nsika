import { state } from './state.js';
import { uid, makePlaceholder, $,showLoader, hideLoader } from './utils.js';
import { save } from './storage.js';
import { showToast } from './ui.js';
import { load } from "./storage.js";
import { logout ,clearDeletedAccount} from "./auth.js";
import { shakeField, shakeSubmit, animateCardIn} from './animations.js';
import {loginUser, registerUser, deleteAuthUser, getCurrentUser  } from "./services/authService.js";
import {getMyBusiness,createBusiness,createBusinessImages,deleteBusiness} from "./services/businessService.js";
import { uploadBusinessPhotos,deleteBusinessImages} from "./services/storageService.js";

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
    const user = await getCurrentUser();

    if (!user) {
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

    let data;

    try {

        data = await createBusiness(business);

    } catch (error) {

        console.error("Business creation error:", error);

        hideLoader();

        showToast(
            "Business yanu yakanika kuyikidwa chifukwa: " +
            error.message
        );

        return;
    }

    try {
        const photoUrls = await uploadBusinessPhotos(data.id, state.signupPhotos);
        let imageRows = [];

        if (photoUrls.length > 0) {
            imageRows = photoUrls.map(url => ({
                business_id: data.id,
                image_url: url,
                is_cover: photoUrls.indexOf(url) === 0
            }));

            try {
             await createBusinessImages(imageRows);
            } catch (error) {
                console.error("Image DB error:", error);
                showToast(
                    "Business yapangidwa,koma zithunzi zanu sizinaikidwe."
                );
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

    const { data, error } = await registerUser(
    email,
    password,
    full_name
    );

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


    const { error } = await loginUser(
    email,
    password
    );


    if(error){

        showToast("Takanika kukupangani sign-in chifukwa: " + error.message);

        shakeField(form.email);
        shakeField(form.password);

        return;
    }


    await load();


    if(!state.user){

        console.error("Login successful but user state was not loaded");

        showToast("Login failed. Please try again.");

        return;
    }


    showToast("Takulandilani!");

    window.go("my");

}

//remove vendor account and all associated data
export async function deleteVendor(){

    const confirmed = await showConfirmModal({
        title: "Delete Account?",
        message: "Your account, vendor profile, listings and saved information will be permanently deleted. This action cannot be undone.",
        icon: "trash-2",
        danger: true,
        confirmText: "Delete"
    });

    if(!confirmed) return;

    try{

        const business = await getMyBusiness();

        if(business){

            await deleteBusinessImages(business.id);
            console.log(" Business images deleted");

            await deleteBusiness(business.id);
            console.log(" Business deleted");

        }

        await deleteAuthUser();
        console.log(" Business account deleted");

        await clearDeletedAccount();

    }catch(err){
        console.error(err);
    }
}
// Mock only for now
export function confirmDeleteMock(){
  closeModal();

  // Replace with your toast component later
  console.log('Delete vendor confirmed (mock)');
}

// Ensure the user is logged in before showing the add business screen.
export async function openAddListing() {
    const user = await getCurrentUser();

if (!user) {
    showToast("Mukuyenera kupanga login kuti muyike business yanu.");
    window.go("login");
    return;
}

window.go("add");
}
