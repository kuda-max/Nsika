import { supabase } from "./supabase.js";

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