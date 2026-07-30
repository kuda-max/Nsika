import { state } from "./state.js";
import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { renderEditImages } from "./image-manager.js";
import { showToast } from "./ui.js";
import { renderSkeletonCards } from "./animations.js";
import {$} from "./utils.js";

// Load the latest businesses and categories from Supabase into the shared state.
export async function load() {
    renderSkeletonCards($('#home-list'), 5);
    renderSkeletonCards($('#explore-list'), 6);

    try {
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

        // Persist raw category data separately so the UI can render category filters.
        const { data: categories, error: categoriesError } = categoriesResult;
        if (categoriesError) {
            console.error("Failed to load categories:", categoriesError);
            state.cats = [];
        } else {
            state.cats = categories;
        }

        // Normalize the business rows into the app's vendor object shape.
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
