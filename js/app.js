import { load } from './storage.js';
import { supabase } from "./supabase.js";
import { renderCategories, renderHome } from './render.js';

export async function init(){
	await load();
	renderCategories();
	renderHome();
}

import { currentUser } from "./auth.js";

const user = await currentUser();

console.log(user);