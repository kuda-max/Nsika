import { showToast } from "./ui.js";
import { showOffline } from "./utils.js";

export function requireInternet(message = true){

    if(navigator.onLine){
        return true;
    }
    showOffline();
    if(message){
        showToast("You're offline.");
    }
    return false;
}