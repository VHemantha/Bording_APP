# Nestwell — modern real-estate marketplace

A Zillow-benchmarked home search platform with:

- **Zillow-style auth** — a sliding sign-in/up modal that pops over any page, email/password + JWT, real **Google Identity Services** sign-in, and **admin vs. user roles** (admins are routed to a dedicated dashboard).
- **Redesigned, animated UI** — Manrope/Fraunces type, an ocean-indigo palette, Framer Motion transitions, scroll reveals, skeleton loaders, a photo-rich landing page (hero, animated stats, featured homes, explore-by-city, how-it-works, testimonials, CTA).
- **AI home-search agent** — LangChain + LangGraph, **Claude** (`claude-sonnet-5`) as the foundation model. A `StateGraph` turns "3 bed house in Austin under 500k" into structured filters, runs them through the same `PropertyFilter` the REST API uses, and writes a friendly summary.
- **Aria, the site-guide assistant** — a floating chat widget backed by a LangGraph ReAct agent with `search_properties` + `get_site_help` tools; offers a "show me these homes" deep link when it runs a search.
- **Admin listing management** — a custom in-app dashboard (`/admin`) to create/edit/delete listings manually, **or** paste raw text into *AI Import* and let a LangGraph agent extract a structured draft (Claude structured output) for review before publishing.

Everything degrades gracefully: with **no `ANTHROPIC_API_KEY`** the AI endpoints return a clean `503` and the rest of the site works; with **no `GOOGLE_CLIENT_ID`** the Google button renders disabled.

## Stack

| Layer | Tech |
| --- | --- |
| Backend | Django 6.1, DRF, SimpleJWT, django-filter |
| AI | langchain, langgraph, langchain-anthropic (Claude) |
| Auth | JWT + Google Identity Services (`google-auth` verification) |
| Frontend | React 19, Vite, Tailwind v4, Framer Motion, lucide-react, react-leaflet |

## Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on *nix)
pip install -r requirements.txt

cp .env.example .env             # then fill in keys (optional for a first run)

python manage.py migrate
python manage.py seed_properties --count 80 --clear
python manage.py create_admin --username admin --email admin@nestwell.test --password Admin12345
python manage.py runserver 8000
```

`backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...        # enables the AI agent + assistant + AI import
ANTHROPIC_MODEL=claude-sonnet-5     # optional override
ANTHROPIC_WORKSPACE_ID=wrkspc_...   # ONLY if the key is identity-linked / workspace-scoped
GOOGLE_CLIENT_ID=....apps.googleusercontent.com   # enables "Continue with Google"
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local        # set VITE_GOOGLE_CLIENT_ID to match the backend
npm run dev                       # http://localhost:5173
```

## Deploying to AWS (with CI/CD)

Step-by-step guide: **[DEPLOY_AWS.md](DEPLOY_AWS.md)**. One Docker image (Django + the built React app) runs on
ECS Fargate behind an Application Load Balancer, with PostgreSQL on RDS and secrets in Secrets Manager. The
infrastructure is one CloudFormation template ([infra/nestwell.yaml](infra/nestwell.yaml)); GitHub Actions
([.github/workflows](.github/workflows)) tests every pull request and, on every push to `main`, builds the image,
runs migrations and rolls it out with automatic rollback. GitHub signs in to AWS with OIDC — no AWS keys are stored.

## Deploying to a Cloudzy VPS (or any Linux server) over SSH

Step-by-step guide: **[DEPLOY_CLOUDZY.md](DEPLOY_CLOUDZY.md)**. The cheapest option: one server runs Docker
Compose ([deploy/cloudzy/](deploy/cloudzy/)) with the same Docker image, PostgreSQL, and Caddy, which gets and renews
a free HTTPS certificate by itself. Setup is a few scripts you run over SSH; updates are `git pull` + `./deploy.sh`.

## Deploying to Azure (alternative)

Step-by-step guide (App Service + PostgreSQL, one URL for the React app and the API): **[DEPLOY_AZURE.md](DEPLOY_AZURE.md)**.
In short: create the resources with `az`, then `.\deploy-azure.ps1 -ResourceGroup <rg> -AppName <app>`.

> Django's built-in admin lives at `/django-admin/` (the React dashboard owns `/admin/*`).

## Auth model

- Regular sign-ups get `role: "user"`.
- Admins are created with `python manage.py create_admin` (or `createsuperuser`) — they sign in through the same modal and are redirected to `/admin`.
- Google sign-in: the frontend renders Google's official button, receives a credential JWT, and posts it to `POST /api/auth/google/`, which verifies it with `google-auth` and issues our JWT pair.

## Key API endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/properties/` | public, filterable (`city`, `status`, `min_price`, `min_beds`, …) |
| `POST/PUT/DELETE` | `/api/properties/` | staff only; accepts `images: [url, …]` |
| `POST` | `/api/auth/token/`, `/api/auth/google/` | JWT / Google login |
| `POST` | `/api/ai/search/` | `{query}` → `{reply, filters, results, count}` |
| `POST` | `/api/ai/assistant/` | `{message, history}` → `{reply, filters}` |
| `POST` | `/api/ai/extract-listing/` | staff only; `{text}` → `{listing, warnings}` |

## Notes / limitations

- No geocoding service is wired up — the AI listing importer leaves latitude/longitude blank and flags it; the admin sets the map pin in the form.
- Listing photos are URLs (no upload pipeline). Landing-page imagery uses hosted Unsplash URLs.
- Chat history for the assistant is kept in the browser (not persisted server-side).
