import { state } from './state.js';
import { $ } from './utils.js';
import { renderHome, renderExplore } from './render.js';

// Called when the search input changes to refresh vendor lists.
export function onSearch(){
  renderHome();
  renderExplore();
}

// Set the selected town filter and update the UI chips and results.
export function setTown(el, town){
  state.selectedTown = town;

  const rows = document.querySelectorAll('.chip-row');
  rows.forEach(row=>{
    row.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    const match = Array.from(row.children).find(c=>c.textContent.trim()===(town==='All'?'All Areas':town));
    if(match) match.classList.add('active');
  });

  renderHome();
  renderExplore();
}

// Pick a category filter for explore and navigate to the explore screen.
export function pickCategory(id){
  state.activeExploreCat = id;
  if(window.go) window.go('explore');
}

// Clear the category filter and navigate to the explore screen.
export function openExploreAll(){
  state.activeExploreCat = null;
  if(window.go) window.go('explore');
}
