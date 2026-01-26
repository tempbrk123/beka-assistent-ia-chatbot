/**
 * Beka Chat Widget Loader
 * Injects the chatbot iframe and handles resizing events.
 */
(function () {
    // Configuration
    // Auto-detect URL from the script tag itself to avoid manual configuration
    var script = document.currentScript;
    var scriptUrl = new URL(script.src);
    var WIDGET_URL = scriptUrl.origin;
    var IFRAME_ID = "beka-chat-widget-iframe";

    // Prevent duplicate injection
    if (document.getElementById(IFRAME_ID)) return;

    // Create Iframe
    var iframe = document.createElement("iframe");
    iframe.id = IFRAME_ID;
    iframe.src = WIDGET_URL;
    iframe.style.position = "fixed";
    iframe.style.bottom = "0";
    iframe.style.right = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "999999";

    // Initial Size (Launcher Button only)
    // Launcher is bottom-4 right-4, size 14 (56px) + shadow/hover space
    // We give it enough space to avoid clipping
    iframe.style.width = "100px";
    iframe.style.height = "100px";
    iframe.style.transition = "width 0.3s ease, height 0.3s ease";
    iframe.style.backgroundColor = "transparent";

    document.body.appendChild(iframe);

    // Handle Messages from Widget (Open/Close)
    window.addEventListener("message", function (event) {
        // Security check: ensure message comes from our widget
        if (event.origin !== WIDGET_URL) return;

        if (event.data === "BEKA_WIDGET_OPEN") {
            // Expand to full widget size
            // Widget is max 400px width + margins, 600px height + margins
            // We reserve slightly more space
            iframe.style.width = "450px";
            iframe.style.height = "650px";
        } else if (event.data === "BEKA_WIDGET_CLOSE") {
            // Shrink back to launcher button size
            iframe.style.width = "100px";
            iframe.style.height = "100px";
        }
    });
})();
