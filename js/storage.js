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

// Delete an image both from Supabase storage and from the business_images table.
export async function deleteBusinessImage(imageUrl){
    const url = new URL(imageUrl);
    const path = url.pathname.split("/business-images/")[1];

    const { error: storageError } = await supabase.storage
        .from("business-images")
        .remove([path]);

    if(storageError){
        throw storageError;
    }

    const { error: dbError } = await supabase
        .from("business_images")
        .delete()
        .eq("image_url", imageUrl);

    if(dbError){
        throw dbError;
    }
}

// Deletes every image belonging to a business from Supabase Storage.
export async function deleteBusinessImages(businessId){

    // Get all image URLs for this business.
    const { data: images, error } = await supabase
        .from("business_images")
        .select("image_url")
        .eq("business_id", businessId);

    if(error) throw error;

    if(!images.length) return;

    // Convert public URLs into storage paths.
    const paths = images.map(img => {
        const url = new URL(img.image_url);
        return decodeURIComponent(
            url.pathname.split("/business-images/")[1]
        );
    });

    // Delete from the Storage bucket.
    const { error: removeError } = await supabase
        .storage
        .from("business-images")
        .remove(paths);

    if(removeError) throw removeError;

    // Delete the database records.
    const { error: dbError, count } = await supabase
        .from("business_images")
        .delete({ count: "exact" })
        .eq("business_id", businessId);

    if(dbError) throw dbError;

    if(count !== images.length){
        throw new Error("Not all business image records were deleted.");
}
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