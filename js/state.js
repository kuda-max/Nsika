export const state = {
	LS_KEY: 'nsika_v2_vendors',
	cats: [
		{id:'tailoring', name:'Tailoring', icon:'<path d="M9 6a3 3 0 0 1 6 0h2a1 1 0 0 1 1 1v1H5V7a1 1 0 0 1 1-1h2z"/><rect x="6" y="9" width="12" height="12" rx="1"/>'},
		{id:'mechanics', name:'Mechanics', icon:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.9 4.9l2.8 2.8m9.4 9.4l2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m9.4-9.4l2.8-2.8"/>'},
		{id:'food', name:'Food', icon:'<path d="M2 12h20v1a10 10 0 0 1-20 0v-1z"/>'},
		{id:'salons', name:'Salons', icon:'<circle cx="12" cy="8" r="4"/><path d="M6 22v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4"/>'},
		{id:'repairs', name:'Repairs', icon:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>'},
		{id:'shops', name:'General Shops', icon:'<path d="M2 21h20M4 21V10l8-5 8 5v11"/>'}
	],
	vendors: [],
	currentScreen: 'home',
	prevScreen: 'home',
	selectedTown: 'All',
	currentProfileId: null,
	signupPhotos: [null,null,null],
	activeExploreCat: null
};
