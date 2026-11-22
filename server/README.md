# Wear-ther try-on service (Gemini)

`gemini-tryon-worker.js` is a tiny server that makes the **"On my photo"** preview.
The website sends it the user's photo and the outfit's clothing photos. It adds the
Gemini API key (stored secretly on Cloudflare), asks Google Gemini for a picture of the
person wearing the whole outfit (shoes included), and sends the image back.

- Users are never asked for an API key, and the key is never in the website or on GitHub.
- Only the Wear-ther site can use it (other websites are refused).
- If it is not set up, or is down, the website automatically uses the free
  Hugging Face try-on instead. The "Full outfit" view always works without it.

## Cost
Gemini image generation is **not free**: about **$0.03 per preview** (Nov 2026 pricing for
`gemini-nano-banana-2.1`). 100 previews ≈ $3. Cloudflare Workers is free for this use.

## Setup (about 15 minutes, all in the browser)

### 1. Get a Gemini API key with billing
1. Go to **aistudio.google.com/apikey** and click **Create API key**.
2. Turn on billing for the key's project (AI Studio shows a **Set up billing** link).
3. Recommended: in Google Cloud Billing, add a **budget alert** (e.g. $10) so there are no surprises.
4. Copy the key. **Do not paste it into any file in this repository.**

### 2. Create the Cloudflare Worker
1. Sign up / log in at **dash.cloudflare.com** (free plan).
2. Go to **Workers & Pages → Create → Create Worker**, name it `wear-ther-tryon`, click **Deploy**.
3. Click **Edit code**, delete the sample code, paste the whole contents of
   `server/gemini-tryon-worker.js`, and click **Deploy**.

### 3. Add the key as a secret
1. In the worker, open **Settings → Variables and Secrets → Add**.
2. Type: **Secret**, Name: `GEMINI_API_KEY`, Value: your key. Save / deploy.
3. Optional (Type: Text): `ALLOWED_ORIGINS` if the site moves to another address
   (default allows `https://rafae1l.github.io` and local Live Server).

### 4. Check it works
Open the worker's address (e.g. `https://wear-ther-tryon.<your-name>.workers.dev`) in a
browser. You should see `{"ok":true,"service":"wear-ther try-on"}`.

### 5. Connect the website
In `app.js`, set the worker's address (it is not a secret):
```js
const TRYON_PROXY_URL = "https://wear-ther-tryon.<your-name>.workers.dev";
```
Commit and push to `main`. The live site will use Gemini for "On my photo".

## Error messages users may see
| Message | Meaning | Fix |
|---|---|---|
| "needs billing turned on" | Key's project has no billing | Step 1.2 |
| "Gemini key is not valid" | Wrong/deleted key | Re-add the secret (step 3) |
| "over its usage limit" | Google rate/quota limit | Wait, or raise the quota |
| "This site is not allowed" | Site address not in `ALLOWED_ORIGINS` | Step 3.3 |

If Google renames the model, add a Text variable `GEMINI_MODEL` with the new name.
