import { state } from "./state.js";
import { supabase } from "./supabase.js";

export async function load() {

    const { data, error } = await supabase
        .from("businesses")
        .select(`
            *,
            categories (
                id,
                name,
                icon
            )
        `)
        .order("created_at", { ascending: false });


    if (error) {
        console.error("Failed to load businesses:", error);
        state.vendors = [];
        return;
    }


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

        photoUrls: v.photo_urls ?? [],

        createdAt: new Date(v.created_at).getTime(),

        isActive: v.is_active
    }));

}
export function save() {
    // Temporary.
    // We'll replace this when we build vendor creation/editing.
}

export async function uploadBusinessPhotos(businessId) {
    const photoUrls = [];
    for (let i = 0; i < state.signupPhotos.length; i++) {
        const file = state.signupPhotos[i];
        if (!file) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `${businessId}/${filename}`;
        const { error } = await supabase.storage
            .from("business-images")
            .upload(path, file);
        if (error) {
            console.error("Photo upload error:", error);
            throw error;
        }
        const { data } = supabase.storage
            .from("business-images")
            .getPublicUrl(path);
        photoUrls.push(data.publicUrl);
    }
    return photoUrls;
}

const urls = await uploadBusinessPhotos("53381c01-2899-4b75-90f6-c38fe43c169e");

console.log(urls);