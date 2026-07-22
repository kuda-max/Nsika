import { load } from './storage.js';
import { supabase } from "./supabase.js";
import { renderCategories, renderHome } from './render.js';

export async function init(){
	await load();
	renderCategories();
	renderHome();
}

console.log("Client:", supabase);
console.log("Has from:", typeof supabase.from);

async function testSupabase() {
    const { data, error } = await supabase
        .from("vendors")
        .select("*");

    console.log("Data:", data);
    console.log("Error:", error);
}

testSupabase();