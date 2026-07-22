export function showToast(msg){
	const t=document.querySelector('#toast'); t.textContent=msg; t.classList.add('show');
	setTimeout(()=>t.classList.remove('show'), 2200);
}
