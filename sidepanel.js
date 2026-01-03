const input = document.getElementById("input");
const useSelectionBtn = document.getElementById("useSelectionBtn");
const testBtn = document.getElementById("testBtn");

testBtn.addEventListener("click", () => {
    alert("✅ Side panel is working");
});

useSelectionBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id) {
        alert("No active tab found.");
        return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, (response) => {
        if (chrome.runtime.lastError) {
            alert(
                "Couldn’t read selection on this page. Try refreshing the page, or ensure the extension has access."
            );
            return;
        }

        const selection = response?.selection || "";
        if (!selection.trim()) {
            alert(
                "No text detected. Highlight text on the page (not an image). Some sites may block selection."
            );
            return;
        }

        input.value = selection;
    });
});
