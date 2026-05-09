import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroqAiService } from '../agents/groq-ai.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UserRole } from '@prisma/client';

/** Réponse IA attendue pour chaque candidat évalué */
interface AiCandidateMatch {
  userId: string;
  score: number;
  reason: string;
}

/** Réponse JSON complète du LLM */
interface AiMatchingResponse {
  rankings: AiCandidateMatch[];
}

@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqAiService,
  ) {}

  // ─────────────────── CRUD OFFRES ───────────────────

  /**
   * Crée une offre d'emploi.
   * Seuls les utilisateurs avec le rôle COMPANY peuvent publier.
   */
  async createJob(userId: string, dto: CreateJobDto) {
    // Vérifier que l'utilisateur est une entreprise
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.COMPANY) {
      throw new ForbiddenException(
        'Seules les entreprises (rôle COMPANY) peuvent publier des offres.',
      );
    }

    return this.prisma.jobPosting.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        targetSpecialty: dto.targetSpecialty,
        location: dto.location?.trim() || null,
        companyName: dto.companyName.trim(),
        createdBy: userId,
      },
    });
  }

  /** Liste toutes les offres actives, triées par date décroissante */
  async getJobs() {
    return this.prisma.jobPosting.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Récupère une offre par ID */
  async getJobById(id: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Offre introuvable.');
    return job;
  }

  // ─────────────────── MATCHING IA ───────────────────

  /**
   * Lance le matching IA pour une offre d'emploi.
   *
   * Étapes :
   * 1. Récupère les utilisateurs filtrés par `targetSpecialty` (économie de tokens)
   * 2. Construit un prompt structuré avec les profils des candidats
   * 3. Envoie au LLM Groq pour classement
   * 4. Sauvegarde les résultats dans JobMatch
   */
  async matchCandidates(jobId: string, userId: string, topN = 10) {
    // Vérifier l'accès
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Offre introuvable.');
    if (job.createdBy !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez lancer le matching que sur vos propres offres.',
      );
    }

    if (!this.groq.hasApiKey()) {
      throw new ServiceUnavailableException(
        'Le matching IA est désactivé : GROQ_API_KEY non configurée.',
      );
    }

    // ──── Étape 1 : Filtrer les candidats par spécialité ────
    // C'est ici qu'on minimise les tokens : on ne récupère QUE les users
    // dont la spécialité correspond à ce que l'entreprise recherche.
    const candidates = await this.prisma.user.findMany({
      where: {
        role: UserRole.USER,
        isEmailVerified: true,
        isBanned: false,
        mainSpecialty: job.targetSpecialty,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mainSpecialty: true,
        skillTags: true,
        githubUrl: true,
        githubRepos: true,
        linkedinUrl: true,
        totalWins: true,
        totalChallenges: true,
      },
    });

    if (candidates.length === 0) {
      return {
        message: `Aucun candidat trouvé pour la spécialité ${job.targetSpecialty}.`,
        matches: [],
      };
    }

    this.logger.log(
      `[MATCHING] Job "${job.title}" → ${candidates.length} candidats ${job.targetSpecialty} trouvés. Envoi au LLM...`,
    );

    // ──── Étape 2 : Construire le prompt ────
    const candidateProfiles = candidates.map((c, i) => {
      const repos =
        c.githubRepos && Array.isArray(c.githubRepos)
          ? (c.githubRepos as Array<{ name?: string; language?: string }>)
              .map((r) => `${r.name || 'repo'} (${r.language || 'N/A'})`)
              .join(', ')
          : 'Aucun repo';

      return `Candidat ${i + 1}:
- ID: ${c.id}
- Nom: ${c.firstName} ${c.lastName}
- Spécialité: ${c.mainSpecialty || 'Non définie'}
- Compétences: ${c.skillTags.length > 0 ? c.skillTags.join(', ') : 'Aucune'}
- GitHub: ${c.githubUrl || 'Non renseigné'}
- Repos GitHub: ${repos}
- LinkedIn: ${c.linkedinUrl || 'Non renseigné'}
- Hackathons gagnés: ${c.totalWins}
- Hackathons participés: ${c.totalChallenges}`;
    });

    const systemPrompt = `Tu es un expert en recrutement technique spécialisé dans le matching candidat-offre.

Tu reçois une description de poste et une liste de profils de développeurs.
Pour chaque candidat, évalue sa pertinence pour le poste sur une échelle de 0 à 100.

IMPORTANT: Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "rankings": [
    { "userId": "<id>", "score": <0-100>, "reason": "<explication courte en français de pourquoi ce candidat correspond ou non>" }
  ]
}

Critères d'évaluation :
- Correspondance des compétences techniques (skillTags) avec la description du poste (40%)
- Qualité et pertinence des projets GitHub (repos, langages) (25%)
- Expérience en hackathons (victoires, participations) (20%)
- Présence de profils sociaux (GitHub, LinkedIn) (15%)

Trie les candidats par score décroissant.
Retourne uniquement les ${Math.min(topN, candidates.length)} meilleurs candidats.`;

    const userPrompt = `OFFRE D'EMPLOI :
Titre : ${job.title}
Entreprise : ${job.companyName}
Description : ${job.description}
Spécialité recherchée : ${job.targetSpecialty}
${job.location ? `Localisation : ${job.location}` : ''}

────────────────────────────

CANDIDATS À ÉVALUER (${candidates.length}) :

${candidateProfiles.join('\n\n')}`;

    // ──── Étape 3 : Appel au LLM Groq ────
    const aiResponse =
      await this.groq.askForJson<AiMatchingResponse>(systemPrompt, userPrompt);

    if (!aiResponse.rankings || !Array.isArray(aiResponse.rankings)) {
      this.logger.warn('[MATCHING] Réponse IA invalide — rankings manquant');
      return { message: 'Erreur IA : format de réponse invalide.', matches: [] };
    }

    // ──── Étape 4 : Sauvegarder les résultats ────
    // Supprimer les anciens matchs pour cette offre (re-matching)
    await this.prisma.jobMatch.deleteMany({ where: { jobId } });

    // Filtrer les résultats valides (userId doit exister dans les candidats)
    const validUserIds = new Set(candidates.map((c) => c.id));
    const validRankings = aiResponse.rankings
      .filter((r) => validUserIds.has(r.userId))
      .slice(0, topN);

    // Sauvegarder les résultats
    const matchData = validRankings.map((r, index) => ({
      jobId,
      userId: r.userId,
      score: Math.min(100, Math.max(0, Math.round(r.score))),
      reason: r.reason || 'Pas de justification fournie',
      rank: index + 1,
    }));

    if (matchData.length > 0) {
      await this.prisma.jobMatch.createMany({ data: matchData });
    }

    this.logger.log(
      `[MATCHING] ✅ ${matchData.length} résultats sauvegardés pour l'offre "${job.title}"`,
    );

    // Retourner les résultats enrichis avec les infos utilisateurs
    return this.getJobMatches(jobId);
  }

  /**
   * Récupère les résultats du dernier matching pour une offre,
   * enrichis avec les informations du profil utilisateur.
   */
  async getJobMatches(jobId: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Offre introuvable.');

    const matches = await this.prisma.jobMatch.findMany({
      where: { jobId },
      orderBy: { rank: 'asc' },
    });

    // Enrichir chaque match avec le profil utilisateur complet
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const user = await this.prisma.user.findUnique({
          where: { id: match.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            mainSpecialty: true,
            skillTags: true,
            githubUrl: true,
            linkedinUrl: true,
            githubRepos: true,
            totalWins: true,
            totalChallenges: true,
            walletBalance: true,
            hederaAccountId: true,
          },
        });

        return {
          ...match,
          user: user || null,
        };
      }),
    );

    return {
      job: {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        targetSpecialty: job.targetSpecialty,
      },
      totalMatches: enrichedMatches.length,
      matches: enrichedMatches,
    };
  }
}
