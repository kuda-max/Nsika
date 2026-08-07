import { state } from "./state.js";
import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { renderEditImages } from "./image-manager.js";
import { showToast } from "./ui.js";
import { renderSkeletonCards } from "./animations.js";
import {$} from "./utils.js";

// Load the latest businesses and categories from Supabase into the shared state.
export async function load() {

    renderSkeletonCards($('#home-list'), 7);
    renderSkeletonCards($('#explore-list'), 8);

    try {

        // Sync authenticated user state
        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            if(userError.name === "AuthSessionMissingError") {
                state.user = null;
                } else {
            console.error("Failed to load user:", userError);
            state.user = null;
                }
        } else {
            state.user = user;
        }


        const [businessesResult, categoriesResult] = await Promise.all([
            supabase
                .from("businesses")
                .select(`
                    *,
                    categories (
                        id,
                        name,
                        icon
                    ),
                    business_images (
                        id,
                        image_url,
                        is_cover
                    )
                `)
                .order("created_at", { ascending: false }),

            supabase
                .from("categories")
                .select("*")
                .order("name")
        ]);


        const { data, error } = businessesResult;

        if (error) {
            console.error("Failed to load businesses:", error);
            state.vendors = [];
            return;
        }


        // Persist category data
        const { data: categories, error: categoriesError } = categoriesResult;

        if (categoriesError) {
            console.error("Failed to load categories:", categoriesError);
            state.cats = [];
        } else {
            state.cats = categories;
        }


        // Normalize businesses
        state.vendors = data.map(v => ({
            id: String(v.id),
            ownerId: v.owner_id,
            name: v.name,
            phone: v.phone,
            whatsapp: v.whatsapp,
            category: v.category_id,
            categoryName: v.categories?.name ?? "",
            address: v.address,
            town: v.town,
            latitude: v.latitude,
            longitude: v.longitude,
            description: v.description,
            photoUrls: v.business_images?.map(img => img.image_url) ?? [],
            images: v.business_images ?? [],
            createdAt: new Date(v.created_at).getTime(),
            isActive: v.is_active
        }));


    } finally {

        hideLoader();

    }
}

// Stub save function for future local persistence or feature work.
export function save() {
    // Temporary.
    // We'll replace this when we build vendor creation/editing.
}

export async function deleteBusiness(businessId){

    const { error, count } = await supabase
        .from("businesses")
        .delete({ count: "exact" })
        .eq("id", businessId);

    if(error) throw error;

    if(count !== 1){
        throw new Error("Business was not deleted.");
    }

}

export async function deleteAuthUser(){

    const { data, error } =
        await supabase.functions.invoke("delete-user");

    if(error) throw error;

    if(!data?.success){
        throw new Error("Account deletion failed.");
    }

    if(!data.deleted?.profile){
        throw new Error("Profile was not deleted.");
    }

    if(!data.deleted?.auth){
        throw new Error("Authentication account was not deleted.");
    }

}