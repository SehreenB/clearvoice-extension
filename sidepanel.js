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

    if (!tab || !tab.id) {
        alert("No active tab found");
        return;
    }

    chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_SELECTION" },
        (response) => {
            if (chrome.runtime.lastError) {
                alert("Content script not responding. Reload the page and try again.");
                return;
            }

            if (!response || !response.selection.trim()) {
                alert("No text selected. Highlight some text first.");
                return;
            }

            input.value = response.selection;
        }
    );
});
