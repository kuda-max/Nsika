// Animations
import { animate } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";
// Debounce helper — delays calling fn until `wait` ms have passed
// since the last call. Use this to wrap onSearch() so we don't
// re-render + re-animate the list on every single keystroke.
export function debounce(fn, wait = 200) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

export function animateCards() {
    const cards = document.querySelectorAll(".v-card");
    cards.forEach((card, i) => {
        card.animate(
            [
                {
                    opacity: 0,
                    transform: "translateY(12px)"
                },
                {
                    opacity: 1,
                    transform: "translateY(0)"
                }
            ],
            {
                duration: 250,
                delay: i * 30,
                easing: "ease-out",
                fill: "both"
            }
        );
    });
}

export function animateSettings(){
    const items = document.querySelectorAll(".settings-group");
    items.forEach((item, index)=>{
        item.animate(
            [
                {
                    opacity:0,
                    transform:"translateY(10px)"
                },

                {
                    opacity:1,
                    transform:"translateY(0)"
                }

            ],

            {
                duration:250,
                delay:index*30,
                easing:"ease-out",
                fill:"both"
            }
        );
    });
}

export function animateImage(image){
    if(!image) return;
    image.animate(
        [
            {
                opacity:0
            },

            {
                opacity:1
            }

        ],

        {
            duration:300,
            easing:"ease-out",
            fill:"both"
        }
    );
}

export function animateThemeToggle(theme, moon, sun){
    if(!moon || !sun) return;
    const showDark = theme === 'dark';
    const hide = showDark ? moon : sun;
    const show = showDark ? sun : moon;

    hide.animate(
        [
            { opacity: 1, transform: 'rotate(0deg) scale(1)' },
            { opacity: 0, transform: 'rotate(-90deg) scale(0.4)' }
        ],
        { duration: 180, easing: 'ease-in', fill: 'forwards' }
    ).onfinish = () => {
        hide.style.display = 'none';
        show.style.display = 'block';
        show.animate(
            [
                { opacity: 0, transform: 'rotate(90deg) scale(0.4)' },
                { opacity: 1, transform: 'rotate(0deg) scale(1)' }
            ],
            { duration: 200, easing: 'ease-out', fill: 'forwards' }
        );
    };
}

// Slides a pill-shaped indicator behind the active chip in a chip-row,
// and gives the active chip itself a small pop. Call after .active
// has been set on the target chip.
export function syncChipIndicator(row){
    const active = row.querySelector(".chip.active");
    if(!active) return;

    let indicator = row.querySelector(".chip-indicator");

    const rowRect = row.getBoundingClientRect();
    const targetRect = active.getBoundingClientRect();
    const targetX = targetRect.left - rowRect.left + row.scrollLeft;
    const targetY = targetRect.top - rowRect.top + row.scrollTop;
    const targetW = targetRect.width;
    const targetH = targetRect.height;

    if(!indicator){
        indicator = document.createElement("span");
        indicator.className = "chip-indicator";

        row.prepend(indicator);

        indicator.style.top = `${targetY}px`;
        indicator.style.height = `${targetH}px`;
        indicator.style.transform = `translateX(${targetX}px)`;
        indicator.style.width = `${targetW}px`;
        indicator.dataset.x = targetX;
        indicator.dataset.w = targetW;
        return;
    }

    const prevX = parseFloat(indicator.dataset.x) || targetX;
    const prevW = parseFloat(indicator.dataset.w) || targetW;

    indicator.dataset.x = targetX;
    indicator.dataset.w = targetW;

    // Top/height rarely change mid-animation (all chips in a row share
    // the same height), so set them directly rather than animating —
    // only the horizontal slide needs to be smooth.
    indicator.style.top = `${targetY}px`;
    indicator.style.height = `${targetH}px`;

    indicator.animate(
        [
            { transform: `translateX(${prevX}px)`, width: `${prevW}px` },
            { transform: `translateX(${targetX}px)`, width: `${targetW}px` }
        ],
        { duration: 280, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
    );
};
// Fades + scales in an empty-state message (no results / no listings).
// Call right after setting innerHTML with an `.empty` div.
export function animateEmptyState(container){
    const empty = container?.querySelector('.empty');
    if(!empty) return;
    empty.animate(
        [
            { opacity: 0, transform: 'scale(0.96)' },
            { opacity: 1, transform: 'scale(1)' }
        ],
        { duration: 250, easing: 'ease-out', fill: 'both' }
    );
}

// Shakes a single field — used for invalid-input feedback.
export function shakeField(field){
    if(!field) return;
    field.animate(
        [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-8px)' },
            { transform: 'translateX(7px)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(0)' }
        ],
        { duration: 350, easing: 'ease-in-out' }
    );
}

// Attach once per form. Listens for native invalid events (fires per-field
// on submit when validation fails) and shakes + focuses the first offender.
// Also removes the browser's default invalid-field bubble/outline flash
// timing conflicts by preventing default only where you want the shake
// to be the sole feedback — here we let native styling still apply.
export function attachShakeValidation(form){
    if(!form) return;
    let firstInvalid = null;

    form.addEventListener('invalid', (e) => {
        shakeField(e.target);
        if(!firstInvalid) firstInvalid = e.target;
    }, true); // capture phase — 'invalid' does not bubble

    form.addEventListener('submit', () => {
        firstInvalid = null; // reset each attempt; repopulated by 'invalid' events above if any
    }, true);
}

// Shakes the submit button itself — use when an error can't be
// attributed to a single field (e.g. generic server/network errors).
export function shakeSubmit(form){
    const btn = form.querySelector('button[type="submit"]');
    shakeField(btn);
}

// Renders `count` shimmering placeholder cards shaped like .v-card,
// into `container`. Call before/while data loads, then overwrite
// container.innerHTML with real cards (via renderHome/renderExplore)
// once loaded — no explicit "hide" needed since it's replaced.
export function renderSkeletonCards(container, count = 5){
    if(!container) return;
    container.innerHTML = Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-thumb skeleton-shimmer"></div>
            <div class="skeleton-info">
                <div class="skeleton-line title skeleton-shimmer"></div>
                <div class="skeleton-line w-40 skeleton-shimmer"></div>
                <div class="skeleton-line w-80 skeleton-shimmer"></div>
            </div>
        </div>
    `).join('');
}

// Toggles a shadow on each screen's sticky search-wrap once the
// screen has scrolled past a small threshold. Uses rAF-throttling
// so it doesn't do work more than once per frame during scroll.
export function initStickySearchShadow(){
    document.querySelectorAll('.screen').forEach(screen => {
        const searchWrap = screen.querySelector('.search-wrap');
        if(!searchWrap) return;

        let ticking = false;
        screen.addEventListener('scroll', () => {
            if(ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                searchWrap.classList.toggle('scrolled', screen.scrollTop > 4);
                ticking = false;
            });
        }, { passive: true });
    });
}

// Reveals cards in `container` one at a time as they scroll into view,
// instead of animating everything on render. Use for long/unsliced
// lists (Explore) where animating 50+ offscreen cards is wasted work.
export function animateCardsOnScroll(container){
    if(!container) return;

    // Disconnect any observer from a previous render of this container
    // (innerHTML was replaced, old cards/observer entries are stale).
    if(container._revealObserver) container._revealObserver.disconnect();

    const cards = container.querySelectorAll('.v-card');
    if(!cards.length) return;

    // Hide before paint so cards don't flash visible before the observer
    // has a chance to animate them in.
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(!entry.isIntersecting) return;
            const card = entry.target;

            card.animate(
                [
                    { opacity: 0, transform: 'translateY(12px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                { duration: 250, easing: 'ease-out', fill: 'forwards' }
            ).onfinish = () => {
                // clean up inline styles now that the animation owns final state
                card.style.opacity = '';
                card.style.transform = '';
            };

            observer.unobserve(card);
        });
    }, {
        rootMargin: '0px 0px -40px 0px', // trigger slightly before fully in view
        threshold: 0.1
    });

    cards.forEach(card => observer.observe(card));
    container._revealObserver = observer;
}

// Slides a single new card in — use for a freshly-inserted item,
// not a full-list render.
export function animateCardIn(card){
    if(!card) return Promise.resolve();
    return card.animate(
        [
            { opacity: 0, transform: 'translateY(-10px) scale(0.98)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        { duration: 280, easing: 'ease-out', fill: 'both' }
    ).finished;
}

// Fades/slides a card out. Returns a promise so callers can await
// completion before mutating state/DOM further.
export function animateCardOut(card){
    if(!card) return Promise.resolve();
    return card.animate(
        [
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(-30px)' }
        ],
        { duration: 220, easing: 'ease-in', fill: 'forwards' }
    ).finished;
}

// Brief highlight ring on a card that was just edited, so the change
// is visible even when the list doesn't reorder.
export function pulseCard(card){
    if(!card) return;
    card.animate(
        [
            { boxShadow: '0 0 0 0 rgba(184,98,63,0.35)' },
            { boxShadow: '0 0 0 6px rgba(184,98,63,0)' }
        ],
        { duration: 500, easing: 'ease-out' }
    );
}

// Marks/unmarks a card as "syncing" (background save in flight).
// Operates by data-id since the DOM node gets replaced on re-render.
export function markCardSyncing(id){
    document.querySelectorAll(`.v-card[data-id="${id}"]`)
        .forEach(el => el.classList.add('is-syncing'));
}
export function clearCardSyncing(id){
    document.querySelectorAll(`.v-card[data-id="${id}"]`)
        .forEach(el => el.classList.remove('is-syncing'));
}

export function makeSheetDraggable(sheetEl, overlayEl, onDismiss){
    const handle = sheetEl?.querySelector('.sheet-handle');
    if(!handle || handle._dragBound) return;
    handle._dragBound = true;

    const DISMISS_DISTANCE = 120;
    const DISMISS_VELOCITY = 0.5;

    let dragging = false;
    let startY = 0, currentY = 0;
    let lastY = 0, lastT = 0, velocity = 0;

    // Always clears the inline styles set during dragging, no matter
    // how the animation settled — prevents stale transform lock-out.
    const resetInlineStyles = () => {
        sheetEl.style.transform = '';
        if(overlayEl) overlayEl.style.opacity = '';
    };

    handle.addEventListener('pointerdown', (e) => {
        dragging = true;
        startY = e.clientY;
        currentY = 0;
        lastY = e.clientY;
        lastT = performance.now();
        velocity = 0;
        sheetEl.style.transition = 'none';
        handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', (e) => {
        if(!dragging) return;
        currentY = Math.max(0, e.clientY - startY);

        const now = performance.now();
        const dt = now - lastT;
        if(dt > 0) velocity = (e.clientY - lastY) / dt;
        lastY = e.clientY;
        lastT = now;

        sheetEl.style.transform = `translateY(${currentY}px)`;
        if(overlayEl) overlayEl.style.opacity = Math.max(0, 1 - currentY / 300);
    });

    const endDrag = () => {
        if(!dragging) return;
        dragging = false;
        sheetEl.style.transition = '';

        const shouldDismiss = currentY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY;

        if(shouldDismiss){
            const controls = animate(sheetEl,
                { transform: [`translateY(${currentY}px)`, 'translateY(100%)'] },
                { duration: 0.22, easing: 'ease-in' }
            );
            // .then(onFulfilled, onRejected) — runs cleanup either way,
            // instead of only on the happy path.
            controls.finished.then(
                () => { resetInlineStyles(); onDismiss(); },
                () => { resetInlineStyles(); onDismiss(); }
            );
        } else {
            const controls = animate(sheetEl,
                { transform: [`translateY(${currentY}px)`, 'translateY(0px)'] },
                { duration: 0.35, easing: [0.34, 1.56, 0.64, 1] }
            );
            controls.finished.then(resetInlineStyles, resetInlineStyles);
        }
    };

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
}

// Defensive: call at the start of any sheet-open function to guarantee
// no leftover drag styles from a previous interrupted dismiss can block
// the sheet from showing.
export function resetSheetStyles(sheetEl, overlayEl){
    if(sheetEl) sheetEl.style.transform = '';
    if(overlayEl) overlayEl.style.opacity = '';
}

// Cache animation JSON in memory so we only ever fetch it once,
// instead of re-fetching on every empty-state render.
let notFoundAnimationData = null;
let notFoundAnimationPromise = null;

function loadNotFoundAnimationData(){
    if(notFoundAnimationData) return Promise.resolve(notFoundAnimationData);
    if(notFoundAnimationPromise) return notFoundAnimationPromise;

    notFoundAnimationPromise = fetch('./assets/not-found.json')
        .then(res => res.json())
        .then(data => {
            notFoundAnimationData = data;
            return data;
        });

    return notFoundAnimationPromise;
}

//app init to start the fetch early,
// so by the time someone actually hits an empty state, the JSON
// is already cached and ready — removes the network wait entirely.
export function preloadEmptyStateAnimation(){
    loadNotFoundAnimationData();
}

export async function handleEmptyStateAnimation(el){
    const empty = document.querySelector(el);
    if(!empty) return;

    // Destroy any previous instance living in this container before
    // creating a new one — prevents stacked/duplicate animations.
    if(empty._lottieInstance){
        empty._lottieInstance.destroy();
        empty._lottieInstance = null;
    }

    const animationData = await loadNotFoundAnimationData();

    // Wait two animation frames before initializing — gives the browser
    // a chance to finish layout/paint (screen transition, view-transition,
    // etc.) so the container has real dimensions when Lottie measures it.
    // A single rAF often isn't enough on mobile; double-rAF reliably
    // lands after the next paint.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Bail if the element was removed from the DOM in the
            // meantime (e.g. user navigated away or searched again fast).
            if(!document.body.contains(empty)) return;

            empty._lottieInstance = lottie.loadAnimation({
                container: empty,
                renderer: "svg",
                loop: true,
                autoplay: true,
                animationData
            });
        });
    });
}