import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { showToast } from "./ui.js";
import {loadProfile, isLoggedIn} from "./auth.js";
import { $, lockBodyScroll, unlockBodyScroll } from "./utils.js";
import { state } from "./state.js";
import { resetSheetStyles } from "./animations.js";

export async function settingsEligible(){
    const loggedIn = await isLoggedIn();
    const accountSettings = document.getElementById("account-settings");
    const guestCard = document.getElementById("guest-card");
    const logoutButton = document.getElementById("lb");

    if (accountSettings) {
        accountSettings.style.display = loggedIn ? "" : "none";
    }

    if (guestCard) {
        guestCard.style.display = loggedIn ? "none" : "";
    }

    if (logoutButton) {
        logoutButton.style.display = loggedIn ? "" : "none";
    }
}

export function closeProfileEdit(){

    $("#profile-overlay").classList.remove("open");
    $("#profile-sheet").classList.remove("open");
    unlockBodyScroll();
}

export async function saveProfile(event){
    event.preventDefault();

    showLoader("Saving profile...");

    try{

        const {
            data:{user}
        } = await supabase.auth.getUser();

        if(!user) return;

        const fullName =
            document.querySelector("#profile-name").value;

        const phone =
            document.querySelector("#profile-phone").value;

        const { error } = await supabase
            .from("profiles")
            .update({

                full_name: fullName,

                phone: phone

            })
            .eq("id", user.id);

        if(error) throw error;
        // Update cached profile
        state.profile.fullName = fullName;
        state.profile.phone = phone;
        closeProfileEdit();

        showToast("Profile updated!");
        await loadProfileHeader();

    }

    catch(err){

        console.error(err);

        showToast("Pepani,profile yanu siyina  sevedwe.");

    }

    hideLoader();
    unlockBodyScroll();
}

let guestIdentity = null;

function getGuestIdentity() {
    if (!guestIdentity) {
        const num = Math.floor(10000 + Math.random() * 90000);

        guestIdentity = {
            name: `Guest Nsika ${num}`,
            email: `guest.nsika${num}@gmhz.com`
        };
    }

    return guestIdentity;
}

export async function loadProfileHeader() {
    showLoader("Loading profile...");

    try {
        const profile = await loadProfile();

        const isGuest = !(profile?.email && profile?.fullName);

        const identity = isGuest
            ? getGuestIdentity()
            : {
                name: profile.fullName,
                email: profile.email
            };

        $("#settings-name").textContent = identity.name;
        $("#settings-email").textContent = identity.email;

        document.querySelector(".user-profile-header .btn").style.display =
            isGuest ? "none" : "";
    }
    finally {
        hideLoader();
    }
}

export async function openProfileEdit(){
    resetSheetStyles($('#edit-sheet'), $('#edit-overlay'));
    const profile = await loadProfile();

    if(!profile) return;
    $("#profile-sheet-icon").setAttribute("data-lucide", "user");
    $("#profile-sheet-title").textContent =
        "Personal Information";

    $("#profile-sheet-subtitle").textContent =
        "sinthani ma details a profile yanu.";

    $("#profile-sheet-body").innerHTML = `
<form class="form" onsubmit="saveProfile(event)">

    <div class="form-group">
        <label>Dzina</label>
        <input
            id="profile-name"
            type="text"
            required>
    </div>

    <div class="form-group">
        <label>Email</label>
        <input
            id="profile-email"
            type="email"
            readonly>
    </div>

    <div class="form-group">
        <label>Phone Number</label>
        <input
            id="profile-phone"
            type="tel">
    </div>

    <button
        class="btn btn-primary btn-full"
        type="submit">
        Sevani
    </button>

</form>
`;

    // Fill the inputs AFTER the HTML exists
    $("#profile-name").value = profile.fullName || "";
    $("#profile-phone").value = profile.phone || "";
    $("#profile-email").value = profile.email || "";

    $("#profile-overlay").classList.add("open");
    $("#profile-sheet").classList.add("open");
    lockBodyScroll();
}

export async function openPasswordEdit(){
    resetSheetStyles($('#edit-sheet'), $('#edit-overlay'));
    $("#profile-sheet-icon").setAttribute("data-lucide", "lock");
    $("#profile-sheet-title").textContent =
        "Chiteteo ndi Password";

    $("#profile-sheet-subtitle").textContent =
        "Lembani password yoti munthu wina asayidziwe.";

    $("#profile-sheet-body").innerHTML = `
<form class="form" onsubmit="changePassword(event)">

    <div class="form-group">
        <label>Password Yatsopano</label>
        <div class="password-input">

        <input
            type="password"
            id="new-password"
            minlength="6"
            required>

        <button
            type="button"
            class="password-toggle"
            onclick="togglePassword('new-password', this)">
            <i class="fa-regular fa-eye"></i>
        </button>

    </div>
    </div>

    <div class="form-group">
        <label>Ilembeni kachikena</label>
    <div class="password-input">

        <input
            type="password"
            id="confirm-password"
            minlength="6"
            required>

        <button
            type="button"
            class="password-toggle"
            onclick="togglePassword('confirm-password', this)">
            <i class="fa-regular fa-eye"></i>
        </button>

    </div>
    </div>

    <button
        class="btn btn-primary btn-full"
        type="submit">
        Sinthani
    </button>

</form>
`;

    $("#profile-overlay").classList.add("open");
    $("#profile-sheet").classList.add("open");
    lockBodyScroll();
}

export async function changePassword(event){

    event.preventDefault();

    const newPassword =
        $("#new-password").value.trim();

    const confirmPassword =
        $("#confirm-password").value.trim();

    if(newPassword.length < 6){

        showToast("Password yikuyenera kukhala ndi malemba 6 kapena kupyolera apo.");

        return;

    }

    if(newPassword !== confirmPassword){

        showToast("Ma password mwalembawa akusiyana.");

        return;

    }

    showLoader("password yan ikusinthidwa...");

    try{

        const { error } = await supabase.auth.updateUser({

            password: newPassword

        });

        if(error) throw error;

        closeProfileEdit();

        showToast("Password yanu yasinthidwa!");

    }

    catch(err){

        console.error(err);

        showToast(err.message);

    }

    finally{

        hideLoader();

    }
    unlockBodyScroll();
}

export function togglePassword(id, button){

    const input = document.getElementById(id);

    const icon = button.querySelector("i");

    if(input.type === "password"){

        input.type = "text";

        icon.className = "fa-regular fa-eye-slash";

    }else{

        input.type = "password";

        icon.className = "fa-regular fa-eye";

    }

}