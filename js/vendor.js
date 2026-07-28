import { supabase } from "./supabase.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";

// Open the current user's existing business profile if they own one.
// Otherwise, navigate to the add-business form.
export async function openMyBusiness() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        showToast("Mukuyenera kukhala logged in kuti muwone mndandanda wanu.");
        window.go("login");
        return;
    }

    const mine = state.vendors.find(v => v.ownerId === user.id);

    if (mine) {
        showToast("mndandanda muli nawo kale");
        state.currentProfileId = mine.id;
        window.renderProfile(mine.id);
        window.go("profile");
    } else {
        window.go("add");
    }
}