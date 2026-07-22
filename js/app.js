import { load } from './storage.js';
import { supabase } from "./supabase.js";
import { renderCategories, renderHome } from './render.js';
import * as forms from './forms.js';

export async function init(){

	await load();

	forms.populateSelect('signup-category');

	renderCategories();
	renderHome();

	const { data, error } = await supabase.auth.getUser();

if (error || !data.user) {
    await supabase.auth.signOut();
}
}


