/**
 * ads.js
 * Handles lazy loading and rendering of live Google AdSense slots.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    function initializeAds() {
        console.log("[Ads] Ad engine initialized.");
        
        const adSlots = document.querySelectorAll('.ad-slot');
        
        // Use IntersectionObserver for lazy loading ads only when they scroll into view
        const adObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    renderAd(entry.target);
                    // Once rendered, we can stop observing it
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '200px 0px', // Load before it comes into screen
            threshold: 0.01
        });

        adSlots.forEach(slot => {
            adObserver.observe(slot);
        });
    }

    function renderAd(element) {
        const slotClasses = Array.from(element.classList);
        let adSlotId = "";
        let adFormat = "auto";
        let adType = "Unknown Slot";
        
        // Match the classes to the correct AdSense Slot IDs provided in codeads.txt
        if(slotClasses.includes('ad-header') || slotClasses.includes('ad-footer')) {
            // toolbox_horizontal
            adSlotId = "9438941740";
            adType = "Horizontal";
        } else if (slotClasses.includes('ad-sidebar')) {
            // toolbox_verticle
            adSlotId = "4228659271";
            adType = "Vertical";
        } else if (slotClasses.includes('ad-in-content')) {
            // toobox_square
            adSlotId = "8647462611";
            adType = "Square";
        }

        if (adSlotId) {
            // Remove mock styling classes so it doesn't interfere with real ad rendering
            element.style.border = "none";
            element.style.backgroundColor = "transparent";

            // Inject the real Google AdSense <ins> tag
            element.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-8663416879714051"
                     data-ad-slot="${adSlotId}"
                     data-ad-format="${adFormat}"
                     data-full-width-responsive="true"></ins>
            `;
            
            // Push the ad to be rendered by Google's script
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                element.classList.add('loaded');
                console.log(`[Ads] Rendered Live Ad: ${adType} (${adSlotId})`);
            } catch (e) {
                console.error("[Ads] Error pushing ad:", e);
            }
        }
    }

    // Initialize after a small delay to prioritize core content rendering
    setTimeout(initializeAds, 500);
});
