import { showToast } from "./ui.js";
import { showOffline } from "./utils.js";

export function requireInternet(message = true){

    if(navigator.onLine){

        return true;
        console.log("your online")

    }

    showOffline();

    if(message){

        showToast("You're offline.");

    }

    return false;

}