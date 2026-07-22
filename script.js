import { init } from './js/app.js';
import * as render from './js/render.js';
import * as forms from './js/forms.js';
import * as nav from './js/navigation.js';
import * as theme from './js/theme.js';
import * as edit from './js/edit.js';
import * as ui from './js/ui.js';
import * as search from './js/search.js';
import * as auth from './js/auth.js';
import * as vendor from './js/vendor.js';

// Expose functions used by inline handlers in the HTML (keep behavior unchanged)
window.onSearch = search.onSearch;
window.setTown = search.setTown;
window.handlePhoto = forms.handlePhoto;
window.submitVendor = forms.submitVendor;
window.registerVendor = forms.registerVendor;
window.loginVendor = forms.loginVendor;
window.logout = auth.logout;
window.openExploreAll = search.openExploreAll;
window.pickCategory = search.pickCategory;
window.populateSelect = forms.populateSelect;
window.openAddListing = forms.openAddListing;
window.openMyBusiness = vendor.openMyBusiness;

window.go = nav.go;
window.back = nav.back;
window.openProfile = render.openProfile;
window.toggleTheme = theme.toggleTheme;

window.renderMy = render.renderMy;
window.renderProfile = render.renderProfile;

window.openEdit = edit.openEdit;
window.closeEdit = edit.closeEdit;
window.saveEdit = edit.saveEdit;
window.deleteListing = edit.deleteListing;
window.headerAction = edit.headerAction;



init();