import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { Specialty, User } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  // Prisma generated 'favoriteUser' property is now available after 'db push'
  private readonly groqApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.groqApiKey = this.config.get<string>('GROQ_API_KEY', '');
    if (!this.groqApiKey) {
      this.logger.warn('GROQ_API_KEY is not set — AI matching will fail');
    }
  }

  // ─────────────────── CRUD ───────────────────

  /** Create a job posting (COMPANY only) */
  async createJob(dto: CreateJobDto, userId: string) {
    const job = await this.prisma.jobPosting.create({
      data: {
        title: dto.title,
        description: dto.description,
        targetSpecialty: dto.targetSpecialty,
        companyName: dto.companyName,
        location: dto.location,
        createdBy: userId,
      },
    });
    this.logger.log(`Job created: ${job.id} by user ${userId}`);
    return job;
  }

  /** List all active job postings */
  async getJobs() {
    return this.prisma.jobPosting.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single job posting by ID */
  async getJobById(id: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  /** Get existing match results for a job */
  async getJobMatches(jobId: string, companyId?: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Job not found');

    const matches = await this.prisma.jobMatch.findMany({
      where: { jobId },
      orderBy: { rank: 'asc' },
    });

    // Enrich each match with user data
    const enrichedMatches = await Promise.all(
      matches.map(async (m) => {
        const user = await this.prisma.user.findUnique({
          where: { id: m.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            mainSpecialty: true,
            skillTags: true,
            githubUrl: true,
            linkedinUrl: true,
            githubRepos: true,
            avatarUrl: true,
            totalWins: true,
            totalChallenges: true,
            walletBalance: true,
            hederaAccountId: true,
          },
        });
        let isFavorite = false;
        if (companyId) {
          const fav = await (this.prisma as any).favoriteUser.findUnique({
            where: {
              companyId_userId: { companyId, userId: m.userId },
            },
          });
          isFavorite = !!fav;
        }

        return { ...m, user, isFavorite };
      }),
    );

    return {
      job: {
        id: job.id,
        title: job.title,
        targetSpecialty: job.targetSpecialty,
      },
      totalMatches: enrichedMatches.length,
      matches: enrichedMatches,
    };
  }

  // ─────────────────── AI MATCHING (GROQ) ───────────────────

  /**
   * Run Groq AI matching for a job posting.
   *
   * Flow:
   * 1. Fetch job details
   * 2. Filter users by targetSpecialty (token optimization)
   * 3. Build a compact profile summary per user
   * 4. Send to Groq API for ranking
   * 5. Persist results in JobMatch collection
   * 6. Return ranked results with user data
   */
  async matchCandidates(
    jobId: string,
    userId: string,
    topN: number = 10,
  ) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('Job not found');

    // Only the job owner can trigger matching
    if (job.createdBy !== userId) {
      throw new ForbiddenException('Only the job owner can run matching');
    }

    // 1. Fetch candidates filtered by specialty (token optimization!)
    const candidates = await this.prisma.user.findMany({
      where: {
        role: 'USER',
        mainSpecialty: job.targetSpecialty,
        isBanned: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mainSpecialty: true,
        skillTags: true,
        githubUrl: true,
        linkedinUrl: true,
        githubRepos: true,
        totalWins: true,
        totalChallenges: true,
        avatarUrl: true,
        walletBalance: true,
        hederaAccountId: true,
        role: true,
      },
    });

    this.logger.log(
      `Matching job "${job.title}" (${job.targetSpecialty}) — ` +
        `${candidates.length} candidate(s) found`,
    );

    if (candidates.length === 0) {
      // Clear old matches and return empty
      await this.prisma.jobMatch.deleteMany({ where: { jobId } });
      return {
        job: {
          id: job.id,
          title: job.title,
          targetSpecialty: job.targetSpecialty,
        },
        totalMatches: 0,
        matches: [],
      };
    }

    // 2. Build compact profiles for AI (minimize tokens)
    const candidateProfiles = candidates.map((c, idx) => {
      const repos = (c.githubRepos as any[]) || [];
      const repoSummary = repos
        .slice(0, 3)
        .map(
          (r: any) =>
            `${r.name || 'repo'}(${r.language || '?'}, ★${r.stars || 0})`,
        )
        .join(', ');

      return (
        `[${idx + 1}] ID:${c.id} | ${c.firstName} ${c.lastName} | ` +
        `Skills: ${c.skillTags.join(', ') || 'none'} | ` +
        `Hackathons: ${c.totalChallenges}, Wins: ${c.totalWins} | ` +
        `GitHub: ${c.githubUrl || 'N/A'} | Repos: ${repoSummary || 'none'} | ` +
        `LinkedIn: ${c.linkedinUrl || 'N/A'}`
      );
    });

    // 3. Call Groq API
    const rankings = await this.callGroqMatching(
      job.title,
      job.description,
      job.targetSpecialty,
      candidateProfiles,
      Math.min(topN, candidates.length),
    );

    // 4. Persist matches (upsert to allow re-runs)
    await this.prisma.jobMatch.deleteMany({ where: { jobId } });

    const matchRecords = rankings.map((r, idx) => ({
      jobId,
      userId: r.userId,
      score: r.score,
      reason: r.reason,
      rank: idx + 1,
    }));

    if (matchRecords.length > 0) {
      await this.prisma.jobMatch.createMany({ data: matchRecords });
    }

    // 5. Return enriched results
    const enrichedMatches = matchRecords.map((m) => {
      const user = candidates.find((c) => c.id === m.userId);
      return { ...m, id: `${m.jobId}_${m.userId}`, user, createdAt: new Date() };
    });

    return {
      job: {
        id: job.id,
        title: job.title,
        targetSpecialty: job.targetSpecialty,
      },
      totalMatches: enrichedMatches.length,
      matches: enrichedMatches,
    };
  }

  // ─────────────────── GROQ API CALL ───────────────────

  private async callGroqMatching(
    jobTitle: string,
    jobDescription: string,
    specialty: Specialty,
    candidateProfiles: string[],
    topN: number,
  ): Promise<Array<{ userId: string; score: number; reason: string }>> {
    const systemPrompt = `You are an expert technical recruiter AI for Arena of Coders platform.
Your task is to rank candidates for a job posting based on their skills, experience, GitHub repos, and hackathon track record.

RULES:
- Return a JSON array of objects with fields: userId, score (0-100), reason (1-2 sentences in French explaining WHY this candidate is a good match).
- Rank by relevance to the job description. Score 80+ = excellent match, 60-79 = good, 40-59 = moderate, <40 = weak.
- Consider: skill tags match, GitHub repos relevance, hackathon wins, overall profile strength.
- Return at most ${topN} candidates, sorted by score descending.
- ONLY return valid JSON. No markdown, no explanation outside the array.`;

    const userPrompt = `JOB: "${jobTitle}" (${specialty})
DESCRIPTION: ${jobDescription}

CANDIDATES:
${candidateProfiles.join('\n')}

Return the top ${topN} candidates as a JSON array:
[{"userId":"...","score":85,"reason":"..."}, ...]`;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60_000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content || '';
      this.logger.debug(`Groq raw response: ${content.substring(0, 200)}...`);

      // Parse the JSON response
      const parsed = JSON.parse(content);

      // Handle both {"candidates": [...]} and direct array formats
      let rankings: any[];
      if (Array.isArray(parsed)) {
        rankings = parsed;
      } else if (parsed.candidates && Array.isArray(parsed.candidates)) {
        rankings = parsed.candidates;
      } else if (parsed.results && Array.isArray(parsed.results)) {
        rankings = parsed.results;
      } else if (parsed.matches && Array.isArray(parsed.matches)) {
        rankings = parsed.matches;
      } else {
        // Try to find the first array property
        const arrayProp = Object.values(parsed).find((v) => Array.isArray(v));
        if (arrayProp) {
          rankings = arrayProp as any[];
        } else {
          this.logger.error(`Unexpected Groq response shape: ${content}`);
          throw new Error('Invalid AI response format');
        }
      }

      // Validate and extract user IDs
      const validCandidateIds = new Set(
        candidateProfiles.map((p) => {
          const match = p.match(/ID:([a-f0-9]+)/);
          return match ? match[1] : '';
        }),
      );

      return rankings
        .filter(
          (r: any) =>
            r.userId &&
            typeof r.score === 'number' &&
            typeof r.reason === 'string',
        )
        .map((r: any) => ({
          userId: r.userId,
          score: Math.min(100, Math.max(0, Math.round(r.score))),
          reason: r.reason,
        }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Groq API error: ${message}`);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        this.logger.error(
          `Groq HTTP ${status}: ${JSON.stringify(data).substring(0, 300)}`,
        );
      }

      throw new InternalServerErrorException(
        `AI matching failed: ${message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // FAVORITES
  // ─────────────────────────────────────────────────────────────────


  async toggleFavorite(companyId: string, userId: string) {
    this.logger.log(`Toggling favorite for company ${companyId} and user ${userId}`);
    const existing = await (this.prisma as any).favoriteUser.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });

    if (existing) {
      await (this.prisma as any).favoriteUser.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false };
    } else {
      await (this.prisma as any).favoriteUser.create({
        data: { companyId, userId },
      });
      return { isFavorite: true };
    }
  }

  async getFavoriteUsers(companyId: string) {
    try {
      this.logger.log(`Fetching favorites for companyId: ${companyId}`);
      
      const favorites = await (this.prisma as any).favoriteUser.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });

      const enriched = await Promise.all(
        favorites.map(async (f: any) => {
          const user = await this.prisma.user.findUnique({
            where: { id: f.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              mainSpecialty: true,
              avatarUrl: true,
              skillTags: true,
              totalWins: true,
            },
          });
          return { ...f, user, isFavorite: true };
        }),
      );

      return enriched;
    } catch (error: any) {
      this.logger.error(`Error in getFavoriteUsers: ${error.message}`);
      throw new InternalServerErrorException(`Failed to fetch favorites: ${error.message}`);
    }
  }
}


