# cybersense-ops

Operational platform for CyberSense content production and intelligence workflows.  
Deployed at **ops.cybersense.solutions** via Cloudflare Pages.

---

## Modules

| Module | Status | Path |
|---|---|---|
| Acquisition Editor | ✅ Live | `/acquisition-editor/` |
| Developmental Editor | 🔜 Planned | `/developmental-editor/` |
| Intelligence Aggregator | 🔜 Planned | `/intelligence-aggregator/` |
| Publication Queue | 🔜 Planned | `/publication-queue/` |

---

## Deployment — Step by Step

### 1. Connect repo to Cloudflare Pages

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages → Create → Pages → Connect to Git**
3. Select the `cybersense-ops` repository
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/` (root)
5. Click **Save and Deploy**

---

### 2. Set the Anthropic API key

1. In Cloudflare Pages → your project → **Settings → Environment Variables**
2. Add a **Production** variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (your key from platform.anthropic.com)
3. Click **Save**
4. Trigger a redeployment (push any commit, or use **Deployments → Retry**)

The Pages Function at `/functions/api/brief.js` proxies all Anthropic API calls
server-side so the key is never exposed in the browser.

---

### 3. Point ops.cybersense.solutions to Cloudflare Pages

Since your domain is already on Cloudflare:

1. In Cloudflare Pages → your project → **Custom Domains**
2. Click **Set up a custom domain**
3. Enter `ops.cybersense.solutions`
4. Cloudflare will automatically create the DNS record — confirm it

That's it. No manual DNS editing needed.

---

### 4. Update the frontend API endpoint

Once deployed with the Pages Function, update the `callClaude` fetch URL in
`acquisition-editor/index.html` from the direct Anthropic URL to your proxy:

```js
// Change this line in acquisition-editor/index.html
const res = await fetch('https://api.anthropic.com/v1/messages', { ... });

// To this:
const res = await fetch('/api/brief', { ... });
// (remove the x-api-key and anthropic-version headers from the frontend fetch)
```

This routes through `/functions/api/brief.js` and keeps the API key server-side.

---

## Local Development

No build tools required. Open directly in browser:

```bash
# Clone the repo
git clone https://github.com/BorgesLebron/cybersense-ops.git
cd cybersense-ops

# For local testing with direct API access, temporarily add your key
# to acquisition-editor/index.html — const API_KEY = 'sk-ant-...'
# NEVER commit the key. Remove it before pushing.

# Serve locally (Python)
python3 -m http.server 8080
# Then open http://localhost:8080
```

---

## Project Structure

```
cybersense-ops/
├── index.html                        # Ops platform landing page
├── acquisition-editor/
│   └── index.html                    # Acquisition Editor module
├── functions/
│   └── api/
│       └── brief.js                  # Cloudflare Pages Function (API proxy)
└── README.md
```

---

## Architecture Notes

- **Frontend:** Vanilla HTML/CSS/JS — no framework, no build step, no dependencies except Tabler Icons (CDN)
- **API security:** Anthropic key lives in Cloudflare environment variables, proxied via Pages Functions
- **Persistence:** Article queue saved to `localStorage` — survives page refresh, cleared on browser data reset
- **Next layer:** PostgreSQL + Node/Express backend on Railway for persistent brief storage and agent handoff queue

---

## Roadmap

Each module is built and proven independently before integration.

- [x] Acquisition Editor — brief generation, batch run, PDF upload, localStorage persistence
- [ ] Developmental Editor — receives brief, produces full draft
- [ ] Agent handoff interface — structured JSON output spec between modules
- [ ] Railway backend — PostgreSQL persistence, dated brief archive
- [ ] Publication Queue — SendGrid integration for distribution
