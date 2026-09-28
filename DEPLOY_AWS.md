# Deploying Nestwell to AWS (with CI/CD)

**What you'll end up with** — one URL serving the React app and the API, and every push to `main`
deploying itself:

```
Browser ──▶ Application Load Balancer (HTTP, or HTTPS with your domain)
                 │  health check: /healthz
                 ▼
            ECS Fargate task  ── one Docker image ──────────────────────────────┐
              ├─ gunicorn ▶ Django REST API  (/api/...)                         │ image built by
              ├─ WhiteNoise ▶ built React app (/, /search, /admin, ...)         │ GitHub Actions,
              └─ Django admin                 (/django-admin/)                  │ stored in ECR
                 │                                                              ┘
                 ▼
            RDS PostgreSQL (private subnets, no internet route)

Secrets (Django key, DB password, Anthropic key) ─ AWS Secrets Manager ─▶ injected as env vars
Logs ─▶ CloudWatch Logs (/ecs/nestwell)
```

The React app and the API share one origin, so there is no CORS to configure. Nothing secret is in the
repo, the image, or GitHub.

**The CI/CD pipeline** (`.github/workflows/`):

```
pull request ──▶ ci.yml     backend tests · migrations check · lint · frontend build · docker build

push to main ─▶ deploy.yml  ci.yml (must pass)
                            └▶ sign in to AWS with a short-lived OIDC token (no AWS keys in GitHub)
                               └▶ docker build ─▶ push to ECR, tagged with the commit SHA
                                  └▶ run `manage.py migrate` as a one-off task (new image)
                                     └▶ ECS rolling deploy; auto-rollback if new tasks are unhealthy
```

**Cost:** roughly **$65–75/month** in a typical region (Fargate 0.5 vCPU/2 GB ≈ $21, load balancer ≈ $20,
RDS `db.t4g.micro` + 20 GB ≈ $14, public IPv4 addresses ≈ $11, secrets/logs a few dollars), plus your Anthropic
usage. Prices vary by region — check the [AWS pricing calculator](https://calculator.aws/). Step 11 tears it all down.

> All commands are **bash**. On Windows use **Git Bash** (installed with Git) or
> [AWS CloudShell](https://console.aws.amazon.com/cloudshell) (a browser terminal with the AWS CLI already
> logged in — you'd `git clone` the repo there). Run them from the repo root, in one window, top to bottom.

---

## 1. Before you start

1. **An AWS account**, and an IAM user or SSO role that can create IAM roles, VPCs, RDS, ECS, ECR, ALB and
   CloudFormation stacks. (`AdministratorAccess` is simplest for a first deploy.) Don't use the root user.
2. **Install and sign in** (skip what you have):
   ```bash
   winget install Amazon.AWSCLI                 # Windows; then reopen Git Bash
   winget install Amazon.SessionManagerPlugin   # only needed for step 7 (shell into the container)
   aws configure sso        # or `aws configure` with an access key
   aws sts get-caller-identity                  # shows the account you'll be billed on
   ```
3. **Pick a region** near your users and make it the default for this window:
   ```bash
   aws configure set region ap-southeast-1      # or us-east-1, eu-west-1, ...
   export MSYS_NO_PATHCONV=1                    # Git Bash only: stops it rewriting "/ecs/..." arguments
   ```
4. **Your code must be on GitHub** (this repo's remote is `VHemantha/Bording_APP`). Nothing is pushed yet —
   you'll do that in step 5, *after* the AWS side exists.
5. **Get a new Anthropic API key** at <https://console.anthropic.com> (skip if you don't want the AI features —
   they return a clean `503` and the rest of the site works). Set a monthly spend limit there too.

## 2. Store your Anthropic key in Secrets Manager (optional)

The key is stored once, by you, outside any template or pipeline:

```bash
read -rs -p "Paste your Anthropic API key (input is hidden): " ANTHROPIC_KEY; echo
ANTHROPIC_ARN=$(aws secretsmanager create-secret --name nestwell/anthropic-api-key \
    --secret-string "$ANTHROPIC_KEY" --query ARN --output text)
unset ANTHROPIC_KEY
echo "$ANTHROPIC_ARN"
```

## 3. Create the infrastructure (~15 minutes)

One CloudFormation stack ([infra/nestwell.yaml](infra/nestwell.yaml)) creates everything: network, database,
load balancer, container registry, ECS cluster and service, IAM roles, and the role GitHub Actions will use.

```bash
bash scripts/aws-infra.sh \
    GitHubRepo=VHemantha/Bording_APP \
    AnthropicSecretArn="$ANTHROPIC_ARN"
```

- Skipped step 2? Leave out `AnthropicSecretArn`.
- Already have GitHub's OIDC provider in this account (IAM → Identity providers → `token.actions.githubusercontent.com`)?
  An account can only have one; add `CreateGitHubOidcProvider=false`.
- Have a Google sign-in client ID? Add `GoogleClientId=<xxx>.apps.googleusercontent.com`.

It ends by printing the stack outputs. **Copy `DeployRoleArn`** and note `AppUrl`. Re-print them any time:

```bash
aws cloudformation describe-stacks --stack-name nestwell --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output table
```

The service starts with **0 tasks** on purpose — there is no image to run yet. The first pipeline run raises it to 1.

## 4. Tell GitHub how to reach AWS

GitHub repo → **Settings → Secrets and variables → Actions → Variables** tab → *New repository variable*
(these are not secrets — the role can only be assumed by *this* repo's `main` branch):

| Variable | Value |
| --- | --- |
| `AWS_ROLE_ARN` | the `DeployRoleArn` from step 3 |
| `AWS_REGION` | the region you chose, e.g. `ap-southeast-1` |
| `VITE_GOOGLE_CLIENT_ID` | *(optional)* your Google client ID — it is baked into the JavaScript at build time |

Or with the GitHub CLI: `gh variable set AWS_ROLE_ARN --body "arn:aws:iam::123456789012:role/..."`.

Recommended: **Settings → Branches → add a rule for `main`** that requires the `CI` checks to pass before merging.

## 5. First deploy

Commit and push everything (this repo has a lot of uncommitted work):

```bash
git status                       # sanity check: no .env files, no venv, no db.sqlite3 (they're gitignored)
git add -A
git commit -m "Deploy to AWS: Dockerfile, CloudFormation, GitHub Actions CI/CD"
git push origin main
```

Then watch **GitHub → Actions → "Deploy to AWS"**. The first run takes ~10–15 minutes:
tests → Docker build → push → migrate → start the first task → health checks pass → done. The log ends with
your URL. (Re-run it any time from the Actions tab → *Run workflow*.)

## 6. Verify

```bash
URL=$(aws cloudformation describe-stacks --stack-name nestwell --query "Stacks[0].Outputs[?OutputKey=='AppUrl'].OutputValue" --output text)
curl -s "$URL/healthz"; echo               # ok
curl -s "$URL/api/properties/" | head -c 300; echo    # JSON (an empty list until you seed data)
echo "$URL"                                # open this in your browser
```

> ⚠️ Until step 8, the site is plain **HTTP**: passwords and login tokens cross the internet unencrypted.
> That's fine for a smoke test with fake accounts. Do step 8 before sharing the link or using real credentials.

## 7. Create your admin user and demo data

The database starts empty. Open a shell inside the running container (needs the Session Manager plugin from step 1):

```bash
CLUSTER=$(aws cloudformation describe-stacks --stack-name nestwell --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" --output text)
TASK=$(aws ecs list-tasks --cluster "$CLUSTER" --query 'taskArns[0]' --output text)
aws ecs execute-command --cluster "$CLUSTER" --task "$TASK" --container web --interactive --command "/bin/bash"
```

Inside that shell:

```bash
cd /app
python manage.py create_admin --username admin --email you@example.com --password 'choose-a-long-unique-password'
python manage.py seed_properties --count 80        # optional: fake listings for a demo
exit
```

Use a real password — this is a public site (not the `Admin12345` from the local README). Then sign in on the site
as `admin`; you'll land on `/admin`.

## 8. HTTPS and a custom domain (recommended)

Google sign-in only works from an `https://` origin, and passwords shouldn't cross the internet in the clear.

**If your domain's DNS is in Route 53** — one command; the stack requests a free certificate, validates it, turns
on HTTPS, redirects HTTP to HTTPS, and creates the DNS record (allow ~10 minutes):

```bash
bash scripts/aws-infra.sh DomainName=www.example.com HostedZoneId=Z0123456789ABCDEFGHIJ
```
(Find the zone ID: `aws route53 list-hosted-zones`.)

**If your DNS is elsewhere** (GoDaddy, Cloudflare, ...):

1. Request a certificate in the same region: `aws acm request-certificate --domain-name www.example.com --validation-method DNS --query CertificateArn --output text`
2. `aws acm describe-certificate --certificate-arn <arn> --query 'Certificate.DomainValidationOptions[0].ResourceRecord'`
   → create that CNAME at your DNS provider, and wait until the certificate status is `ISSUED`.
3. `bash scripts/aws-infra.sh DomainName=www.example.com CertificateArn=<arn>`
4. At your DNS provider, add a **CNAME** `www` → the `LoadBalancerDns` output. (A bare apex domain can't be a CNAME;
   use `www`, or move the DNS to Route 53.)

Afterwards, for Google sign-in: add `https://www.example.com` under **Authorized JavaScript origins** in the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials), set the repo variable `VITE_GOOGLE_CLIENT_ID`
(step 4), pass `GoogleClientId=...` once with `scripts/aws-infra.sh`, and re-run the deploy workflow so the client ID
is rebuilt into the JavaScript.

## 9. Day-to-day: how you ship changes

1. Branch → change → open a **pull request**. `CI` runs tests, lint, the frontend build and a Docker build.
2. Merge to `main`. `Deploy to AWS` builds the image, tags it with the commit SHA, runs migrations, and rolls the
   service. Zero downtime: new tasks must pass `/healthz` before old ones are drained.
3. If the new version never becomes healthy, ECS **rolls back on its own** and the workflow fails (the log shows why).
   If a *migration* fails, the workflow stops before touching the running version.

Useful commands:

```bash
# Live logs
aws logs tail /ecs/nestwell --follow

# What is running, and which commit?
aws ecs describe-services --cluster "$CLUSTER" --services "$(aws cloudformation describe-stacks --stack-name nestwell --query "Stacks[0].Outputs[?OutputKey=='ServiceName'].OutputValue" --output text)" \
    --query 'services[0].[deployments[0].taskDefinition,runningCount,desiredCount]' --output text

# Fast rollback to an earlier task definition revision (list them, then pick one)
aws ecs list-task-definitions --family-prefix nestwell-web --sort DESC --max-items 5
aws ecs update-service --cluster "$CLUSTER" --service <ServiceName> --task-definition nestwell-web:<revision>

# Run more than one copy (migrations are a one-off task, so this is safe)
aws ecs update-service --cluster "$CLUSTER" --service <ServiceName> --desired-count 2

# Change infrastructure settings later (keeps whatever CD deployed; only what you name changes)
bash scripts/aws-infra.sh TaskMemory=4096
```

Notes:
- A rollback swaps code only. Database migrations are **not** undone, so keep migrations backward-compatible
  (add a column in one release, stop using an old one in a later release).
- The AI rate limit (`AI_THROTTLE_RATE`, default `20/min`) is counted per gunicorn worker, so the real cap is a
  little above the setting, and grows with the number of tasks.
- Don't edit `infra/nestwell.yaml` and run a bare `aws cloudformation deploy` — use `scripts/aws-infra.sh`,
  which passes the live image and task count so CloudFormation can't roll production back to an older image.

## 10. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Stack create fails: *Provider with url ... already exists* | Your account already has a GitHub OIDC provider. Delete the failed stack and re-run step 3 with `CreateGitHubOidcProvider=false`. |
| Stack create fails on the database: *Cannot find version* | Pick a valid one: `aws rds describe-db-engine-versions --engine postgres --query "DBEngineVersions[].EngineVersion"`, then `DbEngineVersion=<value>`. |
| Deploy job: *Could not assume role* / *Not authorized to perform sts:AssumeRoleWithWebIdentity* | `AWS_ROLE_ARN`/`AWS_REGION` variables missing or wrong (step 4); the run isn't on the `main` branch; or `GitHubRepo` in step 3 doesn't match `owner/repo` exactly (case-sensitive). |
| Deploy job: *Stack with id nestwell does not exist* | Wrong `AWS_REGION` variable, or the stack has a different name — set the repo variable `STACK_NAME`. |
| Deploy log: *migrations failed* | The migration output is printed just above the error. Common cause: a bad migration, or the database is still starting. The running version is untouched — fix and push again. |
| Rollout *FAILED*, tasks restart in a loop | CloudWatch log group `/ecs/nestwell`. `ResourceInitializationError ... secrets` = a secret ARN is wrong or unreadable; `CannotPullContainerError` = the image tag doesn't exist in ECR; a Python traceback = an app/config error. |
| `502`/`503` from the load balancer | No healthy targets yet (allow ~2 min after a deploy). Check: `aws elbv2 describe-target-health --target-group-arn <arn>`. `/healthz` must return 200. |
| AI returns `503` | No Anthropic key configured (step 2 + `AnthropicSecretArn`). |
| AI returns `502` | Log line `ai_search failed` has the cause (invalid key, no model access, Anthropic outage). |
| AI returns `429` | The per-IP limit — raise with `AI_THROTTLE_RATE`: add the env var to `infra/nestwell.yaml` (`Environment` list) and run `scripts/aws-infra.sh`. |
| `400 Bad Request` on a domain you added | It must be passed as `DomainName=` (it feeds Django's `ALLOWED_HOSTS`/CSRF settings). Re-run `scripts/aws-infra.sh DomainName=...`. |
| Google button says *origin not allowed* | Step 8 — the origin must be `https`, match exactly, no trailing slash. |
| `execute-command` fails with *TargetNotConnectedException* | Install the Session Manager plugin; wait a minute after a fresh deploy; make sure you're using a task started after the stack was created. |
| Cert stays *Pending validation* (Route 53 path) | `HostedZoneId` isn't the zone that actually serves the domain's DNS (check the domain's nameservers). |

## 11. Cost control and cleanup

- **Delete everything** (irreversible for data; the database keeps a final snapshot, see below):
  ```bash
  aws cloudformation delete-stack --stack-name nestwell
  aws cloudformation wait stack-delete-complete --stack-name nestwell
  ```
  Then clean up what lives outside the stack: the Anthropic secret
  (`aws secretsmanager delete-secret --secret-id nestwell/anthropic-api-key --force-delete-without-recovery`),
  the database's final snapshot (RDS → Snapshots) once you're sure you don't need it, and the GitHub variables.
- If deletion is blocked, the stack has database deletion protection on (`DbDeletionProtection=true`) — turn it off first.
- **Cheaper while idle:** set `--desired-count 0` to stop paying for Fargate (the load balancer and database keep billing).
- Automated database backups are kept 7 days. For real production also set `DbMultiAz=true` and `DbDeletionProtection=true`.

## 12. Good to know

- **Local data isn't uploaded.** Production has its own empty PostgreSQL; use step 7 to create data.
- **Public AI endpoints** (`/api/ai/search/`, `/api/ai/assistant/`) are rate-limited per IP so a bot can't run up
  your Anthropic bill. Also set a monthly spend limit in the Anthropic Console.
- **Networking trade-off:** tasks run in public subnets with public IPs so they can reach ECR and the Anthropic API
  without a ~$32/month NAT gateway. Their security group only accepts traffic from the load balancer, and the
  database is in private subnets with no route to the internet. To go stricter, move tasks to private subnets and add
  a NAT gateway (or VPC endpoints for ECR, S3, Secrets Manager, CloudWatch Logs — the Anthropic API still needs NAT).
- **More hardening when you outgrow this:** AWS WAF on the load balancer, autoscaling on the ECS service, ALB access logs.
- **Django admin** lives at `/django-admin/` (the React dashboard owns `/admin/*`).
- **Try the image locally** (needs Docker): `docker build -t nestwell .` then
  `docker run --rm -p 8000:8000 -e DJANGO_SECRET_KEY=dev -e DJANGO_ALLOWED_HOSTS=localhost -e DJANGO_SECURE_COOKIES=false nestwell sh -c "python manage.py migrate && gunicorn zillow_clone.wsgi"`
  and open <http://localhost:8000> (it uses a throwaway SQLite database inside the container).
- The older Azure files ([DEPLOY_AZURE.md](DEPLOY_AZURE.md), `deploy-azure.ps1`, `backend/startup.sh`) still work
  and are untouched by this change; delete them if you're not going back.
