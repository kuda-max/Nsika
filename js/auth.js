import { supabase } from "./supabase.js";
import { load } from "./storage.js";
import { renderHome, renderMy } from "./render.js";
import { showToast } from "./ui.js";
import { state } from "./state.js";
import { requireInternet } from "./network.js";
import { getCurrentUser } from "./services/authService.js";


// Logout workflow that clears local state, reloads vendor data,
// re-renders home/my views, and navigates the app to home.
export async function logout() {
    if(!requireInternet(false)) return;
    showToast("Signing out...");
    const { error } = await supabase.auth.signOut();
    if(error){
        console.error("Logout error:", error);
        showToast("Couldn't sign you out. Please try again.");
        return;
    }
    await load();
    state.user = null;
    renderHome();
    await renderMy();
    state.profile = null;
    window.go("home");
}

export async function clearDeletedAccount(){
    await supabase.auth.signOut({
        scope: "local"
    });
    state.user = null;
    state.profile = null;
    await load();
    renderHome();
    window.go("home");
}

export async function loadProfile(force = false) {
    if (!requireInternet(false)) return;
    if (state.profile && !force) {
        return state.profile;
    }
    const user = await getCurrentUser();
    if (!user) {
        return null;
    }
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
    if (error) {
        console.error(error);
        return null;
    }
    state.profile = {
        id: user.id,
        email: user.email,
        fullName: data.full_name,
        phone: data.phone,
        avatar: data.avatar_url
    };
    return state.profile;
}

export async function isLoggedIn(){

    return !!(await getCurrentUser());

}
