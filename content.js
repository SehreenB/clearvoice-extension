chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_SELECTION") {
        const selection = window.getSelection().toString();
        sendResponse({ selection });
    }
    return true;
});
