import { $ } from './utils.js';

export function effectiveTheme(){
	const attr = document.documentElement.getAttribute('data-theme');
	if(attr) return attr;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function applyTheme(t){
	if(t==='dark') document.documentElement.setAttribute('data-theme','dark');
	else document.documentElement.setAttribute('data-theme','light');
	localStorage.setItem('nsika_theme', t);
	const moon = $('#icon-moon');
	const sun = $('#icon-sun');
	if(moon) moon.style.display = t==='dark' ? 'none':'block';
	if(sun) sun.style.display = t==='dark' ? 'block':'none';
}
export function toggleTheme(){ applyTheme(effectiveTheme()==='dark' ? 'light':'dark'); }

const savedTheme = localStorage.getItem('nsika_theme');
if(savedTheme) applyTheme(savedTheme);
else applyTheme(effectiveTheme());
