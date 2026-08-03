import { state } from "./state.js";
import { showLoader, hideLoader} from "./utils.js";
import { renderHome } from "./render.js";

// Obtain the user's current geographic position and display it on the signup map.
export function getBusinessLocation(){
    if(!navigator.geolocation){
        showToast("Geolocation siyotheka mu chipangizo chanuchi.");
        return;
    }

    showLoader("Tikusaka Dela lanu...");

    navigator.geolocation.getCurrentPosition(
        position=>{
            hideLoader();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            state.selectedLat = lat;
            state.selectedLng = lng;
            document.querySelector("#signup-map").style.display="block";

            if(!state.signupMap){
                state.signupMap = L.map("signup-map")
                    .setView([lat,lng],16);

                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        maxZoom:19
                    }
                ).addTo(state.signupMap);

                state.signupMarker = L.marker(
                    [lat,lng],
                    {
                        draggable:true
                    }
                ).addTo(state.signupMap);

                state.signupMarker.on("dragend",()=>{
                    const p = state.signupMarker.getLatLng();
                    state.selectedLat = p.lat;
                    state.selectedLng = p.lng;
                    updateLocationLabel();
                });
            } else {
                state.signupMap.setView([lat,lng],16);
                state.signupMarker.setLatLng([lat,lng]);
            }

            updateLocationLabel();
        },
        ()=>{
            hideLoader();
            showToast("Takanika kupeza Dela lanu.");
        }
    );
}

// Update the location status label with the current latitude and longitude.
function updateLocationLabel(){
    document.querySelector("#location-status").textContent =
        `Lat: ${state.selectedLat.toFixed(6)}\nLng: ${state.selectedLng.toFixed(6)}`;
}

// Initialize the signup map and map interactions used when adding a business.
export async function initSignupMap(){
    const mapElement = document.getElementById("signup-map");
    if(!mapElement) return;

    if(state.signupMap){
        state.signupMap.remove();
        state.signupMap = null;
    }

    state.signupMap = L.map(mapElement).setView([-13.9626, 33.7741], 13);
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:"© OpenStreetMap contributors",
            maxZoom:19
        }
    ).addTo(state.signupMap);

    state.signupMap.on("click", e=>{
        state.location.lat = e.latlng.lat;
        state.location.lng = e.latlng.lng;
        reverseGeocode(state.location.lat, state.location.lng);

        if(state.signupMarker){
            state.signupMarker.setLatLng(e.latlng);
        } else {
            state.signupMarker = L.marker(
                e.latlng,
                {
                    draggable:true
                }
            ).addTo(state.signupMap);

            state.signupMarker.on("dragend", () => {
                const pos = state.signupMarker.getLatLng();
                state.location.lat = pos.lat;
                state.location.lng = pos.lng;
                reverseGeocode(pos.lat, pos.lng);
            });
        }

        document.getElementById("location-status").textContent =
            "Move the marker if needed.";
    });

    if(!navigator.geolocation){
        document.getElementById("location-status").textContent =
            "Delali silololedwa.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position=>{
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            state.location.lat = lat;
            state.location.lng = lng;
            reverseGeocode(lat,lng);
            state.signupMap.setView([lat,lng],16);
            state.signupMarker = L.marker(
                    [lat,lng],
                    {
                        draggable:true
                    }
                ).addTo(state.signupMap);

            state.signupMarker.on("dragend", () => {
                const pos = state.signupMarker.getLatLng();
                state.location.lat = pos.lat;
                state.location.lng = pos.lng;
                reverseGeocode(pos.lat, pos.lng);
            });
        },
        ()=>{
            document.getElementById("location-status").textContent =
                "Dera silikupezeka. Dinani pa malo omwe business yanu ili pa map.";
        }
    );
}

// Convert latitude and longitude into a human-readable address using OpenStreetMap Nominatim.
// Updates the shared state location and the map status label.
export async function reverseGeocode(lat,lng){
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const address = data.address || {};

        const town =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            "";
        const fullAddress = data.display_name || "";

        state.location.address = fullAddress;
        state.location.town = town;
        state.location.selectedTown = town;

        const label = document.querySelector("#location-status");
        if(label){
            label.textContent = `📍 ${fullAddress}`;
        }
    } catch(err){
        console.error("Reverse geocode error:",err);
    }
}

// Straight-line distance underestimates real travel distance since
// roads aren't straight. This rough multiplier approximates road distance.
const DETOUR_FACTOR = 1.3;

export function estimatedRoadDistanceKm(lat1, lng1, lat2, lng2){
    return distanceKm(lat1, lng1, lat2, lng2) * DETOUR_FACTOR;
}

// Haversine formula — straight-line distance between two coordinates, in km.
export function distanceKm(lat1, lng1, lat2, lng2){
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Requests the user's location once, silently. On success, caches it
// and re-renders Home if that's the current screen. On denial/failure,
// does nothing — Home's newest-first sort stands as the fallback.
export function requestUserLocation(){
    if(!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        position => {
            state.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if(state.currentScreen === 'home') renderHome();
            if(state.currentScreen === 'profile') renderProfile(state.currentProfileId);
        },
        () => {
            // denied or unavailable — state.userLocation stays null
        },
        { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
}
// Formats a km distance for display — meters under 1km, one decimal above.
export function formatDistance(km){
    if(km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
}