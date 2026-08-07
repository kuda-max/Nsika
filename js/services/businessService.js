import { state } from "../state.js";
import { supabase } from "../supabase.js";


// Get the business owned by the currently logged-in user.
export async function getMyBusiness() {

    if (!state.user) {
        console.warn("No logged-in user");
        return null;
    }

    const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", state.user.id)
        .maybeSingle();

    if (error) throw error;

    return data;
}


// Create a new business.
export async function createBusiness(business) {

    const { data, error } = await supabase
        .from("businesses")
        .insert(business)
        .select()
        .single();

    if (error) throw error;

    return data;
}


// Save image records belonging to a business.
export async function createBusinessImages(imageRows) {

    if (!imageRows.length) {
        return [];
    }

    const { data, error } = await supabase
        .from("business_images")
        .insert(imageRows)
        .select();

    if (error) throw error;

    return data;
}


// Delete a business.
export async function deleteBusiness(businessId) {

    const { error, count } = await supabase
        .from("businesses")
        .delete({ count: "exact" })
        .eq("id", businessId);

    if (error) throw error;

    if (count !== 1) {
        throw new Error("Business was not deleted.");
    }

}