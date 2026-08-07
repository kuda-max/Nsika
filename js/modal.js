
const modal = document.getElementById("confirm-modal");
const title = document.getElementById("confirm-title");
const message = document.getElementById("confirm-message");
const icon = modal.querySelector(".confirm-icon");
const okBtn = document.getElementById("confirm-ok");

let confirmCallback = null;
let cancelCallback = null;

export function showConfirmModal({
    title: heading,
    message: body,
    icon: iconName = "trash-2",
    danger = true,
    confirmText = "Confirm"
}){
    return new Promise(resolve=>{
        confirmCallback = ()=>{
            closeConfirmModal();
            resolve(true);
        };
        cancelCallback = ()=>{
            closeConfirmModal();
            resolve(false);
        };
        title.textContent = heading;
        message.textContent = body;
        okBtn.textContent = confirmText;
        icon.classList.toggle("danger", danger);
        icon.innerHTML = `<i data-lucide="${iconName}"></i>`;
        lucide.createIcons();
        modal.style.display = "flex";
        requestAnimationFrame(()=>{
            modal.classList.add("show");
        });
    });
}

export function closeConfirmModal(resolveCancel = true){
    modal.classList.remove("show");
    const finish = e=>{
        if(e.target !== modal) return;
        modal.style.display = "none";
        modal.removeEventListener("transitionend", finish);
        if(resolveCancel && cancelCallback){
            cancelCallback();
            confirmCallback = null;
            cancelCallback = null;
        }
    };
    modal.addEventListener("transitionend", finish);
}

okBtn.onclick = ()=>{
    if(confirmCallback){
        confirmCallback();
        confirmCallback = null;
        cancelCallback = null;
    }
};

modal.onclick = e=>{

    if(e.target === modal){

        closeConfirmModal();

    }

};

document.addEventListener("keydown",e=>{
    if(e.key==="Escape" && modal.style.display==="flex"){
        closeConfirmModal();
    }
});