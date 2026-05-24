/**
 * ads.js — Adsterra + Monetag Ad Manager
 *
 * STRATEGY:
 * ─────────────────────────────────────────────────────────────────
 *  🔵 Adsterra Native Banner  →  FIRST .ad-in-content slot per page
 *     (visible on ALL screen sizes incl. mobile — native blends with content)
 *
 *  🟠 Monetag Vignette Ads (zone 11049792)  →  Loaded site-wide via <head>
 *     Automatically serves: Vignette Interstellar Ads — no div needed
 *
 *  All other .ad-slot divs are collapsed to zero to avoid empty boxes.
 * ─────────────────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

    const allSlots = document.querySelectorAll('.ad-slot');
    let adsterraTargetSlot = null;

    // ── Step 1: Find FIRST .ad-in-content slot for Adsterra ──
    allSlots.forEach(slot => {
        if (!adsterraTargetSlot && slot.classList.contains('ad-in-content')) {
            adsterraTargetSlot = slot;   // reserve it
        } else {
            collapseSlot(slot);          // collapse everything else
        }
    });

    // ── Step 2: Lazy-load Adsterra when target slot enters viewport ──
    if (adsterraTargetSlot) {
        const adObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    injectAdsterra(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '300px 0px',   // start loading before it enters screen
            threshold: 0.01
        });

        adObserver.observe(adsterraTargetSlot);
    }

    // ── Step 3: Actively unregister any lingering ad service workers ──
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister().then(() => {
                    console.log('[Service Worker] Lingering background ad worker successfully cleared.');
                });
            }
        }).catch(err => {
            console.warn('[Service Worker] Error clearing service worker:', err);
        });
    }

    // ── Adsterra Native Banner Injector ──
    function injectAdsterra(element) {
        element.style.border = 'none';
        element.style.backgroundColor = 'transparent';
        element.style.minHeight = '100px';
        element.style.overflow = 'visible';

        // Required container div (Adsterra's invoke.js looks for this ID)
        const container = document.createElement('div');
        container.id = 'container-e4afa7a018eee0d6bec2ec105afde9dd';
        element.appendChild(container);

        // Dynamically load Adsterra invoke.js after container is in DOM
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://pl29385278.effectivecpmnetwork.com/e4afa7a018eee0d6bec2ec105afde9dd/invoke.js';
        element.appendChild(script);

        element.classList.add('loaded');
        console.log('[Ads] ✅ Adsterra Native Banner → first in-content slot');
    }

    // ── Collapse unused slots (prevents empty layout gaps) ──
    function collapseSlot(element) {
        element.style.display    = 'none';
        element.style.height     = '0';
        element.style.minHeight  = '0';
        element.style.margin     = '0';
        element.style.padding    = '0';
        element.style.border     = 'none';
        element.style.overflow   = 'hidden';
    }

});
