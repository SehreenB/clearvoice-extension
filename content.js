function getSelectedText() {
    // 1) Normal page selection
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim()) return selection;

    const el = document.activeElement;
    if (!el) return "";

    // 2) Text selected inside <textarea> or <input type="text|search|email|url|tel|password">
    const isTextInput =
        el.tagName === "TEXTAREA" ||
        (el.tagName === "INPUT" &&
            ["text", "search", "email", "url", "tel", "password"].includes(el.type));

    if (isTextInput) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        if (typeof start === "number" && typeof end === "number" && end > start) {
            return (el.value || "").substring(start, end);
        }
    }

    // 3) Contenteditable editors (best effort)
    if (el.isContentEditable) {
        const ceSel = window.getSelection()?.toString();
        if (ceSel && ceSel.trim()) return ceSel;
    }

    return "";
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "GET_SELECTION") {
        sendResponse({ selection: getSelectedText() });
    }
    return true;
});
