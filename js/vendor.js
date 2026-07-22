import { supabase } from "./supabase.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";

export async function openMyBusiness() {

    // 1. Are they logged in?
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        showToast("You must be logged in to add your business.");
        window.go("login");
        return;
    }

    // 2. Do they already own a business?
    const mine = state.vendors.find(v => v.ownerId === user.id);

    if (mine) {
        showToast("You already have a business listed. Redirecting to your profile.");
        state.currentProfileId = mine.id;

        window.renderProfile(mine.id);

        window.go("profile");

    } else {

        window.go("add");

    }

}