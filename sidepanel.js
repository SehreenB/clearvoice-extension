const input = document.getElementById("input");
const output = document.getElementById("output");

const useSelectionBtn = document.getElementById("useSelectionBtn");
const snipBtn = document.getElementById("snipBtn");

const speakBtn = document.getElementById("speakBtn");
const stopBtn = document.getElementById("stopBtn");
const langSelect = document.getElementById("langSelect");

const API_BASE = "http://localhost:8787";

let lastExplanationText = "";
let audioObjUrl = null;
let audio = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- UI translations ---------- */
const UI = {
    English: {
        subtitle: "Less text. More clarity.",
        input: "Input",
        tools: "Student tools",
        lang: "Language",
        output: "Output",
        useSel: "Use Selected Text",
        snip: "Snip Screenshot",
        ask: "What is this asking?",
        steps: "Break into steps",
        plain: "Plain English",
        concept: "Which concept?",
        read: "Read it to me",
        stop: "Stop",
        thinking: "Thinking…",
        extracting: "Extracting text from screenshot…",
        noText: "Select or paste text first."
    },
    French: {
        subtitle: "Moins de texte. Plus clair.",
        input: "Entrée",
        tools: "Outils étudiants",
        lang: "Langue",
        output: "Sortie",
        useSel: "Utiliser le texte sélectionné",
        snip: "Capture (snip)",
        ask: "Que demande-t-on ?",
        steps: "Découper en étapes",
        plain: "Français simple",
        concept: "Quel concept ?",
        read: "Lis-le moi",
        stop: "Stop",
        thinking: "Réflexion…",
        extracting: "Extraction du texte…",
        noText: "Sélectionne ou colle du texte d’abord."
    },
    Spanish: {
        subtitle: "Menos texto. Más claridad.",
        input: "Entrada",
        tools: "Herramientas para estudiantes",
        lang: "Idioma",
        output: "Salida",
        useSel: "Usar texto seleccionado",
        snip: "Captura (snip)",
        ask: "¿Qué pide esto?",
        steps: "Dividir en pasos",
        plain: "Español simple",
        concept: "¿Qué concepto?",
        read: "Léemelo",
        stop: "Parar",
        thinking: "Pensando…",
        extracting: "Extrayendo texto…",
        noText: "Selecciona o pega texto primero."
    },
    "Mandarin Chinese": {
        subtitle: "更少文字，更清晰。",
        input: "输入",
        tools: "学生工具",
        lang: "语言",
        output: "输出",
        useSel: "使用选中文本",
        snip: "截图识别",
        ask: "题目在问什么？",
        steps: "分成步骤",
        plain: "简单表达",
        concept: "用哪个概念？",
        read: "读给我听",
        stop: "停止",
        thinking: "思考中…",
        extracting: "正在识别文字…",
        noText: "请先选中或粘贴文本。"
    },
    "Punjabi (Gurmukhi)": {
        subtitle: "ਘੱਟ ਲਿਖਤ, ਵੱਧ ਸਾਫ਼ੀ।",
        input: "ਇਨਪੁੱਟ",
        tools: "ਵਿਦਿਆਰਥੀ ਟੂਲ",
        lang: "ਭਾਸ਼ਾ",
        output: "ਆਉਟਪੁੱਟ",
        useSel: "ਚੁਣਿਆ ਟੈਕਸਟ ਵਰਤੋ",
        snip: "ਸਕ੍ਰੀਨਸ਼ਾਟ (ਸਨਿਪ)",
        ask: "ਇਹ ਕੀ ਪੁੱਛ ਰਿਹਾ ਹੈ?",
        steps: "ਕਦਮਾਂ ਵਿੱਚ ਤੋੜੋ",
        plain: "ਸਰਲ ਭਾਸ਼ਾ",
        concept: "ਕਿਹੜਾ ਕਾਨਸੈਪਟ?",
        read: "ਮੈਨੂੰ ਸੁਣਾ ਦਿਓ",
        stop: "ਰੋਕੋ",
        thinking: "ਸੋਚ ਰਹੇ ਹਾਂ…",
        extracting: "ਟੈਕਸਟ ਕੱਢ ਰਹੇ ਹਾਂ…",
        noText: "ਪਹਿਲਾਂ ਟੈਕਸਟ ਚੁਣੋ ਜਾਂ ਪੇਸਟ ਕਰੋ।"
    }
};

function currentUILangKey() {
    const v = langSelect.value;
    return UI[v] ? v : "English";
}
function t(key) {
    return UI[currentUILangKey()][key] || UI.English[key] || key;
}
function applyUI() {
    document.getElementById("subtitle").textContent = t("subtitle");
    document.getElementById("lblInput").textContent = t("input");
    document.getElementById("lblTools").textContent = t("tools");
    document.getElementById("lblLang").textContent = t("lang");
    document.getElementById("lblOutput").textContent = t("output");

    useSelectionBtn.textContent = t("useSel");
    snipBtn.textContent = t("snip");

    document.getElementById("btnAsk").textContent = t("ask");
    document.getElementById("btnSteps").textContent = t("steps");
    document.getElementById("btnPlain").textContent = t("plain");
    document.getElementById("btnConcept").textContent = t("concept");

    speakBtn.textContent = t("read");
    stopBtn.textContent = t("stop");
}
langSelect.addEventListener("change", applyUI);
applyUI();

/* ---------- Equation “photo” rendering ---------- */
function latexToImgUrl(latex) {
    const cleaned = String(latex || "").trim();
    const encoded = encodeURIComponent(`\\dpi{200} ${cleaned}`);
    return `https://latex.codecogs.com/png.image?${encoded}`;
}

function renderOutput(text) {
    const raw = String(text ?? "");

    // Escape HTML first
    let html = raw
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    // Replace $$...$$ blocks with images
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner) => {
        const url = latexToImgUrl(inner);
        return `\n<div style="margin:10px 0;">
      <img src="${url}" alt="equation" style="max-width:100%; height:auto;" />
    </div>\n`;
    });

    // Preserve readable newlines for normal text
    html = html.replaceAll("\n", "<br>");
    output.innerHTML = html;
}

function setStatus(msg) { renderOutput(msg); }

/* ---------- Speakable extraction ---------- */
function getSpeakable(fullText) {
    const match = String(fullText).match(/Speakable:\s*([\s\S]*)$/i);
    if (match && match[1]) return match[1].trim();

    return String(fullText)
        .replace(/\$\$[\s\S]*?\$\$/g, "")
        .replace(/\$[\s\S]*?\$/g, "")
        .trim();
}

/* ---------- Audio helpers ---------- */
function cleanupAudio() {
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
    }
    if (audioObjUrl) {
        URL.revokeObjectURL(audioObjUrl);
        audioObjUrl = null;
    }
    stopBtn.disabled = true;
}

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function getSelectionWithFallback(tabId) {
    const msgResp = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" }, (resp) => {
            if (chrome.runtime.lastError) return resolve(null);
            resolve(resp);
        });
    });

    if (msgResp?.selection?.trim()) return msgResp.selection.trim();

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const sel = window.getSelection?.()?.toString();
                if (sel && sel.trim()) return sel.trim();

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
        });

        return (result || "").trim();
    } catch {
        return "";
    }
}

/* ---------- Selected Text ---------- */
useSelectionBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return alert("No active tab found.");

    const selection = await getSelectionWithFallback(tab.id);

    if (!selection) {
        alert("No text found.\n\nIf this is a PDF or an equation/image, use “Snip Screenshot”.");
        return;
    }

    input.value = selection;
});

/* ---------- Snip Screenshot -> Worker /extract (retry on 429) ---------- */
snipBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return alert("No active tab found.");

    snipBtn.disabled = true;

    try {
        const rect = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { type: "START_SNIP" }, (resp) => {
                if (chrome.runtime.lastError) return resolve({ cancelled: true });
                resolve(resp);
            });
        });

        if (!rect || rect.cancelled) return;

        setStatus(t("extracting"));

        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((r) => (img.onload = r));

        const dpr = rect.devicePixelRatio || 1;
        const sx = rect.x * dpr;
        const sy = rect.y * dpr;
        const sw = rect.w * dpr;
        const sh = rect.h * dpr;

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(sw));
        canvas.height = Math.max(1, Math.floor(sh));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        const croppedDataUrl = canvas.toDataURL("image/png");
        const base64 = croppedDataUrl.split(",")[1];

        const callExtract = async () =>
            fetch(`${API_BASE}/extract`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64, lang: langSelect.value })
            });

        let res = await callExtract();

        if (res.status === 429) {
            const d429 = await res.json().catch(() => ({}));
            const waitSec = d429.retryAfterSeconds || 20;
            setStatus(`⏳ OCR is rate-limited. Retrying in ${waitSec}s…`);
            await sleep(waitSec * 1000);
            res = await callExtract();
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            if (res.status === 429) {
                setStatus("⛔ OCR quota limit hit. Try again later, or use text highlight instead.");
            } else {
                setStatus("Error from /extract:\n" + JSON.stringify(data, null, 2));
            }
            return;
        }

        const extracted = (data.text || "").trim();
        if (!extracted) {
            setStatus("No text detected. Try a tighter snip or zoom in.");
            return;
        }

        input.value = extracted;
        setStatus("✅ Text captured. Now choose a student tool.");
    } catch (e) {
        setStatus("Snip failed:\n" + String(e));
    } finally {
        snipBtn.disabled = false;
    }
});

/* ---------- Explain modes ---------- */
async function runExplain(mode) {
    const text = input.value.trim();
    if (!text) {
        alert(t("noText"));
        return;
    }

    cleanupAudio();
    speakBtn.disabled = true;
    setStatus(t("thinking"));

    try {
        const res = await fetch(`${API_BASE}/explain`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, mode, lang: langSelect.value, tone: "calm" })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setStatus("Error from /explain:\n" + JSON.stringify(data, null, 2));
            return;
        }

        lastExplanationText = (data.result || "").trim();
        setStatus(lastExplanationText || "No result.");
        speakBtn.disabled = !lastExplanationText;
    } catch (e) {
        setStatus("Failed to call /explain. Is your Worker running?\n\n" + String(e));
    }
}

document.querySelectorAll("button[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => runExplain(btn.dataset.mode));
});

/* ---------- TTS (Speakable) ---------- */
speakBtn.addEventListener("click", async () => {
    if (!lastExplanationText) return;

    cleanupAudio();
    speakBtn.disabled = true;
    stopBtn.disabled = false;

    const speakText = getSpeakable(lastExplanationText);
    setStatus(lastExplanationText + "\n\nGenerating audio…");

    try {
        const res = await fetch(`${API_BASE}/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: speakText })
        });

        if (!res.ok) {
            const err = await res.text().catch(() => "");
            setStatus(lastExplanationText + "\n\nError from /tts:\n" + err);
            stopBtn.disabled = true;
            speakBtn.disabled = false;
            return;
        }

        const blob = await res.blob();
        audioObjUrl = URL.createObjectURL(blob);

        audio = new Audio(audioObjUrl);
        audio.onended = () => {
            stopBtn.disabled = true;
            speakBtn.disabled = false;
        };
        await audio.play();

        setStatus(lastExplanationText + "\n\n🔊 Playing audio.");
    } catch (e) {
        setStatus(lastExplanationText + "\n\nFailed to call /tts:\n" + String(e));
        stopBtn.disabled = true;
    } finally {
        if (!audio) speakBtn.disabled = false;
    }
});

stopBtn.addEventListener("click", () => {
    cleanupAudio();
    speakBtn.disabled = !lastExplanationText;
});
