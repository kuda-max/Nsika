import { supabase } from "../supabase.js";


// Sign in an existing user.
export async function loginUser(email, password) {

    return await supabase.auth.signInWithPassword({
        email,
        password
    });

}


// Register a new user.
export async function registerUser(email, password, fullName) {

    return await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });

}


// Delete the currently authenticated account
// through the Supabase Edge Function.
export async function deleteAuthUser() {

    const { data, error } =
        await supabase.functions.invoke("delete-user");

    if (error) throw error;

    if (!data?.success) {
        throw new Error("Account deletion failed.");
    }

    if (!data.deleted?.profile) {
        throw new Error("Profile was not deleted.");
    }

    if (!data.deleted?.auth) {
        throw new Error("Authentication account was not deleted.");
    }

}
export async function getCurrentUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {

        if (error.name === "AuthSessionMissingError") {
            return null;
        }

        throw error;
    }

    return user;
}