# Deploying Nestwell to Azure

**What you'll end up with** — one URL, `https://<your-app>.azurewebsites.net`:

```
Browser ──https──▶ Azure App Service (Linux, Python 3.12)
                     ├─ gunicorn ▶ Django REST API   (/api/...)
                     ├─ WhiteNoise ▶ built React app  (/, /search, /admin, ...)
                     └─ Django admin                  (/django-admin/)
                            │
                            ▼
                   Azure Database for PostgreSQL (Flexible Server)
```

The React app and the API share one origin, so there is no CORS to configure and only one URL to
authorise for Google sign-in. Secrets live in App Service *application settings*, never in the repo.

Roughly **$30/month** (App Service B1 ≈ $13, PostgreSQL B1ms + 32 GB ≈ $17; prices vary by region — check
the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/)), plus your Anthropic API
usage. New Azure accounts often get free-tier hours for both — check your offer. Step 13 tears it all down.

All commands are **PowerShell**. Run them from the repo root in one window, top to bottom — later steps
reuse variables from earlier ones.

---

## 0. Before you start

1. **Rotate your Anthropic API key.** `backend/.env.example` used to contain a real key and workspace ID
   (now replaced with blanks). It was never committed, but treat it as exposed: create a new key at
   <https://console.anthropic.com> → API Keys, delete the old one, and use the new one below.
2. **Install the tools** (skip what you have):
   ```powershell
   winget install Microsoft.AzureCLI      # then close and reopen the terminal
   node --version                         # need Node 20+ (you have 24)
   ```
3. **Sign in** and pick the subscription to bill:
   ```powershell
   az login
   az account show --query "{name:name, id:id}" -o table
   # wrong one?  az account set --subscription "<name or id>"
   ```
4. Allow the deploy script to run in this window: `Set-ExecutionPolicy -Scope Process Bypass`

## 1. Choose names and generate secrets

```powershell
$LOC = "southeastasia"                       # pick a region near your users: az account list-locations -o table
$RG  = "nestwell-rg"
$APP = "nestwell-" + -join ((97..122) | Get-Random -Count 5 | ForEach-Object { [char]$_ })   # must be globally unique
$PG  = "$APP-db"                             # also globally unique

function New-Secret([int]$Length = 32) {     # letters+digits only, so nothing needs escaping in the shell
    $chars = [char[]]'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $bytes = New-Object byte[] $Length
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}
$DB_PASS    = "Aa1" + (New-Secret 24)        # "Aa1" guarantees Postgres' complexity rules
$SECRET_KEY = New-Secret 64                  # Django's SECRET_KEY (also signs login tokens)

$ANTHROPIC_KEY = Read-Host "Paste your NEW Anthropic API key"
"App name: $APP"                             # note this down
```

You never need to know `$DB_PASS` or `$SECRET_KEY` again — they go straight into Azure in step 6.

## 2. Resource group

```powershell
az group create --name $RG --location $LOC --output table
```

## 3. PostgreSQL database (~5 minutes)

```powershell
az postgres flexible-server create `
    --resource-group $RG --name $PG --location $LOC `
    --admin-user nestwelladmin --admin-password $DB_PASS `
    --sku-name Standard_B1ms --tier Burstable --storage-size 32 --version 16 `
    --database-name nestwell `
    --public-access 0.0.0.0 --yes
```

`--public-access 0.0.0.0` is Azure's "allow Azure services" rule: only Azure-hosted resources can reach the
server, and they still need the password. It is the simplest setup; for stricter isolation, use VNet
integration + private endpoint later.

## 4. App Service plan and web app

```powershell
az appservice plan create --resource-group $RG --name "$APP-plan" --is-linux --sku B1
az webapp create --resource-group $RG --plan "$APP-plan" --name $APP --runtime "PYTHON:3.12"
```

> `--runtime` errors? Update the CLI (`az upgrade`); older versions want `"PYTHON|3.12"`.

## 5. Web app settings

```powershell
az webapp update --resource-group $RG --name $APP --https-only true
az webapp config set --resource-group $RG --name $APP `
    --always-on true --startup-file "bash startup.sh" --ftps-state Disabled --min-tls-version 1.2
az webapp log config --resource-group $RG --name $APP `
    --application-logging filesystem --level information --docker-container-logging filesystem
```

`startup.sh` (in `backend/`) runs on every start: database migrations → collect static files → gunicorn.

## 6. Application settings (secrets and config)

```powershell
az webapp config appsettings set --resource-group $RG --name $APP --output none --settings `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    DISABLE_COLLECTSTATIC=true `
    DJANGO_SECRET_KEY=$SECRET_KEY `
    DB_HOST="$PG.postgres.database.azure.com" DB_NAME=nestwell DB_USER=nestwelladmin DB_PASSWORD=$DB_PASS `
    ANTHROPIC_API_KEY=$ANTHROPIC_KEY ANTHROPIC_MODEL=claude-sonnet-5
```

`--output none` matters: without it Azure echoes every secret back to your terminal.

Only if your Anthropic key is workspace-scoped (it was in local dev), also run:
```powershell
az webapp config appsettings set -g $RG -n $APP -o none --settings ANTHROPIC_WORKSPACE_ID=wrkspc_xxxxxxxx
```

The app knows it is in production because Azure sets `WEBSITE_HOSTNAME`: `DEBUG` turns off, secure cookies
turn on, and it **refuses to start** without `DJANGO_SECRET_KEY`.

## 7. (Optional) Google sign-in

Skip this and the "Continue with Google" button simply renders disabled.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth **Web** client →
   **Authorized JavaScript origins** → add `https://<APP>.azurewebsites.net` (print it with `"https://$APP.azurewebsites.net"`).
2. Backend setting:
   ```powershell
   az webapp config appsettings set -g $RG -n $APP -o none --settings GOOGLE_CLIENT_ID=<xxx>.apps.googleusercontent.com
   ```
3. Frontend — the client ID is baked into the JavaScript at build time. Create the gitignored file
   `frontend/.env.production.local` containing:
   ```
   VITE_GOOGLE_CLIENT_ID=<xxx>.apps.googleusercontent.com
   ```
   (Do this **before** step 8. If you do it later, just run step 8 again.)

## 8. Deploy

```powershell
.\deploy-azure.ps1 -ResourceGroup $RG -AppName $APP
```

The script: checks you are logged in and the settings from step 6 exist → builds the React app → bundles it
with the backend (leaving out `.env`, `db.sqlite3`, `venv`) → uploads a zip. Azure then runs `pip install`,
which takes **5–10 minutes** the first time (LangChain is big).

Watch it start (Ctrl+C to stop watching):
```powershell
az webapp log tail --resource-group $RG --name $APP
```
You want to see `Applying properties.0001_initial... OK` followed by `Listening at: http://0.0.0.0:8000`.

## 9. Create your admin user and load demo data

The database starts empty. Open a shell inside the running app — **Portal → your App Service → Development
Tools → SSH → Go**, or `az webapp ssh -g $RG -n $APP` — and run:

```bash
cd /home/site/wwwroot
source antenv/bin/activate
python manage.py create_admin --username admin --email you@example.com --password 'choose-a-long-unique-password'
python manage.py seed_properties --count 80      # optional: fake listings for a demo
exit
```

Use a real password — this is a public site (do **not** reuse the `Admin12345` from the local README).

## 10. Verify

```powershell
$URL = "https://$APP.azurewebsites.net"
Invoke-RestMethod "$URL/api/properties/" | Select-Object -First 2     # JSON listings (empty list if you skipped seeding)
Start-Process $URL
```

Checklist in the browser:

- [ ] Home page loads with styling; refresh on `/search` works (no 404)
- [ ] The map renders tiles
- [ ] Register / sign in works; signing in as `admin` lands on `/admin` and refreshing `/admin/listings` works
- [ ] The AI search bar and the Aria chat reply (a `503` means `ANTHROPIC_API_KEY` is missing; see logs)
- [ ] `https://<APP>.azurewebsites.net/django-admin/` shows the Django admin login

## 11. Shipping changes later

Re-run `.\deploy-azure.ps1 -ResourceGroup $RG -AppName $APP` (open a new terminal? re-set `$RG` and `$APP`).
Migrations run automatically at startup. Expect a brief restart; later deploys are faster than the first.

---

## 12. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| "Application Error" / 503 right after deploy | Still installing/starting — wait a few minutes. Then `az webapp log tail -g $RG -n $APP`. |
| Log shows `ImproperlyConfigured: Set DJANGO_SECRET_KEY` | Step 6 didn't apply. Re-run it. |
| Log shows `OperationalError ... could not connect / password authentication failed` | Wrong `DB_*` values, or the DB isn't ready. Re-check step 6; confirm with `az postgres flexible-server show -g $RG -n $PG --query state`. |
| `bash: startup.sh: ... \r: command not found` | The file got Windows line endings. Repo's `.gitattributes` prevents it; fix with `(Get-Content backend/startup.sh -Raw) -replace "`r`n","`n" \| Set-Content -NoNewline backend/startup.sh` and redeploy. |
| Deploy says build failed | `az webapp log download -g $RG -n $APP --log-file logs.zip` and read the Oryx output. |
| `400 Bad Request` on a custom domain | Add it: `DJANGO_ALLOWED_HOSTS=www.example.com`. |
| `403 CSRF` on `/django-admin/login/` (custom domain) | Add `DJANGO_CSRF_TRUSTED_ORIGINS=https://www.example.com`. |
| Google button says "origin not allowed" | Step 7.1 — the origin must match exactly, `https`, no trailing slash. |
| AI returns `429` | The per-IP limit (default `20/min`) — raise with `AI_THROTTLE_RATE=60/min`. |
| AI returns `502` | Log line `ai_search failed` has the cause (invalid key, model access, Anthropic outage). |
| `az postgres flexible-server create` says region not available | Some subscriptions restrict certain regions. Pick another `$LOC`, or use a different region for the DB only (slightly higher latency). |
| Container times out starting | Set `WEBSITES_CONTAINER_START_TIME_LIMIT=600` as an app setting. |

Apply any setting with:
`az webapp config appsettings set -g $RG -n $APP -o none --settings NAME=value` (the app restarts).

## 13. Cost control and cleanup

- **Delete everything** (irreversible; removes the database too):
  `az group delete --name $RG --yes --no-wait`
- Stopping only the web app does **not** stop billing — the plan and database keep charging.
  You can stop the database (`az postgres flexible-server stop -g $RG -n $PG`, auto-restarts after 7 days).
- Azure keeps automatic database backups for 7 days by default.

## 14. Good to know

- **Local data isn't uploaded.** Production has its own empty PostgreSQL; use step 9 to create data.
- **Public AI endpoints** (`/api/ai/search/`, `/api/ai/assistant/`) are rate-limited per IP so a bot can't run
  up your Anthropic bill. Limits are per gunicorn worker, so the effective cap is a bit above the setting.
  Also set a monthly spend limit in the Anthropic Console.
- **Custom domain + free HTTPS certificate:** Portal → App Service → Custom domains → Add, then add the
  domain to `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, and Google's authorised origins.
- **Scaling out** to multiple instances: migrations run at each instance's startup, which can race. Move
  `migrate` out of `startup.sh` into a one-off step before scaling above one instance.
- **Django admin** moved from `/admin/` to `/django-admin/` (the React dashboard owns `/admin/*`), locally too.
- `python manage.py check --deploy` reports one error about a "development-only email backend"; the app never
  sends email, so it is harmless.
