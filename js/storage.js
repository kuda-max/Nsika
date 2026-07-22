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
        console.log("Loaded categories:", state.cats);
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