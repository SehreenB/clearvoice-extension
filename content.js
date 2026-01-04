function getSelectedText() {
    const selection = window.getSelection?.()?.toString();
    if (selection && selection.trim()) return selection.trim();

    const el = document.activeElement;
    if (!el) return "";

    const isTextInput =
        el.tagName === "TEXTAREA" ||
        (el.tagName === "INPUT" &&
            ["text", "search", "email", "url", "tel", "password"].includes(el.type));

    if (isTextInput) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (typeof start === "number" && typeof end === "number" && end > start) {
            return (el.value || "").substring(start, end).trim();
        }
    }

    if (el.isContentEditable) {
        const ceSel = window.getSelection?.()?.toString();
        if (ceSel && ceSel.trim()) return ceSel.trim();
    }

    return "";
}

let snipActive = false;

function startSnip() {
    return new Promise((resolve) => {
        if (snipActive) return resolve({ cancelled: true });

        snipActive = true;

        const prevOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";

        const overlay = document.createElement("div");
        overlay.id = "__clearvoice_snip_overlay__";
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.zIndex = "2147483647";
        overlay.style.cursor = "crosshair";
        overlay.style.background = "rgba(0,0,0,0.10)";
        overlay.style.userSelect = "none";

        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.border = "2px solid #34d399";
        box.style.background = "rgba(52,211,153,0.14)";
        box.style.borderRadius = "8px";
        box.style.display = "none";
        overlay.appendChild(box);

        let startX = 0, startY = 0;
        let endX = 0, endY = 0;
        let dragging = false;

        function cleanup() {
            try { overlay.remove(); } catch { }
            document.documentElement.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKeyDown, true);
            window.removeEventListener("mousemove", onMove, true);
            window.removeEventListener("mouseup", onUp, true);
            window.removeEventListener("blur", onBlur, true);
            snipActive = false;
        }

        function onKeyDown(e) {
            if (e.key === "Escape") {
                cleanup();
                resolve({ cancelled: true });
            }
        }

        function onBlur() {
            cleanup();
            resolve({ cancelled: true });
        }

        function onDown(e) {
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            endX = startX;
            endY = startY;

            box.style.display = "block";
            box.style.left = `${startX}px`;
            box.style.top = `${startY}px`;
            box.style.width = `0px`;
            box.style.height = `0px`;
        }

        function onMove(e) {
            if (!dragging) return;

            endX = e.clientX;
            endY = e.clientY;

            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const w = Math.abs(endX - startX);
            const h = Math.abs(endY - startY);

            box.style.left = `${x}px`;
            box.style.top = `${y}px`;
            box.style.width = `${w}px`;
            box.style.height = `${h}px`;
        }

        function onUp() {
            if (!dragging) return;
            dragging = false;

            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const w = Math.abs(endX - startX);
            const h = Math.abs(endY - startY);

            cleanup();

            if (w < 10 || h < 10) {
                resolve({ cancelled: true });
                return;
            }

            resolve({
                x, y, w, h,
                cancelled: false,
                devicePixelRatio: window.devicePixelRatio || 1
            });
        }

        overlay.addEventListener("mousedown", onDown, { capture: true });

        window.addEventListener("mousemove", onMove, true);
        window.addEventListener("mouseup", onUp, true);
        window.addEventListener("keydown", onKeyDown, true);
        window.addEventListener("blur", onBlur, true);

        document.documentElement.appendChild(overlay);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "GET_SELECTION") {
        sendResponse({ selection: getSelectedText() });
        return true;
    }

    if (message?.type === "START_SNIP") {
        startSnip().then((rect) => sendResponse(rect));
        return true;
    }

    return false;
});
