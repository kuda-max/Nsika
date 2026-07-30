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

    if (!navigator.onLine) {

        showToast("No internet connection.");

    }

    if (error) {
        showToast("Takanka kukupangani sign-out");
        return;
    }

    await load();
    state.user = null;
    renderHome();
    await renderMy();
    window.go("home");
}

export async function loadProfile(force = false){

    if(state.profile && !force){
        return state.profile;
    }

    const {
        data:{user}
    } = await supabase.auth.getUser();

    if(!user){
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if(error){
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


export async function getCurrentUser(){

    const {
        data:{user}
    } = await supabase.auth.getUser();

    return user;
}