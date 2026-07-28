import { state } from "./state.js";
import { showLoader, hideLoader} from "./utils.js";

// Obtain the user's current geographic position and display it on the signup map.
export function getBusinessLocation(){
    if(!navigator.geolocation){
        showToast("Geolocation isn't supported.");
        return;
    }

    showLoader("Getting your location...");

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
            showToast("Couldn't get your location.");
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
            "Location isn't supported.";
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
                "Location unavailable. Tap the map.";
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
