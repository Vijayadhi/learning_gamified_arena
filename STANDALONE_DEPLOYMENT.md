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
