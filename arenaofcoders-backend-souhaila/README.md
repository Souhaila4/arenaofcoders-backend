# 🏆 ArenaOfCoders — Backend

> REST API powering the **ArenaOfCoders** competitive coding platform — built with **NestJS**, **Prisma ORM**, and **MongoDB**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the App](#running-the-app)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Scripts](#scripts)
- [Récapitulatif des modules (branche souhaila)](#récapitulatif-des-modules-branche-souhaila)

---

## 🔍 Overview

ArenaOfCoders is a competitive coding platform where developers can join coding arenas, compete in hackathons, stream their sessions live, and be ranked on leaderboards. This repository contains the **NestJS backend** that handles all business logic, authentication, data persistence, and third-party integrations.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com) v11 |
| Language | TypeScript |
| ORM | [Prisma](https://www.prisma.io) v6 |
| Database | MongoDB |
| Auth | JWT + Passport.js |
| Email | Nodemailer |
| Live Streaming | [Stream.io Node SDK](https://getstream.io) |
| CV Extraction | AI / Gradio Client |
| GitHub Scraper | GitHub REST API |
| Validation | class-validator + class-transformer |
| API Docs | Swagger (`@nestjs/swagger`) |

---

## 📁 Project Structure

```
src/
├── admin/                 # Admin: users, company requests, certificats NFT (liste), Hedera recipient
├── agents/                # Agents IA (orchestrateur, scoring repo, Groq, etc.)
├── analytics/             # Statistiques / agrégations
├── anti-cheat/            # Proxy HF, scoring vocal, anti-triche hackathon
├── apify/                 # Enrichissement LinkedIn / social via Apify
├── auth/                  # JWT, guards, strategies
├── certificate/           # Certificats NFT (Hedera), génération image
├── common/                # Utilitaires (ex. Hedera account)
├── competition/           # Hackathons, checkpoints, soumissions, DELETE + remboursement escrow
├── cv-extraction/         # Extraction CV + classification spécialité
├── email/                 # Nodemailer
├── email-verification/
├── equipe/                # Équipes hackathon, invitations, radar synergies
├── interview-practice/    # Mock entretien (Groq), rate limit dédié
├── notification/
├── password-reset/
├── prisma/                # Client Prisma injectable
├── recruitment-meeting/   # RDV recrutement entreprise ↔ candidat, email + soft skills
├── scoring/               # Jobs BullMQ / dispatch scoring
├── scraper/               # GitHub REST
├── stream/                # Stream.io (Arena, salles, chat équipe + validation ObjectId)
├── user/
├── wallet/                # Arena Coin, Hedera, escrow, refund, preuves chiffrées, funding admin
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma          # User, Competition, WalletAdminFunding, ArenaCoinFunding, TransactionLog, RecruitmentMeeting, …
└── seed.ts
scripts/
└── generate-cert-template.ts   # npm run cert-template → image `cretif/arena_Certificate.jpg`
```

---

## ✨ Features

- **Authentication** — Register, login, JWT access tokens, refresh flow
- **Email Verification** — Token-based email confirmation on signup
- **Password Reset** — Secure forgot-password / reset-password via email
- **User Profiles** — Avatar, GitHub URL, LinkedIn URL, skill tags, specialty classification
- **CV Extraction** — Upload CV → AI extracts skills and classifies specialty (`FRONTEND`, `BACKEND`, `FULLSTACK`, `MOBILE`, `DATA`, `DEVOPS`, etc.)
- **GitHub Scraper** — Fetches last 3 public repos (stars, forks, languages, README, last commit) via GitHub REST API
- **Social Enrichment** — LinkedIn posts and GitHub repos cached on user profile
- **Live Streaming** — Stream.io integration for real-time coding sessions
- **Leaderboard** — Track `totalChallenges`, `totalWins`, `walletBalance` per user
- **Admin Panel** — User management, banning, role assignment
- **Swagger Docs** — Auto-generated API docs at `/api`
- **Compétitions** — Cycle de vie hackathon, équipes, checkpoints, suppression admin avec remboursement escrow si besoin
- **Wallet / Hedera** — Solde, mint admin, traçabilité fiat→coin (`ArenaCoinFunding`, `WalletAdminFunding`), preuves chiffrées, ancrage
- **Recruitment meeting** — Planification entretien COMPANY/ADMIN → candidat, lien `/meeting/:id`, statuts + score soft skills (JSON)
- **Interview practice** — Tours de conversation mock entretien (Groq), JWT + throttle `interview`

### Récapitulatif des modules (branche souhaila)

| Module | Rôle court |
|--------|------------|
| `auth` | Inscription, login, JWT, rôles `USER` / `ADMIN` / `COMPANY` |
| `user` | Profil, avatar, spécialité, GitHub/LinkedIn, ban |
| `admin` | Modération, demandes entreprise, liste certificats, résolution Hedera |
| `competition` | CRUD hackathons, statuts, checkpoints, `DELETE` + `refundEscrow` |
| `equipe` | Membres, invitations Stream, analyses IA équipe |
| `stream` | Tokens Stream, salles spécialité, chat privé équipe/compétition |
| `wallet` | ARENA coin, transferts, escrow lock/refund, mint, funding |
| `certificate` | Mint NFT certificat, métadonnées, IPFS / Hashscan |
| `notification` | Notifications in-app |
| `scoring` | Files BullMQ, orchestration scores soumissions |
| `agents` | Chaîne d’agents (repo, structure, rapport, Groq) |
| `anti-cheat` | Audio / modèles HF côté serveur |
| `cv-extraction` | Upload CV → spécialité + tags |
| `scraper` / `apify` | GitHub + LinkedIn |
| `analytics` | Métriques |
| `recruitment-meeting` | RDV recrutement + emails HTML |
| `interview-practice` | `POST /interview-practice/turn` |
| `email` / `email-verification` / `password-reset` | Auth email |

---

## ✅ Prerequisites

- Node.js >= 18
- npm >= 9
- A running **MongoDB** instance (local or Atlas)
- (Optional) A **GitHub Personal Access Token** to increase scraper rate limit

---

## 📦 Installation

```bash
# Ce dépôt — branche souhaila (backend ArenaOfCoders)
git clone -b souhaila https://github.com/Souhaila4/arenaofcoders-backend.git
cd arenaofcoders-backend

npm install
npx prisma generate
```

---

## 🔐 Environment Variables

Create a `.env` file at the project root:

```env
# MongoDB connection string
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/arenaofcoders"

# JWT
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# Email (Nodemailer)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="your_email@gmail.com"
MAIL_PASS="your_app_password"

# Stream.io
STREAM_API_KEY="your_stream_api_key"
STREAM_API_SECRET="your_stream_api_secret"

# GitHub Scraper (optional — increases rate limit from 60 to 5000 req/h)
GITHUB_TOKEN="your_github_personal_access_token"

# App
PORT=3000
FRONTEND_URL="http://localhost:3001"
```

---

## 🗄 Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to MongoDB
npx prisma db push

# (Optional) Seed the database
npm run seed

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

---

## 🚀 Running the App

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at **http://localhost:3000**.

---

## 📖 API Documentation

Swagger UI is available at:

```
http://localhost:3000/api
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Start in watch/development mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled production build |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm run format` | Format code with Prettier |
| `npm run seed` | Seed MongoDB with initial data |
| `npm run cert-template` | Génère `cretif/arena_Certificate.jpg` (fond certificat) |
| `npm run create-arena-coin` | Script Hedera arena coin (si `scripts/create-arena-coin.ts` présent) |
| *(postinstall)* | Exécute `prisma generate` après chaque `npm install` |

---

## 📄 License

This project is **UNLICENSED** — private and proprietary.

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
