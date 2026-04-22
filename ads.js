/**
 * ads.js
 * Handles lazy loading and mock rendering of Google Ads placeholders.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Simulate fetching ad config/script dynamically
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
            rootMargin: '100px 0px', // Load slightly before it comes into screen
            threshold: 0.1
        });

        adSlots.forEach(slot => {
            // For the mock, we will just add a visual placeholder
            adObserver.observe(slot);
        });
    }

    function renderAd(element) {
        // In a real scenario, this is where you'd call googletag.display(id) or push to adsbygoogle array.
        // For this demo, we just populate the div with text showing it resolved.
        
        const slotClasses = Array.from(element.classList);
        let adType = "Unknown Slot";
        
        if(slotClasses.includes('ad-header')) adType = "Header Ad Banner (728x90)";
        else if (slotClasses.includes('ad-sidebar')) adType = "Sidebar Ad Unit";
        else if (slotClasses.includes('ad-in-content')) adType = "In-Content Responsive Ad";
        else if (slotClasses.includes('ad-footer')) adType = "Footer Ad Banner";

        // Add a small delay to simulate network request latency
        setTimeout(() => {
            element.innerHTML = `<span>${adType}</span>`;
            element.classList.add('loaded'); // Can use this class to trigger CSS transitions
        }, 500);
        
        console.log(`[Ads] Rendered: ${adType}`);
    }

    // Initialize after a small delay to prioritize core content rendering
    setTimeout(initializeAds, 1000);
});
