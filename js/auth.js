import { supabase } from "./supabase.js";
import { load } from "./storage.js";
import { renderHome, renderMy } from "./render.js";
import { showToast } from "./ui.js";
import { state } from "./state.js";

// Sign up a new user with email and password via Supabase.
// Returns the raw response so callers can handle success or error.
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    return { data, error };
}

// Sign in an existing user with email and password.
// Returns the Supabase auth response for the caller.
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

// Perform a simple Supabase sign-out operation.
export async function signOut() {
    return await supabase.auth.signOut();
}

// Return the currently authenticated Supabase user object.
export async function currentUser() {
    const {
        data: { user }
    } = await supabase.auth.getUser();
    return user;
}

// Logout workflow that clears local state, reloads vendor data,
// re-renders home/my views, and navigates the app to home.
export async function logout() {
    showToast("Signing out...");
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