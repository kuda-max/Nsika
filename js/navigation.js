import { state } from './state.js';
import { $, refreshIcons, getOwnerId} from './utils.js';
import { renderHome, renderExplore, renderMy, renderProfile } from './render.js';
import { initSignupMap } from './map.js';
import { requireInternet } from './network.js'
import { animateSettings, debounce, syncChipIndicator} from './animations.js';

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
export function go(name){

  if(name==='profile' && !state.currentProfileId) return;

  const applyNav = () => {
    Object.values(screens).forEach(s=> $('#screen-'+s).classList.remove('active'));
    $('#screen-'+name).classList.add('active');

    state.prevScreen = state.currentScreen;
    state.currentScreen = name;

    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    if(['home','explore','add','my','register','login','settings'].includes(name)) {
      $('#nav-'+name).classList.add('active');
    }

    const backBtn = $('#header-back');
    const editBtn = $('#header-edit');
    const title = $('#header-title');

    backBtn.style.display = (name==='profile') ? 'inline-flex' : 'none';

    if(name==='profile'){
      const v = state.vendors.find(x=>x.id===state.currentProfileId);
      const isOwner = !!v && v.ownerId === getOwnerId();
      editBtn.style.display = isOwner ? 'inline-flex' : 'none';
    } else {
      editBtn.style.display = 'none';
    }

    title.textContent = {
      add:'Joinani Nsika', my:'Nsika', profile:'Business',
      explore:'Fufuzani', settings:'Settings'
    }[name] || 'Nsika';

    if(name==='home') renderHome();
    if(name==='explore') renderExplore();
    if(name==='my') renderMy();
    if(name==='add'){
      if (!requireInternet(false)) return;
      setTimeout(() => {initSignupMap();}, 100);
    }
    if(name==='profile') { refreshIcons(); renderProfile(state.currentProfileId) }
    if(name=='settings') {
      loadProfileHeader();
      settingsEligible();
      animateSettings();
    }
    refreshIcons();

    // The newly-shown screen may contain a chip-row that was hidden
    // (display:none via .screen) when we last measured it — those rects
    // are zero-width, so resync now that it's actually visible.
    $('#screen-'+name).querySelectorAll('.chip-row').forEach(row => syncChipIndicator(row));
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(document.startViewTransition && !reduceMotion){
    document.startViewTransition(applyNav);
  } else {
    applyNav();
  }
}

// Keep chip indicators aligned if the layout reflows (rotation, resize,
// font load shifting widths, etc). Only resync rows in the active screen.
const resyncVisibleChipRows = debounce(() => {
  document.querySelectorAll('.screen.active .chip-row').forEach(row => syncChipIndicator(row));
}, 150);

window.addEventListener('resize', resyncVisibleChipRows);
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