/**
 * ads.js — Ad Manager (Google AdSense + Adsterra)
 *
 * SLOT LAYOUT (per page):
 * ─────────────────────────────────────────────────────────────────
 *  📌 #ad-header          → AdSense Horizontal  (slot: 4359928318)
 *  📌 #ad-sidebar-left    → AdSense Vertical    (slot: 3046846648)
 *  📌 #ad-sidebar-right   → AdSense Vertical    (slot: 3046846648)
 *  📌 1st .ad-in-content  → AdSense Horizontal  (slot: 4359928318)
 *  📌 2nd .ad-in-content  → Adsterra Native Banner
 *
 *  All remaining .ad-slot divs are collapsed to zero.
 * ─────────────────────────────────────────────────────────────────
 */

const ADSENSE_CLIENT  = 'ca-pub-3463984380249560';
const SLOT_HORIZONTAL = '4359928318';
const SLOT_VERTICAL   = '3046846648';

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Header — AdSense Horizontal ───────────────────────────
    injectAdsense('ad-header', SLOT_HORIZONTAL, 'Header Horizontal');

    // ── 2. Left Sidebar — AdSense Vertical ───────────────────────
    injectAdsense('ad-sidebar-left', SLOT_VERTICAL, 'Left Sidebar Vertical');

    // ── 3. Right Sidebar — AdSense Vertical ──────────────────────
    injectAdsense('ad-sidebar-right', SLOT_VERTICAL, 'Right Sidebar Vertical');

    // ── 4 & 5. In-Content slots ───────────────────────────────────
    let inContentCount = 0;
    const allSlots = document.querySelectorAll('.ad-slot');

    allSlots.forEach(slot => {

        // Skip header & sidebar — already handled above
        if (
            slot.id === 'ad-header' ||
            slot.id === 'ad-sidebar-left' ||
            slot.id === 'ad-sidebar-right'
        ) return;

        // Collapse footer slots
        if (slot.classList.contains('ad-footer')) {
            collapseSlot(slot);
            return;
        }

        if (slot.classList.contains('ad-in-content')) {
            inContentCount++;

            if (inContentCount === 1) {
                // In-Content 1 → AdSense Horizontal (lazy)
                lazyLoad(slot, () => {
                    injectAdsenseInto(slot, SLOT_HORIZONTAL, 'In-Content 1 Horizontal');
                });

            } else if (inContentCount === 2) {
                // In-Content 2 → Adsterra Native Banner (lazy)
                lazyLoad(slot, () => {
                    injectAdsterra(slot);
                });

            } else {
                // All extra in-content slots → collapse
                collapseSlot(slot);
            }
        }
    });

});

// ── Lazy-load helper (IntersectionObserver) ───────────────────────
function lazyLoad(el, callback) {
    const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback();
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '250px 0px', threshold: 0.01 });
    obs.observe(el);
}

// ── Inject AdSense by element ID ─────────────────────────────────
function injectAdsense(elementId, slotId, label) {
    const el = document.getElementById(elementId);
    if (!el) return;
    injectAdsenseInto(el, slotId, label);
}

// ── Build AdSense <ins> and push ─────────────────────────────────
function injectAdsenseInto(el, slotId, label) {
    el.innerHTML = '';
    el.style.cssText = 'display:block;overflow:visible;min-height:60px;background:transparent;border:none;text-align:center;';

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient  = ADSENSE_CLIENT;
    ins.dataset.adSlot    = slotId;
    ins.dataset.adFormat  = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    el.appendChild(ins);

    try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`[Ads] ✅ AdSense → ${label} (slot ${slotId})`);
    } catch (e) {
        console.warn(`[Ads] ⚠️ AdSense push error (${label}):`, e);
    }
}

// ── Inject Adsterra Native Banner ─────────────────────────────────
function injectAdsterra(el) {
    el.innerHTML = '';
    el.style.cssText = 'display:block;overflow:visible;min-height:100px;background:transparent;border:none;text-align:center;';

    // Adsterra requires its container div to exist BEFORE the script loads
    const container = document.createElement('div');
    container.id = 'container-e4afa7a018eee0d6bec2ec105afde9dd';
    el.appendChild(container);

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl29385278.effectivecpmnetwork.com/e4afa7a018eee0d6bec2ec105afde9dd/invoke.js';
    el.appendChild(script);

    console.log('[Ads] ✅ Adsterra → In-Content 2');
}

// ── Collapse unused slots ─────────────────────────────────────────
function collapseSlot(el) {
    el.style.cssText = 'display:none!important;height:0;min-height:0;margin:0;padding:0;border:none;overflow:hidden;';
}
