// Global app state object shared throughout the app.
// Holds cached data, UI state, selected filters, and user session info.
export const state = {
	LS_KEY: 'nsika_v2_vendors', // local storage key placeholder for vendor data caching
	cats: [], // list of category objects loaded from the backend
	user: null, // current authenticated Supabase user
	vendors: [], // cached vendor listings loaded from Supabase
	currentScreen: 'home', // active screen key for navigation
	prevScreen: 'home', // previously active screen
	selectedTown: 'All', // selected town filter for search results
	currentProfileId: null, // currently viewed vendor profile ID
	signupPhotos: [null,null,null], // temporary file slots for signup photo uploads
	activeExploreCat: null, // currently selected explore category filter
	location: {
		lat: null,
		lng: null,
		address: "",
		town: ""
	},
	profile: null,
	userLocation: { lat: null, lng: null },
};

