# Reddit Verifier V3

A browser-based PWA that fact-checks Reddit posts using AI. No Python, no server — everything runs in the browser. A small Cloudflare Worker acts as a proxy for the two calls browsers can't make directly (Reddit fetching and page scraping).

---

## What you need before setup

Three things are required:

| Item | Where to get it | Free tier |
|------|----------------|-----------|
| Anthropic API key | [console.anthropic.com](https://console.anthropic.com) | Pay-per-use (no free tier) |
| Tavily API key | [app.tavily.com](https://app.tavily.com) | 1,000 searches/month free |
| Cloudflare Worker URL | Deploy `worker.js` yourself (5 min) | 100,000 requests/day free |

---

## Step 1 — Get your Anthropic API key

The app calls the Claude API directly from your browser to extract and evaluate claims.

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in (or create an account).
2. Click **API Keys** in the left sidebar.
3. Click **Create Key**, give it a name (e.g. `RedVerifier`), and copy the key.

The key starts with `sk-ant-`. Store it somewhere safe — Anthropic only shows it once.

**Cost:** The app uses Claude Haiku for triage and Claude Sonnet for deep evaluation. A typical fact-check run costs $0.05–$0.30 depending on the number of claims. You need a funded account or active free trial credits.

---

## Step 2 — Get your Tavily API key

The app uses Tavily to search for evidence for each claim. Tavily supports direct browser calls (no proxy needed).

1. Go to [app.tavily.com](https://app.tavily.com) and sign up.
2. After logging in, your API key is shown on the dashboard.
3. Copy the key — it starts with `tvly-`.

**Free tier:** 1,000 searches/month. Each fact-check run uses roughly one search per claim extracted.

---

## Step 3 — Deploy the Cloudflare Worker

The Worker is a ~50-line script that proxies two types of requests your browser can't make directly: Reddit's JSON API (blocked by CORS) and arbitrary web pages (blocked by CORS). It runs on Cloudflare's edge network at no cost within the free tier.

### Create a free Cloudflare account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up. No domain or credit card required for the Workers free tier.

### Deploy the Worker

1. In the Cloudflare dashboard, click **Workers & Pages** in the left sidebar.
2. Click **Create** and then **Create Worker**.
3. Give the Worker a name — for example, `redverifier-proxy`. This name becomes part of your Worker URL.
4. Click **Deploy** to save the placeholder, then click **Edit code**.
5. Delete all the default code in the editor.
6. Open `worker.js` from this folder and paste its entire contents into the editor.
7. Click **Deploy** again.

Your Worker URL will be:
```
https://redverifier-proxy.<your-subdomain>.workers.dev
```

The subdomain is auto-assigned to your Cloudflare account. You can see the full URL at the top of the Worker editor after deploying.

### Verify it works

Open this URL in your browser — you should get `{"error":"Not found"}`:
```
https://redverifier-proxy.<your-subdomain>.workers.dev/
```

And this should return `{"status":"ok"}`:
```
https://redverifier-proxy.<your-subdomain>.workers.dev/health
```

---

## Step 4 — Open the app and enter your keys

1. Open `index.html` in your browser. On first launch you'll see the setup screen.
2. Fill in:
   - **Anthropic API Key** — the `sk-ant-...` key from Step 1
   - **Tavily API Key** — the `tvly-...` key from Step 2
   - **Worker URL** — the full `https://...workers.dev` URL from Step 3
   - **Reddit Username** — your Reddit username (without `u/`), used in the API request User-Agent header
3. Click **Save & Continue**.

Keys are stored in `localStorage` on your device only. Nothing is sent to any server other than the respective APIs (Anthropic and Tavily receive their keys directly; the Worker only ever sees Reddit URLs and page URLs to scrape).

---

## Hosting the app (optional)

The app is a static site — just HTML, a manifest, a service worker, and icons. No build step.

**GitHub Pages (recommended for phone install):**
1. Push the `RedVerifierV3/` folder contents to a GitHub repo.
2. Go to Settings > Pages, set source to the branch/root.
3. Your app will be live at `https://<yourname>.github.io/<repo>/`.
4. On Android Chrome, tap the browser menu and choose "Add to Home screen" to install it as a PWA.

**Local testing:**
```
npx serve RedVerifierV3/
```
or
```
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser. To test on your phone, use your machine's local IP address instead of `localhost`.

---

## Optional: Restrict the Worker to your domain

By default the Worker accepts requests from any origin. If you want to lock it to your own app URL, add this check at the top of the `fetch` handler in `worker.js`:

```javascript
const origin = request.headers.get('Origin') || '';
const allowed = ['https://yourusername.github.io', 'http://localhost'];
if (request.method !== 'OPTIONS' && !allowed.some(a => origin.startsWith(a))) {
  return new Response('Forbidden', { status: 403 });
}
```

Redeploy the Worker after making this change.

---

## Cost summary

| Service | Cost |
|---------|------|
| Cloudflare Worker | Free (100,000 requests/day) |
| Tavily Search | Free (1,000 searches/month) |
| Claude Haiku (triage) | ~$0.01–0.05 per run |
| Claude Sonnet (evaluation) | ~$0.04–0.25 per run |
| Cached re-runs | $0 |

A typical 3-claim post costs roughly **$0.05–$0.15**. Results are cached in `localStorage` so re-checking the same post is free.
