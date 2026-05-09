# Arena of Coders — Full Technical Documentation

This document describes the **arenabackend** NestJS application: architecture, data model, AI/automation flows, integrations, and operational behavior. It is derived from the current codebase (not from marketing copy alone).

### Viewing diagrams

- **Cursor / VS Code default preview** does not render Mermaid; fenced ` ```mermaid ` blocks look like plain code. Install an extension such as [**Markdown Preview Mermaid Support**](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) (or open the file on **GitHub**, which renders Mermaid in `.md` files).
- **ASCII diagrams** are included below several sections so the flows are readable even without Mermaid.

---

## 1. Purpose and product slice

The backend powers **Arena of Coders**: hackathons/competitions, team formation (**Equipe**), GitHub submissions, automated **repository scoring** via an agent pipeline, optional **AI-generated code detection** for disqualification, **user profiles** enriched with CV parsing and social scraping, **live chat/video** via Stream, **Hedera**-based **Arena Coin** and **certificate NFTs**, and admin/analytics surfaces.

---

## 2. High-level architecture

**ASCII (works in any Markdown preview):**

```
                    ┌─────────────────┐
                    │ Frontend mobile │
                    └────────┬────────┘
                             │ HTTP
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NestJS API (controllers)                      │
│  Auth · User · Competition · Equipe · Scoring · Agents · Wallet  │
│  Certificate · Stream · Notification · Analytics · Prisma          │
└─────┬───────────────────────────────────────────────┬────────────┘
      │                                                │
      │ Prisma                                         │ optional queue
      ▼                                                ▼
┌─────────────┐                                  ┌─────────┐
│  MongoDB    │                                  │  Redis  │
└─────────────┘                                  └─────────┘

External: GitHub API · Groq · HF Inference · HF Gradio · Apify · Stream.io
          · Hedera · Pinata · SMTP
```

**Mermaid** (GitHub / Mermaid-enabled preview only):

```mermaid
flowchart TB
  FE[Frontend / mobile]
  GW[HTTP Controllers]

  subgraph NestAPI["NestJS API"]
    AUTH[AuthModule]
    USER[UserModule]
    COMP[CompetitionModule]
    EQUIP[EquipeModule]
    SCORE[ScoringModule]
    AGENTS[AgentsModule]
    WALLET[WalletModule]
    CERT[CertificateModule]
    STRM[StreamModule]
    NOTIFY[NotificationModule]
    ANAL[AnalyticsModule]
    PRISMA[PrismaService]
  end

  MONGO[(MongoDB)]
  REDIS[(Redis optional)]

  GITHUB[GitHub REST API]
  GROQ[Groq LLM API]
  HF_INF[HF Inference API]
  HF_GRADIO[HF Gradio Space]
  APIFY[Apify Actors]
  STREAM[Stream.io]
  HEDERA[Hedera Testnet]
  PINATA[Pinata IPFS]
  SMTP[SMTP email]

  FE --> GW
  GW --> AUTH
  GW --> USER
  GW --> COMP
  GW --> EQUIP
  GW --> WALLET
  GW --> CERT
  GW --> STRM
  GW --> NOTIFY
  GW --> ANAL
  GW --> PRISMA

  COMP --> SCORE
  SCORE --> AGENTS
  SCORE --> REDIS

  AGENTS --> GITHUB
  AGENTS --> GROQ
  COMP --> HF_INF
  USER --> HF_GRADIO
  USER --> APIFY
  CERT --> PINATA
  CERT --> HEDERA
  WALLET --> HEDERA
  STRM --> STREAM
  AUTH --> SMTP
  PRISMA --> MONGO
```

---

## 3. Technology stack

| Area | Choice |
|------|--------|
| Runtime / language | Node.js, TypeScript |
| Framework | NestJS 11 |
| Database | MongoDB via Prisma 6 |
| Auth | JWT (Passport JWT), bcrypt |
| Validation | `class-validator`, `class-transformer`, global `ValidationPipe` |
| API docs | Swagger UI at `/api` |
| Background jobs | BullMQ + Redis (optional; scoring queue) |
| Resilience | `fetchWithTimeout`, `opossum` circuit breaker (Hugging Face inference) |
| Blockchain | `@hashgraph/sdk` (testnet), fungible Arena Coin + NFT certificates |
| CV / ML client | `@gradio/client` (dynamic ESM import) |

---

## 4. Application bootstrap and HTTP surface

- **Entry**: `src/main.ts` imports `bootstrap-env` first so `.env` is loaded before dynamic modules (e.g. Bull) read `process.env`.
- **CORS**: If `FRONTEND_URL` is set (comma-separated origins), CORS is restricted to those origins with credentials; otherwise CORS is wide open.
- **Static files**: `./uploads` is served under `/uploads/` (avatars, uploads).
- **Global validation**: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **Trust proxy**: `TRUST_PROXY=1` enables `trust proxy` for correct client IP behind proxies (used by throttlers).
- **Listen**: `0.0.0.0:PORT` (default **3000**).

Root module imports: `ConfigModule`, `ThrottlerModule`, `ScheduleModule`, `PrismaModule`, `ScraperModule`, `AuthModule`, `UserModule`, `StreamModule`, `AdminModule`, `CompetitionModule`, `NotificationModule`, `CertificateModule`, `WalletModule`, `AntiCheatModule`, `AnalyticsModule`, `EquipeModule`.

---

## 5. Database model (Prisma / MongoDB)

Key enums: `UserRole` (USER, ADMIN, COMPANY), `Specialty`, `CompetitionStatus`, `ParticipantStatus`, `CheckpointStatus`, `EquipeStatus`, transaction types for Arena Coin.

**User**: auth fields, profile, **CV URL**, **mainSpecialty** and **skillTags** (AI + enrichment), **githubUrl** / **linkedinUrl**, optional **linkedinPosts** / **githubRepos** JSON, **walletBalance**, **hederaAccountId**, **fcmToken**, stats (`totalChallenges`, `totalWins`), ban fields.

**Competition**: title, description, difficulty, specialty, dates, **status**, **rewardPool**, **antiCheatEnabled**, **antiCheatThreshold**, **topN**, checkpoints, equipes.

**CompetitionParticipant**: unique `(competitionId, userId)`, optional **equipeId**, **hackathonFaceUrl**, **githubUrl**, **antiCheatScore**, **score**, **scoringReport** (JSON from pipeline), **submittedAt**, **isWinner**.

**Equipe**: per-competition team; **githubUrl**, **score**, **scoringReport**, **antiCheatScore**, **submittedAt** at team level; members and invitations.

**CheckpointSubmission**: proof URL, notes, status, per checkpoint + participant.

**Certificate**: Hedera NFT metadata — **tokenId**, **serial**, IPFS URLs, optional transfer tracking.

**TransactionLog**: Hedera-aligned audit trail for Arena Coin (mint, escrow, reward, refund).

**CompanyRoleRequest**, **EmailVerification**, **PasswordReset**, **Notification** support ancillary flows.

**Entity relationships (text):**

```
User ──< CompetitionParticipant >── Competition
User ──< EquipeMember >── Equipe ──< Competition
Competition ──< CompetitionCheckpoint ──< CheckpointSubmission >── CompetitionParticipant
User ──< Certificate
```

```mermaid
erDiagram
  User ||--o{ CompetitionParticipant : enters
  User ||--o{ EquipeMember : "team member"
  Competition ||--o{ CompetitionParticipant : has
  Competition ||--o{ Equipe : has
  Equipe ||--o{ EquipeMember : has
  CompetitionParticipant }o--|| Competition : "for"
  CompetitionParticipant }o--o| Equipe : "optional team"
  Competition ||--o{ CompetitionCheckpoint : defines
  CompetitionCheckpoint ||--o{ CheckpointSubmission : receives
  CompetitionParticipant ||--o{ CheckpointSubmission : submits
  User ||--o{ Certificate : earns
```

---

## 6. AI and ML-related systems

The project uses several **external models and automation layers**. They serve different purposes.

### 6.1 Groq LLM (hackathon judging)

- **Service**: `GroqAiService` → `https://api.groq.com/openai/v1/chat/completions`.
- **Config**: `GROQ_API_KEY` (required for AI path); `GROQ_MODEL` (default `llama-3.3-70b-versatile`); `GROQ_HTTP_TIMEOUT_MS` (default 90s).
- **Contract**: `askForJson<T>()` forces `response_format: json_object`, temperature **0.2**, parses assistant content as JSON.
- **Consumers**:
  - **CodeJudgeAgent**: scores **complexity**, **codeQuality**, **architecture** (0–10 each) from serialized **Evidence** (including code samples). If `competitionTopic` is set (from competition **description**), the prompt insists the model verify the **code** matches the topic, not just the README.
  - **ProductJudgeAgent**: scores **innovation**, **impact**, **usability** (0–10) with similar topic alignment instructions.
- **Fallback**: If no API key or the call fails, both judges use **heuristic** scores derived from file counts, tests, README presence, structure flags.

### 6.2 Hugging Face — AI-text detector (submission gate)

- **Service**: `AntiCheatService.analyzeRepository(githubUrl)`.
- **Model**: `roberta-base-openai-detector` via Hugging Face Inference API.
- **Input**: README raw content fetched from GitHub (truncated ~2000 chars).
- **Output**: Interprets **Fake** / `LABEL_1` probability → integer **0–100** (“% AI-generated” style score).
- **Circuit breaker**: `opossum` with configurable timeouts and thresholds (`HUGGINGFACE_*` env vars).
- **Fallback**: Deterministic **mock** score from URL hash if token missing or errors.
- **Policy** (in `CompetitionService.submitWork`): If `competition.antiCheatEnabled` and score **>** `antiCheatThreshold`, participant is **DISQUALIFIED** (not the scoring pipeline penalty).

### 6.3 Hugging Face Gradio — CV extraction

- **Service**: `CvExtractionService.extractFromBuffer`.
- **Space**: `kaaboura/cv-extraction-prediction`, endpoint `/predict_cv`.
- **Input**: `.docx` buffer; optional `HUGGINGFACE_TOKEN` for private space; `CV_EXTRACTION_API_KEY` passed as Gradio `api_key` parameter.
- **Output**: Normalized **prediction** string → mapped to Prisma `Specialty` where possible; **skill** list capped (length and count limits).
- **Signup**: `AuthService.signUp` calls CV extraction after user creation; failures are swallowed so signup still succeeds.

### 6.4 Heuristic “anti-cheat” in the scoring pipeline (not HF)

- **AntiCheatAgent** inspects **Evidence** only (commits, file count, contributors, tests, sample count) and produces a **penalty** sum and **flags**. This is separate from Hugging Face disqualification.

### 6.5 Apify (not an LLM; data enrichment)

- **ApifyService**: LinkedIn profile skills, LinkedIn posts, GitHub repo scrapes via configured **Actors** (`APIFY_API_TOKEN`, sync timeout ~60s).
- Used during signup / profile enrichment to merge into **skillTags** and JSON profile fields.

### 6.6 Écosystème IA : Validation des Checkpoints et Anti-Triche Finale (Hugging Face)

Afin de garantir l'intégrité du hackathon de bout en bout, l'application intègre un **écosystème de trois modèles d'Intelligence Artificielle** intervenant à deux étapes clés de la compétition : la validation intermédiaire des **Checkpoints** (Environnement et Vocal) et l'évaluation de la **Soumission Finale** (AntiCheat de code). 

Contrairement à des scripts locaux simples, ces modèles sont déployés en tant que micro-services robustes sur **Hugging Face Spaces (via FastAPI)**. Le backend NestJS agit comme un **Proxy Sécurisé** (API Gateway) pour le frontend Flutter, protégeant ainsi les tokens d'accès et centralisant la logique métier.

**Architecture d'Intégration (ASCII)** :
```text
[ PHASES DU HACKATHON ]

1. PHASE DES CHECKPOINTS (Intermédiaire)
 ┌─────────┐ multipart  ┌────────────────┐ proxy + token  ┌──────────────────────┐
 │ Flutter ├───────────►│ NestJS Backend ├───────────────►│ Hugging Face Spaces  │
 │ (Mobile)│ image/audio│ (AntiCheatCtrl)│                │ - Check Environnement│
 └─────────┘            └────────────────┘                │ - Check Vocal        │
                                                          └──────────────────────┘

2. PHASE DE SOUMISSION FINALE (Code)
                        ┌────────────────┐ payload JSON   ┌──────────────────────┐
                        │ NestJS Backend ├───────────────►│ API FastAPI ML       │
                        │ (Scoring Pipe) │                │ - AntiCheat Code     │
                        └────────────────┘                └──────────────────────┘
```

**Architecture d'Intégration (Mermaid)** :
```mermaid
flowchart TB
  subgraph Phase 1 : Validation des Checkpoints
    direction LR
    F1[Frontend Flutter<br/>Image / Audio] -- "Multipart<br/>HTTP" --> B1[Backend NestJS<br/>AntiCheatController]
    B1 -- "Axios Proxy<br/>+ HF Token" --> HF1[Hugging Face Spaces<br/>Environnement & Vocal]
  end

  subgraph Phase 2 : Soumission Finale
    direction LR
    B2[Backend NestJS<br/>Scoring Pipeline] -- "JSON Payload<br/>(Code Source)" --> HF2[API FastAPI<br/>AntiCheat Code]
  end
```

#### 1. Modèle Check Envirement (Validation Visuelle de l'Espace de Travail)
- **Le Besoin Métier** : S'assurer que le participant est bien devant son ordinateur, en train de coder, et qu'il n'utilise pas de méthodes de triche visuelle (photo d'un autre écran, images d'illustration trouvées sur internet, ou usurpation d'identité).
- **Architecture Technique (ML)** : Ce modèle repose sur **Hugging Face CLIP** (`openai/clip-vit-base-patch32`) pour réaliser une classification visuelle *Zero-Shot* extrêmement rapide (génération d'embeddings à 512 dimensions). Il intègre également la bibliothèque **DeepFace** (modèle VGG-Face) pour effectuer une vérification biométrique en croisant le visage présent sur la photo de l'environnement avec l'avatar de référence du participant.
- **Innovation (Mémoire FAISS)** : Le modèle possède une base de données vectorielle **FAISS** (IndexFlatL2). Lorsqu'une image obtient un score *Zero-Shot* de très haute confiance (>90%), son embedding est mémorisé. Lors des vérifications futures, le modèle calcule la distance L2 avec ses souvenirs : si l'environnement est similaire à un setup validé, le système accorde un "bonus de confiance" adaptatif (jusqu'à +20%).
- **Flux de Consommation (Frontend & Backend)** :
  1. **Frontend (Flutter)** : L'application mobile guide le participant pour prendre une photo (visage + écran) en utilisant `ImagePicker`. Le fichier est formaté et envoyé au backend via une requête HTTP Multipart.
  2. **Backend (NestJS)** : Le contrôleur dédié (`AntiCheatController`, `POST /validate-image`) intercepte le fichier grâce à `@UseInterceptors(FileFieldsInterceptor)`. Il crée un objet `FormData` avec le buffer en mémoire, puis déclenche un appel `axios.post` vers `negzaoui-antiimagesenvirement.hf.space/scan`. Le secret `HUGGINGFACE_TOKEN` est injecté discrètement dans les headers `Authorization`, assurant une communication Cloud-to-Cloud sécurisée. Le résultat détermine immédiatement l'acceptation ou le rejet du checkpoint visuel.

#### 2. Modèle Check Vocal (Analyse de la Cohérence Sémantique Audio)
- **Le Besoin Métier** : Empêcher un candidat de soumettre du code sans le comprendre. Le candidat doit s'enregistrer vocalement en expliquant son travail. L'IA doit vérifier s'il parle réellement de développement logiciel ou s'il s'agit de bruits de fond, de discussions hors sujet (jeux, sommeil, repas).
- **Architecture Technique (ML)** : Le modèle effectue d'abord du Speech-to-Text grâce à **Whisper** (`openai/whisper-tiny`), capable de retranscrire des audios multilingues. Le texte extrait passe ensuite dans un pipeline NLP *Zero-Shot* basé sur **mDeBERTa-v3** (`MoritzLaurer/mDeBERTa-v3-base-mnli-xnli`) pour classer sémantiquement les propos.
- **Innovation (Mémoire Sémantique)** : La transcription est encodée en un vecteur de 384 dimensions par `sentence-transformers/all-MiniLM-L6-v2`. Le système compare ce vecteur aux explications précédemment validées via FAISS. Si la similarité cosinus excède 0.85, le modèle comprend que le candidat utilise le "jargon technique" de l'épreuve et lui accorde un bonus de +20%.
- **Flux de Consommation (Frontend & Backend)** :
  1. **Frontend (Flutter)** : Le participant enregistre son explication via le package `record`. L'audio est encodé en `AudioEncoder.aacLc` (format M4A) pour optimiser le transfert réseau, puis poussé au serveur.
  2. **Backend (NestJS)** : Le routeur `POST /validate-audio` agit à nouveau en proxy vers `negzaoui-modelevocal.hf.space/scan-audio`. Une gestion d'erreur complexe, incluant un *timeout* étendu à 90 secondes, est configurée dans Axios pour absorber intelligemment le temps de réveil ("cold start") inhérent aux espaces Hugging Face privés.

#### 3. Modèle AntiCheat (Évaluation Avancée du Code Source)
- **Le Besoin Métier** : Intercepter les dépôts GitHub contenant du code généré massivement par IA, plagié sur d'autres projets, ou simplement copié-collé sans effort de logique algorithmique.
- **Architecture Technique (ML)** : Il s'agit d'une API FastAPI exécutant un modèle de Machine Learning. Il extrait d'abord de nombreuses caractéristiques (features) structurelles du code (complexité cyclomatique, variance d'indentation, fréquence des commentaires). Ces données nourrissent un **RandomForestClassifier** (Scikit-Learn) pour évaluer la probabilité d'une génération par IA. En parallèle, une analyse de texte par **TF-IDF + Cosine Similarity** détecte les plagiats partiels ou totaux.
- **Système de Scoring** : Le verdict final est pondéré selon une formule mathématique précise : `FinalScore = 0.4 * score_ia + 0.3 * score_plagiat + 0.3 * score_copy_paste`.
- **Flux de Consommation & Entraînement** :
  - **Backend (NestJS)** : Ce modèle intervient lors du pipeline d'orchestration (`Scoring Pipeline`). L'agent d'orchestration extrait le code source et l'envoie (via payload JSON) à l'API. La pénalité retournée impacte directement le score de l'équipe.
  - **Apprentissage Actif (Human-in-the-loop)** : Contrairement aux deux modèles précédents, l'apprentissage de l'AntiCheat se fait par cycles contrôlés. Chaque analyse est sauvegardée. Une route `POST /human_decision` permet aux superviseurs de flagger manuellement les codes suspects, constituant un nouveau dataset d'entraînement pour générer un `.pkl` plus précis via un script de ré-entraînement (`src.training`).

---

## 7. Agent scoring pipeline (orchestrator)

The **OrchestratorAgent** runs a **linear** pipeline and reports progress **10 → 100** in steps of 10 for optional Bull/job callbacks.

**Pipeline order (text):**

```
ScoringDispatcher → ScoringPipelineService.run()
  → OrchestratorAgent.evaluateRepo()
      → GitHub: repo / tree / readme / languages / commits / contributors
      → Structure + code sampling
      → EvidenceBuilderAgent → AntiCheatAgent → Groq judges → ScoringAgent → ReportAgent
  → prisma.competitionParticipant.update(score, scoringReport)
```

```mermaid
sequenceDiagram
  participant Disp as ScoringDispatcher
  participant Pipe as ScoringPipelineService
  participant Orch as OrchestratorAgent
  participant GH as GitHubApiService
  participant GQ as GroqAiService

  Disp->>Pipe: run(participantId, githubUrl)
  Pipe->>Orch: evaluateRepo(githubUrl, context)
  Orch->>GH: Repo metadata / tree / readme / languages
  Orch->>GH: Commits / contributors
  Note over Orch: Structure + code sampling (raw files)
  Orch->>Orch: EvidenceBuilderAgent
  Orch->>Orch: AntiCheatAgent (heuristic penalty)
  Orch->>GQ: CodeJudge + ProductJudge (or fallback)
  Orch->>Orch: ScoringAgent (numeric blend)
  Orch->>Orch: ReportAgent (highlights/warnings)
  Orch-->>Pipe: OrchestratorResult
  Pipe->>Pipe: prisma.competitionParticipant.update(score, scoringReport)
```

### 7.1 Agent responsibilities

| Agent | Input | Output |
|-------|--------|--------|
| **RepoExtractorAgent** | GitHub URL string | `RepoMetadata` (readme, recursive tree, languages, counts, dates) |
| **RepoActivityAgent** | `RepoMetadata` | Approx. commit count (Link header), contributor count, last commit |
| **StructureAnalysisAgent** | `RepoMetadata` | Backend/frontend/tests/CI flags, config files, `architectureQuality` 1–5 |
| **CodeSamplerAgent** | `RepoMetadata` | Up to 8 code files: entry/API/component/heuristic “largest”, snippets truncated |
| **EvidenceBuilderAgent** | Repo + activity + structure + samples | `Evidence` (stack tags, deps from readme+paths, readme summary) |
| **AntiCheatAgent** | `Evidence` | `penalty`, `flags`, `suspicious` |
| **CodeJudgeAgent** | `Evidence` | Groq or fallback **CodeJudgeScore** |
| **ProductJudgeAgent** | `Evidence` | Groq or fallback **ProductJudgeScore** |
| **ScoringAgent** | Code + product scores + anti-cheat | `finalScore`, `breakdown` |
| **ReportAgent** | Evidence + flags + score | Human-readable **title/summary/highlights/warnings** |

### 7.2 Final score formula (`ScoringAgent`)

All judge dimensions are on **0–10**; the service computes weighted contributions, then scales to **0–100**:

- `complexityWeighted = complexity × 0.3`
- `innovationWeighted = innovation × 0.25`
- `impactWeighted = impact × 0.2`
- `qualityWeighted = codeQuality × 0.25`

`rawBeforePenalty` = sum of the four.  
`finalScore` = `clamp(rawBeforePenalty × 10, 0, 100)` (two decimal places in code).

**Important implementation notes** (for maintainers):

1. **`architecture`** from **CodeJudge** is **not** part of this weighted sum (only **codeQuality** and **complexity** from the code judge are used).
2. **`antiCheat.penalty`** is stored in `breakdown.penalty` but **not subtracted** from `finalScore` in `ScoringAgent`; heuristic penalty is informational unless you change that logic.

### 7.3 Persistence (`ScoringPipelineService`)

After a successful run, `competitionParticipant` is updated with:

- `score`: `finalScore`
- `scoringReport`: JSON with codeJudge, productJudge, antiCheat, report text fields, and `breakdown`

**Competition topic** passed to Groq is `competition.description` from the DB.

---

## 8. Scoring dispatch (sync vs queue)

- **Module**: `ScoringModule.register()` — if `QUEUE_SCORING_ENABLED === 'true'`, registers **BullMQ** with Redis (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`), **`ScoringQueueProcessor`**, and **Bull Board** at `/queues`.
- **ScoringDispatcherService.dispatchAfterSubmit**: After a successful GitHub submit HTTP handler, either enqueues a job (`scoring-{participantId}`) or **fire-and-forgets** `pipeline.run()` inline. Duplicate job IDs are ignored; enqueue failures fall back to inline.

Worker concurrency: `SCORING_WORKER_CONCURRENCY` (default **2**).

---

## 9. Competition and submission flows

### 9.1 Work submission (`submitWork`)

- Competition must be **RUNNING**.
- Final GitHub submission window: opens **20 minutes before** `endDate` (French locale message for opening time).
- User must be registered; if in an **Equipe**, only **LEADER** may submit; team cannot double-submit.
- **Anti-cheat path** (if enabled): Hugging Face score vs threshold → disqualify or accept; on accept, updates participant (+ team transactionally if needed), then **dispatch scoring**.
- **Without anti-cheat**: marks **SUBMITTED**, dispatches scoring similarly.

### 9.2 Checkpoints

- Separate **checkpoint** submit flow with time windows (`CHECKPOINT_SUBMISSION_WINDOW_MINUTES` referenced in service), status transitions, and cron-driven **missed** checkpoint handling (disqualification after **≥ 3** failures — see `CompetitionService`).

### 9.3 Rate limiting (`ThrottlerModule`)

- **`submit`**: TTL/limit from `RATE_LIMIT_SUBMIT_TTL_MS`, `RATE_LIMIT_SUBMIT_LIMIT` — keyed by user id or IP.
- **`checkpoint`**: `RATE_LIMIT_CHECKPOINT_TTL_MS`, `RATE_LIMIT_CHECKPOINT_LIMIT`.

Error message: French **“Trop de requêtes…”**.

---

## 10. Authentication and user lifecycle

- **JWT**: `JWT_SECRET`, `JWT_EXPIRES_IN` (default 7d); strategy in `jwt.strategy.ts`.
- **Sign up**: hashes password (bcrypt rounds **12**), stores user; optional **avatar** to `uploads/avatars`; **CV** buffer → Gradio extraction; **LinkedIn** → Apify skills merge; additional flows in `AuthService` (GitHub scraping via `ScraperService`, Stream membership hooks — see full file).
- **Email**: `EmailModule` uses SMTP config (e.g. `SMTP_USER`, `SMTP_PASSWORD` — prefer env-only in production).
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `AdminGuard` on admin routes.

---

## 11. Stream (chat / video)

- **StreamService**: `StreamClient` when `STREAM_API_KEY` / `STREAM_API_SECRET` set.
- **Tokens**: `createUserToken` with clock-skew handling (iat in the past).
- **Channels**: `ensureArenaMember` (arena-live), `ensureRoomMember` (sanitized room id), **team channels** helpers for Equipe/competition (see remainder of `stream.service.ts`).

---

## 12. Wallet and Hedera

- **WalletService**: Hedera **testnet** client from `HEDERA_ACCOUNT_ID` / `HEDERA_PRIVATE_KEY`. Arena Coin fungible token id `ARENA_COIN_TOKEN_ID`, decimals from `ARENA_COIN_DECIMALS`. Operations include admin mint to company, escrow/reward flows, `TransactionLog` rows, mirror API helpers (`HEDERA_MIRROR_BASE_URL`).
- **CertificateService**: Renders certificate image (**sharp**), uploads to **Pinata** (`PINATA_API_KEY`, `PINATA_SECRET_API_KEY`), builds NFT metadata, mints NFT on Hedera, optionally transfers to user `hederaAccountId`.

---

## 13. Other modules (concise)

| Module | Role |
|--------|------|
| **AdminModule** | Admin operations; may call **n8n** webhook (`N8N_WEBHOOK_URL` / test URL) for emails |
| **AnalyticsModule** | Aggregates developers with scores, wins, filters |
| **NotificationModule** | CRUD-style read/mark read for `Notification` |
| **ScraperModule** | GitHub user/repo enrichment (`GITHUB_TOKEN` optional) |
| **EquipeModule** | Team creation, invites, leader rules; integrates with competition/stream |
| **PasswordReset / EmailVerification** | Code-based flows (models in Prisma) |
| **AntiCheatModule** | Exposes service + controller patterns (HF token check in controller) |

---

## 14. Environment variables (reference)

Below are variables **referenced in code** (non-exhaustive of `.env`; do not commit secrets).

| Variable | Used for |
|----------|-----------|
| `DATABASE_URL` | MongoDB |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth |
| `PORT`, `FRONTEND_URL`, `TRUST_PROXY` | HTTP |
| `GITHUB_TOKEN`, `GITHUB_HTTP_TIMEOUT_MS` | GitHub API for agents/scraper |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_HTTP_TIMEOUT_MS` | LLM judging |
| `HUGGINGFACE_TOKEN` | HF inference + Gradio + anti-cheat |
| `HUGGINGFACE_HTTP_TIMEOUT_MS`, `HUGGINGFACE_CB_*` | Anti-cheat circuit breaker |
| `CV_EXTRACTION_API_KEY` | Gradio CV space |
| `APIFY_API_TOKEN` | LinkedIn/GitHub actors |
| `STREAM_API_KEY`, `STREAM_API_SECRET` | Stream.io |
| `SMTP_USER`, `SMTP_PASSWORD` | Email |
| `QUEUE_SCORING_ENABLED`, `REDIS_*`, `SCORING_*` | BullMQ scoring |
| `RATE_LIMIT_*` | Throttling |
| `HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`, `ARENA_COIN_TOKEN_ID`, `ARENA_COIN_DECIMALS`, `HEDERA_MIRROR_BASE_URL` | Wallet / ledger |
| `PINATA_API_KEY`, `PINATA_SECRET_API_KEY` | Certificate IPFS |
| `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_TEST_URL` | Admin automation |

`docker-compose.yml` provides local **Redis** only.

---

## 15. Repository layout (src)

- **`agents/`** — GitHub integration, Groq, full orchestrated pipeline types (`agents.types.ts`).
- **`scoring/`** — Pipeline persistence, dispatcher, Bull processor.
- **`competition/`** — Lifecycle, submit, checkpoints, winner logic, leaderboards.
- **`equipe/`** — Teams.
- **`anti-cheat/`** — HF inference service for submit gate.
- **`cv-extraction/`** — Gradio CV.
- **`apify/`**, **`scraper/`** — Profile enrichment.
- **`stream/`** — Stream.io + room config.
- **`wallet/`**, **`certificate/`** — Hedera + Pinata.
- **`auth/`**, **`user/`**, **`admin/`**, **`email/`**, **`notification/`**, **`analytics/`**.
- **`prisma/`**, **`common/`** — DB client, Hedera helpers, `fetchWithTimeout`.

Root **utility scripts** (`create-*-hackathon.ts`, `fix-checkpoints.ts`, etc.) are one-off maintenance/seed helpers, not part of the runtime server.

---

## 16. Mental model: two different “anti-cheat” concepts

**ASCII (works in any Markdown preview):**

```
ON GITHUB SUBMIT (if antiCheat enabled)
──────────────────────────────────────
  Hugging Face detector (README → score 0–100)
           │
           ├─ score > threshold ──► DISQUALIFY participant
           │
           └─ score ≤ threshold ──► status SUBMITTED
                                         │
                                         ▼
ASYNC SCORING PIPELINE (separate system)
────────────────────────────────────────
  AntiCheatAgent (heuristic: commits, files, tests, …)
           │
           ▼
  penalty + flags stored in scoringReport
           │
           ▼
  ScoringAgent → final numeric score (penalty not subtracted in code today)
```

**Mermaid** (use TB instead of LR for wider renderer support; no nested subgraph edges to OK→Pipeline in some engines):

```mermaid
flowchart TB
  A[Hugging Face detector]
  B{score greater than threshold?}
  DQ[Disqualify participant]
  OK[Allow SUBMITTED]
  C[AntiCheatAgent heuristics]
  D[penalty and flags in report]
  E[ScoringAgent numeric score]

  A --> B
  B -->|yes| DQ
  B -->|no| OK
  OK --> C
  C --> D
  D --> E
```

---

## 17. API discovery

Interactive OpenAPI: **`/api`** (Swagger). Controllers are annotated with `@nestjs/swagger`; JWT bearer **`access-token`** security scheme.

---

## 18. Testing and quality

- Jest unit tests: `*.spec.ts` (auth, user, competition anti-cheat, app controller).
- Commands: `npm run test`, `npm run test:e2e`, `npm run test:cov`.

---

*Generated to reflect the repository state as of the documentation authoring pass. For behavioral guarantees, always treat the source files as authoritative.*
