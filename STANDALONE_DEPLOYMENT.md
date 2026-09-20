# Standalone Docker Deployment

This edition runs the complete learner arena, facilitator dashboard, email allowlist and persistent database in one Docker container.

## 1. Configure the environment

Copy `.env.example` to `.env` and change:

- `SESSION_SECRET`: a random value of at least 32 characters.
- `FACILITATOR_EMAILS`: the trainer email that should see the Overall Dashboard. Multiple addresses can be comma-separated.
- `COOKIE_SECURE`: use `false` for local HTTP and `true` for an HTTPS production domain.

Generate a safe secret with:

```bash
openssl rand -hex 32
```

## 2. Add learners

Edit `config/learners.json`. It must contain only a JSON array of emails:

```json
[
  "student1@gmail.com",
  "student2@gmail.com",
  "student3@gmail.com"
]
```

The facilitator emails from `.env` are allowed automatically and should not be repeated in this file.

## 3. Start

```bash
docker compose up -d --build
```

Open `http://localhost:8080`. Each learner enters an authorized email. The facilitator email receives the additional **Overall Dashboard** menu.

## Persistent data

Docker Compose creates the named volume `arena_data`. Learners, answers, scores, streaks and dashboards survive container upgrades and restarts.

Back up the volume before server migration:

```bash
docker run --rm -v ai-services-arena_arena_data:/data -v "$PWD":/backup alpine tar czf /backup/arena-data-backup.tar.gz -C /data .
```

Do not run `docker compose down -v` unless you intentionally want to erase all learner data.

## Updating the learner list

Edit `config/learners.json`, then restart:

```bash
docker compose restart arena
```

Removing an email blocks its future sessions immediately after the restart; its historical results remain in the database.

## Production deployment

- Put the container behind an HTTPS reverse proxy such as Nginx, Caddy or a cloud load balancer.
- Set `COOKIE_SECURE=true`.
- Keep `.env` outside version control.
- Back up the `arena_data` volume.
- Email-only access does not verify mailbox ownership. For an open/public deployment, replace it with magic-link or OTP authentication.

## GitHub Actions deployment to Oracle

The `.github/workflows/deploy-oracle.yml` workflow builds the image on a GitHub-hosted runner, uploads it to Oracle, and replaces only the `ai-services-arena` container. The existing Oracle `.env` and `/var/lib/ai-services-arena` data directory are preserved. The arena is bound to `127.0.0.1:8080`; the workflow does not stop or reconfigure other containers.

Add these GitHub repository secrets before running the workflow:

- `ORACLE_HOST`: the Oracle VM address.
- `ORACLE_USER`: the SSH login, usually `ubuntu`.
- `ORACLE_SSH_KEY`: the complete private SSH key.
- `ORACLE_KNOWN_HOSTS`: the matching `known_hosts` line for the VM.

The remote VM must already have Docker, `/opt/ai-services-arena/.env`, and `/var/lib/ai-services-arena`. Run the workflow manually from the Actions tab or push to `main`.
