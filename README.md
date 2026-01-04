# ClearVoice

ClearVoice is a Chrome extension built to help students understand confusing questions before they start solving them.

A lot of study tools either give long explanations or jump straight to answers. ClearVoice does the opposite, it keeps things short and focuses on clarity.

---

## What it does

ClearVoice helps students make sense of dense academic text, questions, and equations.

You can:
- Highlight text on a website, or  
- Use **Snip Screenshot** to capture PDFs, images, or math problems that can’t be selected

Once text is captured, ClearVoice offers a few simple tools:
- **What is this asking?** – explains the goal of the question in one sentence  
- **Break into steps** – breaks the task into simple steps without solving it  
- **Plain English** – rewrites complex text into very simple language  
- **Which concept?** – points out the main concept or formula involved  

The goal is not to solve problems for students, but to help them understand what they’re looking at.

---

## Language support

ClearVoice supports multiple languages:
- English  
- French  
- Spanish  
- Mandarin   
- Punjabi 

Both the interface and the explanations adjust to the selected language.

---

## Read it out loud

ClearVoice can read explanations out loud using natural voice synthesis.  
This helps with accessibility, focus, and learning in a second language.

---

## How it’s built

ClearVoice is a Chrome extension with a side panel interface.

- The frontend is built with JavaScript, HTML, and CSS  
- A custom snip overlay allows users to capture part of the screen without disrupting their workflow  
- The backend runs on Cloudflare Workers  
- Google Gemini is used for text understanding, OCR, and explanations  
- ElevenLabs handles text-to-speech  

Everything is designed to be fast, simple, and easy to use.

---

## Why we built it

We noticed that many students struggle not because they don’t know the material, but because questions are written in a way that’s hard to understand.

ClearVoice is meant to reduce that friction especially for:
- Students working with PDFs and images  
- Math-heavy courses  
- Multilingual learners  
- Anyone who benefits from hearing explanations out loud  

---

## What’s next

Some ideas we’d like to explore:
- Saving past explanations for offline use  
- Better support for math-heavy content (without solving)  
- Classroom and exam-prep modes  
- Publishing to the Chrome Web Store and gathering student feedback  

---

ClearVoice is about understanding first, solving comes second.
