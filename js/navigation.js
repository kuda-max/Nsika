import { state } from './state.js';
import { $ } from './utils.js';
import { renderHome, renderExplore, renderMy, renderProfile } from './render.js';
import { getOwnerId } from './utils.js';
import { initSignupMap } from './map.js';

// Screen identifiers used throughout the navigation system.
export const screens = {
  home:'home',
  explore:'explore',
  profile:'profile',
  add:'add',
  my:'my',
  register:'register',
  login:'login',
  settings:'settings'
};

// Navigate to a named screen by updating the active screen class,
// managing header buttons, and triggering any required render logic.
export function go(name){
  if(name==='profile' && !state.currentProfileId) return;

  // Hide all screen containers and show the selected one.
  Object.values(screens).forEach(s=> $('#screen-'+s).classList.remove('active'));
  $('#screen-'+name).classList.add('active');

  // Track navigation history for the back button.
  state.prevScreen = state.currentScreen;
  state.currentScreen = name;

  // Update bottom navigation active state.
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(['home','explore','add','my','register','login','settings'].includes(name)) {
    $('#nav-'+name).classList.add('active');
  }

  const backBtn = $('#header-back');
  const editBtn = $('#header-edit');
  const title = $('#header-title');

  // Show the header back button only on profile screens.
  backBtn.style.display = (name==='profile') ? 'inline-flex' : 'none';

  if(name==='profile'){
    const v = state.vendors.find(x=>x.id===state.currentProfileId);
    const isOwner = !!v && v.ownerId === getOwnerId();
    editBtn.style.display = isOwner ? 'inline-flex' : 'none';
  } else {
    editBtn.style.display = 'none';
  }

  // Set the header title based on the current screen.
  title.textContent = {
    add:'Joinani Nsika',
    my:'Nsika',
    profile:'Vendor',
    explore:'Fufuzani',
    settings:'Settings'
  }[name] || 'Nsika';

  // Render content for screens that require fresh data.
  if(name==='home') renderHome();
  if(name==='explore') renderExplore();
  if(name==='my') renderMy();
  if(name==='add') setTimeout(() => {initSignupMap();}, 100);
  if(name==='profile') renderProfile(state.currentProfileId);
  if(name=='settings') {
    loadProfileHeader();
    settingsEligible();
  }
}

// Navigate back from the current screen. If on profile, return to the previous screen,
// otherwise go to home and hide the pause button.
export function back(){
  if(state.currentScreen==='profile') {
    go(state.prevScreen || 'home');
  } else {
    go('home');
  }
  const pauseBtn = $('#header-pause');
  if(pauseBtn) pauseBtn.style.display = 'none';
}