// Show a temporary toast notification message in the UI.
// The toast element is displayed, then hidden again after 3.2 seconds.
export function showToast(msg){
	const t=document.querySelector('#toast');
	if(!t) return;
	t.textContent=msg;
	t.classList.add('show');
	setTimeout(()=>t.classList.remove('show'), 3200);
}
