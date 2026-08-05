import { state } from './state.js';
import { $ } from './utils.js';
import { renderHome, renderExplore } from './render.js';
import { debounce ,syncChipIndicator} from './animations.js';

export function currentSearchInputId(){
    return state.currentScreen === 'explore' ? 'explore-search' : 'home-search';
}

export function initTopbarSearch(){
    const topbarInput = document.getElementById('topbar-search');
    if(!topbarInput) return;

    topbarInput.addEventListener('input', () => {
        const target = document.getElementById(currentSearchInputId());
        if(target) target.value = topbarInput.value;
        onSearch();
    });
}

export const onSearch = debounce(() => {
    if (state.currentScreen === 'explore') renderExplore();
    else renderHome();
}, 200);


// Set the selected town filter and update the UI chips and results.
export function setTown(el, town){
  state.selectedTown = town;

  const rows = document.querySelectorAll('.chip-row');
  rows.forEach(row=>{
    row.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    const match = Array.from(row.children).find(c=>c.textContent.trim()===(town==='All'?'Madera Onse':town));
    if(match) match.classList.add('active');
    syncChipIndicator(row);
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
