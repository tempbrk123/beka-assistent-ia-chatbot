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
    iframe.style.bottom = "80px"; // Above mobile nav bar

    // Initial Size (Launcher Button only)
    // Launcher button is ~60px with margins, needs space for pulse effect
    iframe.style.width = "120px";
    iframe.style.height = "120px";
    iframe.style.transition = "width 0.3s ease, height 0.3s ease";
    iframe.style.backgroundColor = "transparent";
    iframe.style.pointerEvents = "auto"; // Allow clicks on launcher

    document.body.appendChild(iframe);

    /**
     * Envia os dados da Shopify para o iframe via postMessage
     */
    function sendShopifyDataToWidget() {
        if (window.BekaAppData && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: "BEKA_SHOPIFY_DATA",
                payload: window.BekaAppData
            }, WIDGET_URL);
            console.log("[Beka] Dados da Shopify enviados para o widget:", window.BekaAppData);
        }
    }

    // Quando o iframe carregar, enviar os dados da Shopify
    iframe.onload = function () {
        // Tentar enviar imediatamente
        sendShopifyDataToWidget();

        // Se BekaAppData ainda não existir, tentar novamente algumas vezes
        var attempts = 0;
        var maxAttempts = 10;
        var interval = setInterval(function () {
            attempts++;
            if (window.BekaAppData) {
                sendShopifyDataToWidget();
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.log("[Beka] BekaAppData não encontrado após " + maxAttempts + " tentativas");
            }
        }, 500);
    };

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
            iframe.style.pointerEvents = "auto"; // Allow interaction with chat
            iframe.style.transform = "";
        } else if (event.data === "BEKA_WIDGET_CLOSE") {
            // Shrink back to launcher button size
            iframe.style.width = "120px";
            iframe.style.height = "120px";
            iframe.style.pointerEvents = "auto"; // Keep launcher clickable
            iframe.style.transform = "";
        } else if (event.data === "BEKA_REQUEST_SHOPIFY_DATA") {
            // Widget is requesting the Shopify data
            sendShopifyDataToWidget();
        }
    });
})();
