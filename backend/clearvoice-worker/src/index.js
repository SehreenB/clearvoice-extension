export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// =========================
		// 🔍 /extract  (OCR + math) with 429 friendly response
		// =========================
		if (url.pathname === "/extract" && request.method === "POST") {
			const body = await request.json().catch(() => ({}));
			const imageBase64 = body.imageBase64 || "";
			const lang = body.lang || "English";

			if (!imageBase64) {
				return new Response(JSON.stringify({ error: "No image provided" }), {
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			const prompt = `
Extract ALL readable text from this image.

Rules:
- Preserve math expressions.
- If math is present, output valid KaTeX-compatible LaTeX.
- Do NOT explain.
- Do NOT translate.
- Output language normalization: ${lang}

Return ONLY the extracted text.
      `.trim();

			const endpoint =
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=` +
				env.GEMINI_API_KEY;

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{ text: prompt },
								{
									inlineData: {
										mimeType: "image/png",
										data: imageBase64,
									},
								},
							],
						},
					],
				}),
			});

			const data = await res.json().catch(() => ({}));

			// ✅ Graceful rate-limit handling (Gemini 429)
			if (res.status === 429) {
				const retryAfterHeader = res.headers.get("retry-after");

				// Try to parse "retryDelay":"17s" from Google's JSON
				const retryInfo = Array.isArray(data?.error?.details)
					? data.error.details.find((d) => String(d["@type"] || "").includes("RetryInfo"))
					: null;

				const retryDelayStr = retryInfo?.retryDelay; // e.g. "17s"
				const retryAfterSeconds =
					(retryAfterHeader && parseInt(retryAfterHeader, 10)) ||
					(retryDelayStr && parseInt(String(retryDelayStr).replace("s", ""), 10)) ||
					20;

				return new Response(
					JSON.stringify({
						error: "OCR rate limited",
						retryAfterSeconds,
					}),
					{
						status: 429,
						headers: {
							...corsHeaders,
							"Content-Type": "application/json",
							"Retry-After": String(retryAfterSeconds),
						},
					}
				);
			}

			if (!res.ok) {
				return new Response(
					JSON.stringify({ error: "OCR failed", details: data }),
					{
						status: 500,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				);
			}

			const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

			return new Response(JSON.stringify({ text }), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// =========================
		// 🧠 /explain (short modes)
		// =========================
		if (url.pathname === "/explain" && request.method === "POST") {
			const body = await request.json().catch(() => ({}));
			const text = body.text || "";
			const mode = body.mode || "plain_english";
			const lang = body.lang || "English";
			const tone = body.tone || "calm";

			if (!text.trim()) {
				return new Response(JSON.stringify({ error: "No text provided" }), {
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			let prompt = "";

			if (mode === "question_intent") {
				prompt = `
Answer in ${lang}.
ONE short sentence.
What is the student being asked to do?

Text:
${text}
        `.trim();
			} else if (mode === "step_by_step") {
				prompt = `
Answer in ${lang}.
Break this into at most 3 steps.
Each step is ONE short sentence.
Do NOT solve.

Text:
${text}
        `.trim();
			} else if (mode === "plain_english") {
				prompt = `
Answer in ${lang}.
Rewrite this in very simple language.
Max 4 short sentences.
Tone: ${tone}

Text:
${text}
        `.trim();
			} else if (mode === "concept_helper") {
				prompt = `
Answer in ${lang}.

Task:
1) Give up to 2 relevant concepts or formulas.
2) If math is involved, output KaTeX-compatible LaTeX inside $$...$$
3) Provide a Speakable version for reading out loud.

Format EXACTLY:

Concepts:
- <concept> — <short reason>

Math (LaTeX):
$$...$$

Speakable:
<how to say the math in words>

Rules:
- Do NOT solve
- Do NOT calculate
- Keep it short

Text:
${text}
        `.trim();
			} else {
				prompt = `
Answer in ${lang}.
Rewrite in calm, simple language. Keep it short.

Text:
${text}
        `.trim();
			}

			const endpoint =
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=` +
				env.GEMINI_API_KEY;

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
				}),
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				return new Response(JSON.stringify({ error: "Gemini error", details: data }), {
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

			return new Response(JSON.stringify({ result: output }), {
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// =========================
		// 🔊 /tts (ElevenLabs)
		// =========================
		if (url.pathname === "/tts" && request.method === "POST") {
			const body = await request.json().catch(() => ({}));
			const text = body.text || "";

			if (!text.trim()) {
				return new Response(JSON.stringify({ error: "No text provided" }), {
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			const res = await fetch(
				"https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"xi-api-key": env.ELEVENLABS_API_KEY,
						accept: "audio/mpeg",
					},
					body: JSON.stringify({
						text,
						model_id: "eleven_multilingual_v2",
					}),
				}
			);

			if (!res.ok) {
				const err = await res.text().catch(() => "");
				return new Response(JSON.stringify({ error: "TTS error", details: err }), {
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			return new Response(res.body, {
				headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
			});
		}

		return new Response("Not found", { status: 404, headers: corsHeaders });
	},
};
