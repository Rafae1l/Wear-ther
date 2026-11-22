// Wear-ther try-on proxy (Cloudflare Worker).
//
// The website sends the user's photo + the outfit's clothing photos here.
// This worker adds the secret Gemini API key (stored in Cloudflare, never in
// the website or GitHub), asks Google Gemini for a picture of the person
// wearing the outfit, and sends the image back.
//
// Settings (Cloudflare dashboard -> Worker -> Settings -> Variables and Secrets):
//   GEMINI_API_KEY   (Secret, required)  key from aistudio.google.com/apikey (billing on)
//   ALLOWED_ORIGINS  (Text, optional)    comma-separated sites allowed to call this worker
//   GEMINI_MODEL     (Text, optional)    defaults to DEFAULT_MODEL below
//
// Request:  POST /tryon  { person: {mimeType, data}, garments: [{category, name, color, mimeType, data}] }
// Response: 200 { image: {mimeType, data} }   or   4xx/5xx { error: "<code>", message: "<text>" }

const DEFAULT_MODEL = "gemini-nano-banana-2.1";
const DEFAULT_ORIGINS = [
  "https://rafae1l.github.io",
  "http://localhost:5500", "http://127.0.0.1:5500",   // VS Code Live Server
  "http://localhost:8000", "http://127.0.0.1:8000"    // python -m http.server
];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TIMEOUT_MS = 90000;
const MAX_IMAGE_BASE64 = 6 * 1024 * 1024; // ~4.5 MB per image
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const CATEGORIES = ["top", "bottom", "outerwear", "shoes"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",") : DEFAULT_ORIGINS)
      .map(s => s.trim()).filter(Boolean);
    const originOk = allowed.includes(origin);
    const cors = originOk ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    } : { "Vary": "Origin" };
    const reply = (status, body) => new Response(JSON.stringify(body), {
      status, headers: { "Content-Type": "application/json", ...cors }
    });

    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && path === "/") return reply(200, { ok: true, service: "wear-ther try-on" });
    if (request.method !== "POST" || path !== "/tryon") return reply(404, { error: "not_found", message: "Use POST /tryon." });
    // Only the Wear-ther site may use this worker (stops other websites spending the key).
    if (!originOk) return reply(403, { error: "forbidden", message: "This site is not allowed to use the try-on service." });
    if (!env.GEMINI_API_KEY) return reply(500, { error: "not_configured", message: "The try-on service has no API key set up yet." });

    let body;
    try { body = await request.json(); } catch { return reply(400, { error: "bad_request", message: "Invalid JSON." }); }
    const problem = validate(body);
    if (problem) return reply(400, { error: "bad_request", message: problem });

    try {
      const image = await generateTryOn(env, body.person, body.garments);
      return reply(200, { image });
    } catch (err) {
      const status = { auth: 502, quota: 429, blocked: 422, busy: 503, no_image: 502 }[err.code] || 502;
      return reply(status, { error: err.code || "busy", message: err.message });
    }
  }
};

function isImage(img) {
  return img && typeof img === "object" && ALLOWED_MIME.includes(img.mimeType) &&
    typeof img.data === "string" && img.data.length > 0 && img.data.length <= MAX_IMAGE_BASE64 &&
    /^[A-Za-z0-9+/=]+$/.test(img.data.slice(0, 200));
}

function validate(body) {
  if (!body || typeof body !== "object") return "Missing request body.";
  if (!isImage(body.person)) return "The person photo is missing or too large.";
  if (!Array.isArray(body.garments) || body.garments.length === 0 || body.garments.length > 4) {
    return "Send between 1 and 4 clothing pieces.";
  }
  for (const g of body.garments) {
    if (!isImage(g) || !CATEGORIES.includes(g.category)) return "A clothing photo is missing, too large, or has an unknown category.";
  }
  return null;
}

function clean(text) {
  return String(text || "").replace(/[^\w\s\-'&,.()]/g, "").slice(0, 60);
}

function buildPrompt(garments) {
  const list = garments
    .map((g, i) => `Image ${i + 2}: ${g.category} - "${clean(g.name)}" (${clean(g.color)})`)
    .join("\n");
  return [
    "Virtual try-on.",
    "Image 1 is a photo of a person. The other images are clothing items from their own closet:",
    list,
    "",
    "Create one realistic, full-body photo of the SAME person from image 1 wearing exactly these clothing items, including the shoes.",
    "Keep their face, hair, skin tone, body shape and pose the same.",
    "Keep each item's color, pattern and style the same as in its photo.",
    "Replace whatever they are currently wearing with these items. Do not add other clothing, accessories, logos or text.",
    "Show the whole body from head to feet. Use a plain, light studio background with soft, natural lighting."
  ].join("\n");
}

class TryOnError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function callGemini(url, apiKey, extraHeaders, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey, ...extraHeaders },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    throw new TryOnError("busy", err.name === "AbortError" ? "Gemini took too long to respond." : "Could not reach Gemini.");
  } finally {
    clearTimeout(timer);
  }
  if (response.ok) return response.json();

  let detail = "";
  try { detail = ((await response.json()).error || {}).message || ""; } catch { /* not JSON */ }
  if (response.status === 401 || response.status === 403 || (response.status === 400 && /api key|API_KEY/i.test(detail))) {
    throw new TryOnError("auth", "The try-on service's Gemini key is not valid or has no access.");
  }
  if (response.status === 429) {
    throw new TryOnError("quota", /limit:\s*0\b|free[_ ]?tier|billing/i.test(detail)
      ? "Gemini image generation needs billing turned on for the key's project."
      : "The try-on service is over its usage limit. Try again later.");
  }
  const err = new TryOnError("busy", `Gemini returned an error (${response.status}).`);
  err.canFallback = response.status === 400 || response.status === 404 || response.status >= 500;
  throw err;
}

// Find the first image in any Gemini response shape (Interactions API or generateContent).
function findImage(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) { const found = findImage(child); if (found) return found; }
    return null;
  }
  const inline = node.inlineData || node.inline_data;
  if (inline && inline.data) return { mimeType: inline.mimeType || inline.mime_type || "image/png", data: inline.data };
  if (node.type === "image" && typeof node.data === "string" && node.data.length > 100) {
    return { mimeType: node.mime_type || node.mimeType || "image/png", data: node.data };
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") { const found = findImage(value); if (found) return found; }
  }
  return null;
}

async function generateTryOn(env, person, garments) {
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = buildPrompt(garments);
  const images = [person, ...garments];

  let result;
  try {
    // Current Gemini endpoint ("Interactions").
    result = await callGemini(`${GEMINI_API_BASE}/interactions`, env.GEMINI_API_KEY, { "Api-Revision": "2026-05-20" }, {
      model,
      input: [{ type: "text", text: prompt }, ...images.map(img => ({ type: "image", mime_type: img.mimeType, data: img.data }))],
      response_format: { type: "image", aspect_ratio: "3:4" }
    });
  } catch (err) {
    if (!err.canFallback) throw err;
    // Older, widely supported endpoint.
    result = await callGemini(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, env.GEMINI_API_KEY, {}, {
      contents: [{ role: "user", parts: [{ text: prompt }, ...images.map(img => ({ inline_data: { mime_type: img.mimeType, data: img.data } }))] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "3:4" } }
    });
  }

  const image = findImage(result);
  if (image) return image;
  const blocked = (result && result.promptFeedback && result.promptFeedback.blockReason) ||
    /SAFETY|PROHIBITED|BLOCK/i.test(JSON.stringify((result && result.candidates) || []).slice(0, 2000));
  throw blocked
    ? new TryOnError("blocked", "Gemini declined this photo. Try a clear, full-body photo.")
    : new TryOnError("no_image", "Gemini replied without an image. Please try again.");
}
