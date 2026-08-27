# MC Steel Lead Monitor

A GitHub-ready, private monitoring dashboard for construction-material buyer inquiries. It collects permitted public-source results, scores buyer intent, removes duplicate links, extracts contact details that were explicitly published in the inquiry, and links back to the original post.

## What is included

- Uncapped database accumulation and dashboard loading. Results are fetched in internal batches until every date-filtered match is displayed.
- Filters for post date, source, lead status, search term, and sort order.
- Separate Contacts page for explicitly published name, email, and Philippine mobile number.
- Contact review states: Unreviewed, Verified, Invalid, and Do not contact.
- Buyer-intent scoring for English and Filipino phrases.
- Strict seller-ad rejection: promotional offers, stock advertisements, delivery pitches, and "message us" sales posts are excluded even when they contain buyer-like wording.
- Construction keywords covering rebars, steel sections, plates, tubes, pipes, mesh, roofing, bolts, and related products.
- Duplicate protection based on the original post URL.
- Hourly rotating collection from 8:07 AM through 6:07 PM Philippine time, with up to 20 public search results per run and manual runs available anytime.
- Pluggable inputs: public web-search results, RSS/Atom feeds, and approved API/webhook ingestion.
- Built-in HTTPS username/password protection with no Cloudflare Zero Trust subscription required.

## Important platform rule

This project does not bypass logins, CAPTCHAs, robots controls, or platform anti-bot systems. Public visibility does not automatically authorize automated collection. Use official/approved APIs, public RSS feeds, authorized search providers, or the protected `/api/ingest` endpoint. Facebook/TikTok coverage from web search will be incomplete because those platforms decide what is indexable.

## Architecture

1. GitHub Actions calls `/api/collect` hourly from 8:07 AM through 6:07 PM Philippine time, or on demand when manually started.
2. The collector queries configured public sources and RSS feeds.
3. Buyer-intent scoring keeps posts containing both a buying signal and a construction-product match.
4. D1 stores leads without a lifetime row cap and ignores duplicate post URLs.
5. Explicit public names, emails, and Philippine mobile numbers are stored on the Contacts page.
6. Dashboard APIs load up to 500 rows per request and automatically continue until all matches in the selected date range are loaded.

## Prerequisites

- GitHub repository
- Node.js 22+
- Cloudflare account with Workers and D1
- Optional Serper API key for publicly indexed web results
- Optional public RSS/Atom feed URLs

GitHub Pages alone is not used because it is static and would expose contact data. GitHub stores and runs the code; Cloudflare Worker and D1 provide the secure application runtime.

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run db:generate
npm run dev
```

For local D1, create a database and apply the generated migration with Wrangler. The included build uses the logical `DB` binding.

## Cloudflare setup

1. Log in and create the database:

```bash
npx wrangler login
npx wrangler d1 create mc-steel-lead-monitor
```

2. Replace the placeholder database ID in `wrangler.jsonc` with the returned database ID.
3. Set runtime secrets. Use an ASCII username and a long, unique password that you do not use anywhere else:

```bash
npx wrangler secret put COLLECTOR_SECRET
npx wrangler secret put SERPER_API_KEY
npx wrangler secret put DASHBOARD_USERNAME
npx wrangler secret put DASHBOARD_PASSWORD
```

5. Generate and apply the schema, build, and deploy:

```bash
npm run db:generate
npx wrangler d1 migrations apply mc-steel-lead-monitor --remote --config wrangler.jsonc
npm run build
npx wrangler deploy --config wrangler.jsonc
```

6. Open the deployed HTTPS address. The browser will request the dashboard username and password. The collector endpoints continue using `COLLECTOR_SECRET` instead of the dashboard password.

The optional `ALLOWED_EMAILS` setting remains available if Cloudflare Access or a compatible authenticated workspace is added later, but it is not required for the built-in password setup.

## GitHub repository secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy Worker and apply D1 migrations |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account target |
| `APP_BASE_URL` | Deployed dashboard origin, without trailing slash |
| `COLLECTOR_SECRET` | Long random secret matching the Worker secret |

After pushing to `main`, `deploy.yml` deploys the application. `collect.yml` runs hourly from 8:07 AM through 6:07 PM Philippine time and can also be started manually. Each run rotates to one of the configured product/platform search segments so the trial credit balance is not consumed by a complete scan every hour.

## Collection sources

### Public web search

Set `SERPER_API_KEY`. Queries use construction product batches, buyer-intent phrases, Philippine search localization, date windows, and `site:` filters for Facebook, Instagram, Threads, TikTok, LinkedIn, and Reddit. Edit `config/monitor.ts` to change products, intent phrases, platforms, or locations.

Social-platform coverage is limited to public pages that the search provider has indexed. The collector does not access private accounts, login-only content, or content hidden from search engines.

`MAX_PAGES_PER_QUERY` is only an operational budget for one scheduled run. It is not a database or display limit. Repeated scheduled runs keep accumulating unique posts.

### RSS and Atom

Set `RSS_FEEDS` as a JSON array or comma-separated list:

```text
["https://example.com/procurement/feed.xml","https://example.org/rfq.atom"]
```

### Approved platform or procurement API

Transform the approved API response into the shape in `examples/approved-api-ingest.json`, then send it to:

```bash
curl --request POST \
  --header "Authorization: Bearer YOUR_COLLECTOR_SECRET" \
  --header "Content-Type: application/json" \
  --data @examples/approved-api-ingest.json \
  https://YOUR-DOMAIN/api/ingest
```

Each item must set `isPublic: true`. The server still applies buyer-intent qualification and contact extraction.

## Data responsibility

- Store only what is needed to answer a public buyer inquiry.
- Do not infer hidden names, emails, or numbers.
- Verify the source post before contacting anyone.
- Mark opt-outs as **Do not contact**.
- Follow platform terms, the Philippine Data Privacy Act, and your internal retention policy.
- Keep the repository private and never commit API keys, access tokens, or production data.

## Main files

```text
app/                         Dashboard pages and protected APIs
components/                  Lead and contact interfaces
config/monitor.ts            Products, buyer phrases, domains, locations
db/schema.ts                 D1 tables and indexes
lib/collector.ts             Deduplication, scoring, storage, contact extraction
lib/collectors/              Public search and RSS adapters
drizzle/                     Generated D1 migrations
.github/workflows/           Deploy and scheduled collection workflows
wrangler.jsonc               Cloudflare Worker and D1 bindings
```
