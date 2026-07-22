import { state } from "./state.js";
import { supabase } from "./supabase.js";

export async function load() {
    const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to load vendors:", error);
        state.vendors = [];
        return;
    }

    state.vendors = data.map(v => ({
        id: String(v.id),
        name: v.name,
        phone: v.phone,
        whatsapp: v.whatsapp,
        category: v.category,
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