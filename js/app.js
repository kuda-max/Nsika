import { load } from './storage.js';
import { renderCategories, renderHome } from './render.js';

export async function init(){
	await load();
	renderCategories();
	renderHome();
}
