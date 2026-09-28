# Deploying Nestwell to a Cloudzy VPS over SSH

**What you'll end up with** — one Linux server running the whole app, reachable at your domain over HTTPS:

```
Browser ──https──▶ Caddy (ports 80/443, free auto-renewing Let's Encrypt certificate)
                     └▶ web: gunicorn ─ Django API (/api/…) + the built React app (/, /search, /admin …)
                              └▶ db: PostgreSQL (data in a Docker volume)

All three are Docker containers managed by Docker Compose (deploy/cloudzy/docker-compose.yml).
Only Caddy is reachable from the internet; the app and the database are not.
```

The React app and the API share one origin, so there is no CORS to set up. Secrets live in one file on the
server (`deploy/cloudzy/.env`, readable only by you), never in the repo.

**Day-to-day it's:** push your code to GitHub → SSH into the server → `./deploy.sh`.

**Cost:** just the VPS. Pick one with **2 GB RAM minimum, 4 GB comfortable** (the AI libraries are memory-hungry and
building the image needs headroom), plus your Anthropic usage. Check Cloudzy's current plans and prices on their site.

> **Two shells are used below.** Blocks marked **PowerShell (your PC)** run on your Windows machine (Windows 10/11 already
> has `ssh` and `scp`). Blocks marked **Server (bash)** run inside your SSH session on the VPS.

---

## 1. Create the server on Cloudzy

In the Cloudzy dashboard, deploy a new VPS with:

| Setting | Choose |
| --- | --- |
| Operating system | **Ubuntu 24.04 LTS** (Ubuntu 22.04 or Debian 12 also work) |
| Size | **2 vCPU / 4 GB RAM** recommended (2 GB works; the setup script adds swap) |
| Location | Closest to your users |

Note down the server's **public IPv4 address** and the **root password** (shown in the dashboard or emailed when it's
ready). Dashboard labels change over time; what matters is: a fresh Ubuntu/Debian server, a public IPv4, and root access.
If the dashboard has its own firewall / security-group feature, allow inbound **22, 80 and 443** (the setup script
also configures the server's own firewall).

Throughout this guide, replace `SERVER_IP` with that address.

## 2. Point a domain at it (recommended — do it now)

HTTPS needs a domain name. At your DNS provider create an **A record**: `www.example.com` → `SERVER_IP`
(use your real name). DNS can take minutes to hours to spread; check from your PC:

**PowerShell (your PC)**
```powershell
nslookup www.example.com          # the "Address" at the bottom must be SERVER_IP
```

No domain yet? You can still deploy by IP over plain HTTP to try things out (step 6 asks). But passwords and login
tokens then cross the internet unencrypted, and Google sign-in won't work — add a domain before real use (step 10).
Tip: use a `www.` name (or any subdomain); a bare `example.com` also works with an A record if your DNS provider allows it.

## 3. Your SSH key (made on your PC)

An SSH key has two halves: a **private** file that never leaves your PC, and a **public** line you give to servers.
You make it on **your PC**, in a PowerShell window (in VS Code: press Ctrl+` — the prompt must start with `PS C:\`).
If you see `root@...` you're on the server, which can't do this step.

**PowerShell (your PC)**
```powershell
ssh-keygen -t ed25519 -C "nestwell-cloudzy"        # Enter for the default path; a passphrase is a good idea
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub   # prints ONE line starting with "ssh-ed25519 ..." - copy it
```
(If `ssh-keygen` says the file already exists, answer **n** and just run the `Get-Content` line.)

Keep that line handy: step 4 gives it to the server. You do **not** need to paste it into root's `authorized_keys` — and
if you look there, you may find a key you didn't create (some providers pre-install one). The setup script ignores
existing keys and turns root SSH login off, so they can't be used; see the Security notes.

## 4. Prepare the server (one script, ~5–10 minutes)

Copy the setup script up, log in with the root password once more, and run it with **your public key** from step 3:

**PowerShell (your PC)** — in the repo root
```powershell
scp deploy/cloudzy/setup-server.sh root@SERVER_IP:/root/
ssh root@SERVER_IP
```

**Server (bash)** — paste your own line between the quotes
```bash
DEPLOY_SSH_KEY='ssh-ed25519 AAAA...your-key... nestwell-cloudzy' bash setup-server.sh
```

It refuses to start if the key isn't a valid public key (so a typo can't lock you out). Then it updates the system and
enables automatic security updates, installs Docker, adds a 2 GB swap file, creates a non-root **`deploy`** user (with
your key, docker and passwordless `sudo`), turns on the firewall (SSH, 80, 443 only) and fail2ban, and finally
**disables SSH password logins and root SSH login**. It is safe to re-run.

**Before closing the root session**, prove the new user works, from a new PowerShell window on your PC:

**PowerShell (your PC)**
```powershell
ssh deploy@SERVER_IP
```

If that logs you in, you're done with root: use `deploy` from now on (`sudo` for admin tasks). If it doesn't, the root
window is still open to fix things — see Troubleshooting.

## 5. Put the code on the server

**First, get your work onto GitHub** — this repo has a lot of uncommitted changes, and the server can only fetch
what's pushed:

**PowerShell (your PC)** — in the repo root
```powershell
git status                      # sanity check: no .env files (they're gitignored)
git add -A
git commit -m "Add Cloudzy/Docker Compose deployment"
git push origin main
```

Then, on the server as `deploy`. The repo is `VHemantha/Bording_APP`.

**Public repo:**
```bash
git clone https://github.com/VHemantha/Bording_APP.git /opt/nestwell
```

**Private repo** — give the server a read-only key:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "nestwell-server"
cat ~/.ssh/github_deploy.pub          # copy this line
```
GitHub → the repo → **Settings → Deploy keys → Add deploy key** → paste it, leave "Allow write access" **unticked**. Then:
```bash
printf 'Host github.com\n  IdentityFile ~/.ssh/github_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
chmod 600 ~/.ssh/config
git clone git@github.com:VHemantha/Bording_APP.git /opt/nestwell      # answer "yes" to the GitHub fingerprint
```

<details>
<summary>No GitHub? Ship a tarball instead</summary>

From your PC (only committed files are included): `git archive --format=tar.gz -o nestwell.tar.gz HEAD`, then
`scp nestwell.tar.gz deploy@SERVER_IP:/tmp/`, and on the server
`tar -xzf /tmp/nestwell.tar.gz -C /opt/nestwell`. Deploy with `SKIP_PULL=1 ./deploy.sh` (step 7) every time.
</details>

## 6. Configure

**Server (bash)**
```bash
cd /opt/nestwell/deploy/cloudzy
./init-env.sh
```

It asks three things and writes `.env` with **freshly generated random secrets** (database password, Django secret key):

1. **Domain** — e.g. `www.example.com` (its A record must already point here), or press Enter for IP-only HTTP.
2. **Anthropic API key** — input is hidden; Enter to skip (the AI features then return a clean `503`; the rest works).
   Get a key at <https://console.anthropic.com> and set a monthly spend limit there.
3. **Google client ID** — Enter to skip (the Google button renders disabled).

It refuses to overwrite an existing `.env` on purpose (regenerating the database password would lock the app out of its own
database). To change a setting later, edit the file: `nano .env`, then run `./deploy.sh`.

## 7. First start (~5–15 minutes the first time)

**Server (bash)**
```bash
./deploy.sh
```

It builds the image (React build + Python dependencies), starts the database, applies migrations, starts the app and
Caddy, and waits until the app reports healthy. Later runs are much faster (cached layers).

## 8. Verify

**Server (bash)**
```bash
docker compose ps                      # db, web, caddy: all "Up"; web and db "(healthy)"
curl -s http://localhost/healthz; echo # ok   (with a domain this redirects to https; use: curl -sI https://www.example.com)
```

**Your browser:** open `https://www.example.com` (or `http://SERVER_IP` without a domain). The first HTTPS request
can take ~10–30 seconds while Caddy obtains the certificate. Checklist:

- [ ] Home page loads with styling; refreshing on `/search` works (no 404)
- [ ] The map shows tiles
- [ ] The AI search bar and the Aria chat reply (`503` = no Anthropic key was entered; `502` = check `docker compose logs web`)
- [ ] `/django-admin/` shows the Django admin login

The database starts **empty** — next step.

## 9. Create your admin user and demo data

**Server (bash)** — still in `/opt/nestwell/deploy/cloudzy`
```bash
read -rs -p "Choose an admin password: " ADMIN_PW; echo
docker compose exec web python manage.py create_admin --username admin --email you@example.com --password "$ADMIN_PW"
unset ADMIN_PW
docker compose exec web python manage.py seed_properties --count 80      # optional: fake listings for a demo
```

Use a long unique password — this is a public site. Sign in as `admin` on the site; you'll land on the `/admin` dashboard.

## 10. Adding a domain / HTTPS later (if you started with just the IP)

1. Create the DNS A record (step 2) and wait until `nslookup` shows `SERVER_IP`.
2. `nano .env` and change these four lines (keep everything else):
   ```
   SITE_ADDRESS=www.example.com
   DJANGO_ALLOWED_HOSTS=www.example.com
   DJANGO_CSRF_TRUSTED_ORIGINS=https://www.example.com
   DJANGO_SECURE_COOKIES=true
   ```
3. `SKIP_PULL=1 ./deploy.sh`. Caddy fetches the certificate and starts redirecting HTTP → HTTPS.
4. **Google sign-in:** in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) add
   `https://www.example.com` under *Authorized JavaScript origins*, then set **both** `GOOGLE_CLIENT_ID` and
   `VITE_GOOGLE_CLIENT_ID` in `.env` and run `SKIP_PULL=1 ./deploy.sh` (the second one is baked into the JavaScript, so
   it needs the rebuild).

## 11. Day-to-day: shipping changes

**PowerShell (your PC)** — commit and `git push origin main` as usual. Then:

**PowerShell (your PC)**
```powershell
ssh deploy@SERVER_IP
```
**Server (bash)**
```bash
cd /opt/nestwell/deploy/cloudzy
./deploy.sh
```

`deploy.sh` pulls, rebuilds, restarts what changed, applies migrations, and waits for the health check. Expect a few
seconds of downtime while the app container restarts; the database is never touched.

**Roll back** to an earlier version:
```bash
git -C ../.. log --oneline -8                 # find the last good commit
git -C ../.. checkout <commit>                # detached HEAD is fine here
SKIP_PULL=1 ./deploy.sh
# later, to resume normal deploys:  git -C ../.. checkout main
```
A rollback swaps code only — database migrations are **not** undone, so keep migrations backward-compatible.

Handy commands (run in `deploy/cloudzy`):

```bash
docker compose ps                     # status
docker compose logs -f web            # live app logs (add: caddy, db)
docker compose restart web            # restart just the app
docker stats --no-stream              # CPU / memory per container
free -h && df -h /                    # memory and disk
```

*Want push-to-deploy?* A GitHub Actions job can SSH in and run `./deploy.sh` for you — not set up here; ask if you want it.

## 12. Backups (do this before you have real data)

**Server (bash)** — test it once:
```bash
./backup.sh                            # writes ~/backups/nestwell-<timestamp>.sql.gz, keeps 14 days
```
Then schedule it daily: `crontab -e`, add this line, save:
```
30 3 * * * /opt/nestwell/deploy/cloudzy/backup.sh >> /home/deploy/backup.log 2>&1
```

A backup on the same server doesn't survive losing the server. Pull copies to your PC now and then (or use any VPS
snapshot/backup feature Cloudzy offers):

**PowerShell (your PC)**
```powershell
scp "deploy@SERVER_IP:backups/nestwell-*.sql.gz" .
```

**Restore** (this replaces the current data):
```bash
docker compose stop web
docker compose exec -T db psql -U nestwell -d postgres -c "DROP DATABASE nestwell" -c "CREATE DATABASE nestwell OWNER nestwell"
gunzip -c ~/backups/nestwell-XXXX.sql.gz | docker compose exec -T db psql -U nestwell nestwell
docker compose start web
```

## 13. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `ssh deploy@SERVER_IP` says *Permission denied (publickey)* | The server has a different key than your PC. In the still-open root session run `cat /home/deploy/.ssh/authorized_keys` and compare it with `Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub` on your PC; re-run the script with the correct `DEPLOY_SSH_KEY`. Wrong key file? `ssh -i $env:USERPROFILE\.ssh\id_ed25519 deploy@SERVER_IP`. |
| Locked out of SSH entirely | Use the **console / VNC** in the Cloudzy dashboard and log in as root with the root password (console logins aren't affected by the SSH settings), then fix `/home/deploy/.ssh/authorized_keys`, or delete `/etc/ssh/sshd_config.d/00-nestwell.conf` and run `systemctl reload ssh`. |
| `Set DEPLOY_SSH_KEY to your public key` / `not a valid SSH public key` | Pass your key as in step 4: one line, in single quotes, starting `ssh-ed25519`, copied from `Get-Content ...id_ed25519.pub` on your **PC**. A key generated on the server itself is useless for logging in from your PC. |
| `setup-server.sh: line 2: $'\r': command not found` | The file got Windows line endings. In the repo, `.gitattributes` prevents it; fix on the server with `sed -i 's/\r$//' setup-server.sh` and re-run. Same for the other `.sh` files. |
| Build is *Killed* / `exit code 137` | Out of memory while building. Check `free -h` (swap should show 2 GB); retry `./deploy.sh`; if it keeps dying, resize the VPS to 4 GB. |
| Site unreachable from the internet | Run `sudo ufw status`: it must allow 80 and 443; check Cloudzy's dashboard firewall too. `docker compose ps` — is `caddy` up? |
| Browser says the certificate is invalid / stuck on HTTP | `docker compose logs caddy`. Usual cause: the domain's A record doesn't point at this server yet, or ports 80/443 are blocked. Fix, then `docker compose restart caddy` (Let's Encrypt rate-limits repeated failures, so don't hammer it). |
| `400 Bad Request` | The host you typed isn't in `DJANGO_ALLOWED_HOSTS` in `.env` (e.g. you opened the IP but configured a domain). Fix `.env`, `SKIP_PULL=1 ./deploy.sh`. |
| `403 CSRF verification failed` on `/django-admin/login/` | `DJANGO_CSRF_TRUSTED_ORIGINS` doesn't match the URL in the browser exactly (scheme + host). |
| `502 Bad Gateway` from Caddy | The app is starting (allow ~1 min after a deploy) or crashed: `docker compose logs --tail=80 web`. |
| `web` restarts in a loop | Same logs. `could not connect to server` = the database isn't healthy yet/`POSTGRES_PASSWORD` changed after the volume was created (the DB keeps the *original* password — restore the original `.env` value, or wipe with `docker compose down -v` **only if you have nothing to lose**). |
| AI returns `503` / `502` / `429` | `503`: no `ANTHROPIC_API_KEY` in `.env`. `502`: see the `ai_search failed` log line (bad key, no model access, outage). `429`: per-IP limit; raise with `AI_THROTTLE_RATE=60/min` in `.env`. |
| Google button says *origin not allowed* | Step 10.4 — the origin must be `https`, match exactly, no trailing slash. |
| Disk filling up | `docker system df`; `docker image prune -af` (safe: running containers keep their images); logs are already capped at 30 MB per container. |
| `git pull` refuses (*not possible to fast-forward*/local changes) | Someone edited files on the server. `git -C ../.. status`, then `git -C ../.. checkout -- .` (discards server-side edits) and re-run. |

## 14. Security notes

- **Locked down by the setup script:** SSH keys only (no password guessing), **root can't log in over SSH at all**,
  fail2ban bans repeated failures, firewall allows only SSH/80/443, automatic security updates, non-root `deploy` user.
- **Unknown keys:** if `/root/.ssh/authorized_keys` held a key you don't recognise (e.g. commented `ElPatrono1337`), it can no
  longer be used over SSH, because root login is off and only *your* key is installed for `deploy`. Still find out whose it is
  (your Cloudzy account's SSH-key list, or Cloudzy support): the provider's dashboard/console can reach the server
  independently of SSH, and the cleanest fix is to reinstall the OS from the dashboard and redo the guide.
- `.env` is `chmod 600`, gitignored, and excluded from the Docker image.
- The `deploy` user has passwordless `sudo` and is in the `docker` group (root-equivalent anyway). Its SSH key is the only way in, so keep the private key safe (use a passphrase).
- Docker publishes ports **around** the `ufw` firewall. That's fine here because only Caddy publishes ports (80/443).
  **Never** add a `ports:` entry to `db` or `web` in the compose file.
- Public AI endpoints are rate-limited per IP so a bot can't run up your Anthropic bill; still set a monthly limit in the Anthropic Console.
- This is one server: no redundancy. A reboot restarts everything automatically (`restart: unless-stopped`), but if the
  server is lost you restore from your off-server backups (step 12).

## 15. Cleanup

- Stop the app but keep the data: `docker compose down`. Start again: `docker compose up -d`.
- **Delete the data too** (irreversible): `docker compose down -v`.
- To stop paying, delete the VPS in the Cloudzy dashboard (after downloading any backup you want to keep).

---

*Other targets:* the same Docker image also deploys to AWS ([DEPLOY_AWS.md](DEPLOY_AWS.md)) or Azure ([DEPLOY_AZURE.md](DEPLOY_AZURE.md)).
