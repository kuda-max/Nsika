import { state } from './state.js';
import { $ } from './utils.js';
import { renderHome, renderExplore, renderMy, renderProfile } from './render.js';
import { getOwnerId } from './utils.js';

export const screens = { home:'home', explore:'explore', profile:'profile', add:'add', my:'my' };
export function go(name){
  if(name==='profile' && !state.currentProfileId) return;
  Object.values(screens).forEach(s=> $('#screen-'+s).classList.remove('active'));
  $('#screen-'+name).classList.add('active');
  state.prevScreen = state.currentScreen; state.currentScreen = name;

  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(['home','explore','add','my'].includes(name)) $('#nav-'+name).classList.add('active');

  const backBtn = $('#header-back');
  const editBtn = $('#header-edit');
  const title = $('#header-title');
  backBtn.style.display = (name==='profile') ? 'inline-flex' : 'none';
  if(name==='profile'){
    const v = state.vendors.find(x=>x.id===state.currentProfileId);
    const isOwner = !!v && v.ownerId === getOwnerId();
    editBtn.style.display = isOwner ? 'inline-flex' : 'none';
  } else { editBtn.style.display = 'none'; }
  title.textContent = {add:'Join Nsika', my:'My Shop', profile:'Vendor', explore:'Explore'}[name] || 'Nsika';

  if(name==='home') renderHome();
  if(name==='explore') renderExplore();
  if(name==='my') renderMy();
  if(name==='profile') renderProfile(state.currentProfileId);
}

export function back(){ if(state.currentScreen==='profile') go(state.prevScreen || 'home'); else go('home'); }
