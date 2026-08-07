import { state } from "./state.js";


export function isGuest(){

    return !state.user;

}


export function canEditBusiness(business){

    if(!state.user || !business){
        return false;
    }

    return state.user.id === business.ownerId;

}


export function canManageAccount(){

    return !!state.user;

}