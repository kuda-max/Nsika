import { supabase } from "./supabase.js";
import { load } from "./storage.js";
import { renderHome, renderMy } from "./render.js";
import { showToast } from "./ui.js";
import { state } from "./state.js";

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    return { data, error };
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return { data, error };
}

export async function signOut() {
    return await supabase.auth.signOut();
}

export async function currentUser() {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    return user;
}


export async function logout() {

    const { error } = await supabase.auth.signOut();

    if (error) {
        showToast("Error signing out: " + error.message);
        return;
    }

    await load();

    state.user = null;
    renderHome();
    await renderMy();

    window.go("home");
}