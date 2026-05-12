---
name: arenaofcoders-backend-main
description: >-
  Runs and operates the Arena NestJS backend (Prisma, Redis/BullMQ, Hedera wallet).
  Use when starting or debugging arenaofcoders-backend-main, env/DB, or API for the
  arena 2 mobile app (port 3000).
disable-model-invocation: true
---

# arenaofcoders-backend-main

## Run (development)

From the backend root (`arenaofcoders-backend-main/arenaofcoders-backend-main`):

```bash
npm run start:dev
```

Default Nest listen is **port 3000** unless overridden in `.env`.

## Prerequisites

- Node.js and npm installed.
- `.env` present at backend root (copy from team template if missing); includes DB URL, JWT, Redis, Hedera keys as required by the project.
- PostgreSQL reachable for Prisma; run migrations if schema changed:

```bash
npx prisma migrate deploy
```

(or `npx prisma db push` only for local throwaway DB — prefer migrate in team workflows.)

## Other useful scripts

- `npm run build` — compile to `dist/`.
- `npm run start:prod` — run compiled `dist/main` (`start:prod` script).
- `npm run seed` — Prisma seed.
- `npm run create-arena-coin` — Hedera arena coin helper script.

## Mobile app

Point the Flutter `ApiService.baseUrl` at `http://<host>:3000` (emulator often `10.0.2.2:3000` for Android).
