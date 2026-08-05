let confirmCallback = null;

const modal = document.getElementById("confirm-modal");

const title = document.getElementById("confirm-title");

const message = document.getElementById("confirm-message");

const icon = modal.querySelector(".confirm-icon");

const okBtn = document.getElementById("confirm-ok");

export function showConfirmModal({

    title: heading,

    message: body,

    icon: iconName = "trash-2",

    danger = true,

    confirmText = "Confirm",

    onConfirm

}){

    confirmCallback = onConfirm || null;

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

}

export function closeConfirmModal(){

    modal.classList.remove("show");

    const finish = e=>{

        if(e.target !== modal) return;

        modal.style.display = "none";

        modal.removeEventListener("transitionend", finish);

    };

    modal.addEventListener("transitionend", finish);

}

okBtn.onclick = async ()=>{

    closeConfirmModal();

    if(confirmCallback){

        await confirmCallback();

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