import { state } from "./state.js";
import { supabase } from "./supabase.js";
import { showLoader, hideLoader } from "./utils.js";
import { renderEditImages } from "./image-manager.js";
import { showToast } from "./ui.js";

export async function load() {

const { data, error } = await supabase
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
            image_url
        )
    `)
    .order("created_at", { ascending: false });


    if (error) {
        console.error("Failed to load businesses:", error);
        state.vendors = [];
        return;
    }
    console.log("RAW BUSINESS DATA:", data);

    const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name");


    if (categoriesError) {
        console.error("Failed to load categories:", categoriesError);
        state.cats = [];
    } else {
        state.cats = categories;
    }


    state.vendors = data.map(v => ({
        id: String(v.id),
        ownerId: v.owner_id,
        name: v.name,

        phone: v.phone,
        whatsapp: v.whatsapp,

        category: v.category_id,

        categoryName: v.categories?.name ?? "",

        town: v.town,
        area: v.area,

        description: v.description,

        photoUrls: v.business_images?.map(img => img.image_url) ?? [],

        images: v.business_images ?? [],

        createdAt: new Date(v.created_at).getTime(),

        isActive: v.is_active
    }));


}
export function save() {
    // Temporary.
    // We'll replace this when we build vendor creation/editing.
}

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
