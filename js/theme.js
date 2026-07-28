import { $ } from './utils.js';

// Determine the effective theme to apply.
// Prefer a data-theme attribute if already set, otherwise use system preference.
export function effectiveTheme(){
	const attr = document.documentElement.getAttribute('data-theme');
	if(attr) return attr;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Update the UI badge showing the current theme selection in settings.
function updateThemeBadge(){
	const badge = document.getElementById('settings-theme-pill');
	if(badge) badge.textContent = effectiveTheme()==='dark' ? 'Dark' : 'Light';
}

// Apply a theme choice by setting the document attribute and saving it locally.
export function applyTheme(t){
	if(t==='dark') document.documentElement.setAttribute('data-theme','dark');
	else document.documentElement.setAttribute('data-theme','light');
	localStorage.setItem('nsika_theme', t);
	const moon = $('#icon-moon');
	const sun = $('#icon-sun');
	if(moon) moon.style.display = t==='dark' ? 'none':'block';
	if(sun) sun.style.display = t==='dark' ? 'block':'none';
	updateThemeBadge();
}

// Toggle between dark and light theme based on current effective theme.
export function toggleTheme(){ applyTheme(effectiveTheme()==='dark' ? 'light':'dark'); }

// Initialize theme on module load using saved preference or system default.
const savedTheme = localStorage.getItem('nsika_theme');
if(savedTheme) applyTheme(savedTheme);
else applyTheme(effectiveTheme());
