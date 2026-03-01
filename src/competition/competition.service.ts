import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AntiCheatService } from '../anti-cheat/anti-cheat.service';
import { OrchestratorAgent } from '../agents/orchestrator.agent';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRole, type Specialty, type Prisma } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as path from 'path';
import axios from 'axios';
import {
  CompetitionStatus,
  CompetitionDifficulty,
  ParticipantStatus,
  VALID_STATUS_TRANSITIONS,
} from './competition-status.enum';
import { CheckpointStatus } from '@prisma/client';
import {
  CreateCompetitionDto,
  UpdateCompetitionDto,
  ChangeCompetitionStatusDto,
  CompetitionQueryDto,
  SubmitCheckpointDto,
  ReviewCheckpointSubmissionDto,
} from './competition.dto';

/** Checkpoint submission window: opens at (dueDate - this many minutes), closes at dueDate */
const CHECKPOINT_SUBMISSION_WINDOW_MINUTES = 15;

const DEFAULT_TOP_PARTICIPANTS_LIMIT = 5;

@Injectable()
export class CompetitionService {
  private readonly logger = new Logger(CompetitionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly antiCheatService: AntiCheatService,
    private readonly orchestratorAgent: OrchestratorAgent,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // ADMIN METHODS
  // ─────────────────────────────────────────────────────────────────

  async createCompetition(
    createDto: CreateCompetitionDto,
    adminUserId: string,
  ) {
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);
    const now = new Date();

    if (startDate <= now) {
      throw new BadRequestException('startDate must be in the future');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const createData = {
      title: createDto.title,
      description: createDto.description,
      difficulty: createDto.difficulty,
      specialty: createDto.specialty ?? null,
      startDate,
      endDate,
      rewardPool: createDto.rewardPool ?? 0,
      maxParticipants: createDto.maxParticipants ?? null,
      antiCheatEnabled: createDto.antiCheatEnabled ?? false,
      antiCheatThreshold: createDto.antiCheatThreshold ?? 70.0,
      createdBy: adminUserId,
      status: CompetitionStatus.OPEN_FOR_ENTRY,
    };

    const competition = await this.prisma.competition.create({
      data: createData as Prisma.CompetitionUncheckedCreateInput,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });

    await this.createDefaultCheckpoints(competition.id, startDate, endDate);

    const created = competition as typeof competition & {
      specialty?: Specialty | null;
    };
    this.emitEvent('competition.created', {
      competitionId: created.id,
      title: created.title,
      createdBy: adminUserId,
      specialty: created.specialty ?? undefined,
    });

    // Notify users about the new hackathon
    // If specialty is set → only matching users, otherwise → all users
    void this.notifyUsersForNewHackathon({
      id: created.id,
      title: created.title,
      specialty: created.specialty ?? null,
    }).catch((err) =>
      console.error('Failed to notify users for new hackathon:', err),
    );

    return competition;
  }

  /**
   * Fetch hackathon ideas from the n8n webhook (Admin only).
   * Used when creating a new hackathon to suggest ideas.
   */
  async getHackathonIdeas(): Promise<{ ideas: Array<{
    title: string;
    score: number;
    description: string;
    target_market: string;
    feasibility: string;
  }> }> {
    const webhookUrl = 'https://sayariii.app.n8n.cloud/webhook/generate-ideas';
    try {
      const response = await axios.post(
        webhookUrl,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        },
      );
      const data = response.data;
      if (data && Array.isArray(data.ideas)) {
        return { ideas: data.ideas };
      }
      this.logger.warn('Hackathon ideas webhook returned unexpected format');
      return { ideas: [] };
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch hackathon ideas: ${error?.message ?? error}`,
        error?.stack,
      );
      throw new BadRequestException(
        'Unable to fetch hackathon ideas. Please try again later.',
      );
    }
  }

  /**
   * Creates default checkpoints for a new competition: Idea validation, Mid progress, Final validation.
   * Due dates are spread between startDate and endDate.
   */
  private async createDefaultCheckpoints(
    competitionId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const durationMs = endDate.getTime() - startDate.getTime();
    const oneThird = durationMs / 3;
    const twoThirds = durationMs * (2 / 3);

    const defaults = [
      {
        competitionId,
        title: 'Idea validation',
        description: 'Submit and validate your project idea.',
        order: 1,
        dueDate: new Date(startDate.getTime() + oneThird),
        isMandatory: true,
      },
      {
        competitionId,
        title: 'Mid progress',
        description: 'Mid-competition checkpoint to show progress.',
        order: 2,
        dueDate: new Date(startDate.getTime() + twoThirds),
        isMandatory: true,
      },
      {
        competitionId,
        title: 'Final validation',
        description: 'Final checkpoint before submission closes.',
        order: 3,
        dueDate: new Date(endDate.getTime() - 60 * 60 * 1000), // 1h before end
        isMandatory: true,
      },
    ];

    await this.prisma.competitionCheckpoint.createMany({
      data: defaults as Prisma.CompetitionCheckpointUncheckedCreateInput[],
    });
  }

  /**
   * Creates one CheckpointSubmission per checkpoint for a new participant (all PENDING).
   */
  private async createCheckpointSubmissionsForParticipant(
    participantId: string,
    competitionId: string,
  ) {
    const checkpoints = await this.prisma.competitionCheckpoint.findMany({
      where: { competitionId },
      select: { id: true },
      orderBy: { order: 'asc' },
    });

    await this.prisma.checkpointSubmission.createMany({
      data: checkpoints.map((cp) => ({
        checkpointId: cp.id,
        participantId,
        status: CheckpointStatus.PENDING,
      })),
    });
  }

  /**
   * If specialty is set → notify only matching users.
   * If no specialty → notify ALL active users.
   */
  private async notifyUsersForNewHackathon(competition: {
    id: string;
    title: string;
    specialty: Specialty | null;
  }) {
    const whereClause: any = {
      role: UserRole.USER,
      isBanned: false,
    };

    // Filter by specialty if specified
    if (competition.specialty) {
      whereClause.mainSpecialty = competition.specialty;
    }

    const users: Array<{ id: string; email: string; firstName: string; fcmToken: string | null }> =
      await (this.prisma.user as any).findMany({
        where: whereClause,
        select: { id: true, email: true, firstName: true, fcmToken: true },
      });

    const title = competition.specialty
      ? `Nouveau hackathon ${competition.specialty}: ${competition.title}`
      : `Nouveau hackathon: ${competition.title}`;
    const body = competition.specialty
      ? `Un nouveau hackathon ${competition.specialty} est ouvert. Rejoignez-le !`
      : `Un nouveau hackathon est disponible. Découvrez-le et participez !`;

    for (const user of users) {
      await (this.prisma as any).notification.create({
        data: {
          userId: user.id,
          type: 'HACKATHON_MATCH',
          title,
          body,
          competitionId: competition.id,
        },
      });
      if (competition.specialty) {
        await this.emailService.sendHackathonNotification(
          user.email,
          user.firstName,
          competition.title,
          competition.specialty,
        );
      }
    }

    // Send FCM push notifications
    const fcmTokens = users
      .filter((u: any) => u.fcmToken)
      .map((u: any) => u.fcmToken as string);

    if (fcmTokens.length > 0) {
      try {
        // Initialize Firebase Admin if not already done
        if (!admin.apps.length) {
          const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }

        const message: admin.messaging.MulticastMessage = {
          tokens: fcmTokens,
          notification: {
            title,
            body,
          },
          data: {
            competitionId: competition.id,
            type: 'NEW_HACKATHON',
          },
        };

        const result = await admin.messaging().sendEachForMulticast(message);
        console.log(`📱 Push notifications: ${result.successCount} sent, ${result.failureCount} failed`);
      } catch (pushError) {
        console.error('📱 Failed to send push notifications:', pushError);
      }
    }

    console.log(`📢 Notifications sent to ${users.length} users for hackathon "${competition.title}"`);
  }

  async updateCompetition(
    competitionId: string,
    updateDto: UpdateCompetitionDto,
    _adminUserId: string,
  ) {
    const competition = await this.findCompetitionById(competitionId);

    const lockedStatuses: CompetitionStatus[] = [
      CompetitionStatus.RUNNING,
      CompetitionStatus.SUBMISSION_CLOSED,
      CompetitionStatus.EVALUATING,
      CompetitionStatus.COMPLETED,
    ];

    if (lockedStatuses.includes(competition.status as CompetitionStatus)) {
      throw new BadRequestException(
        'Cannot update a competition that is running or already completed',
      );
    }

    if (updateDto.startDate || updateDto.endDate) {
      const startDate = new Date(
        updateDto.startDate ?? competition.startDate,
      );
      const endDate = new Date(updateDto.endDate ?? competition.endDate);
      const now = new Date();

      if (updateDto.startDate && startDate <= now) {
        throw new BadRequestException('New startDate must be in the future');
      }
      if (endDate <= startDate) {
        throw new BadRequestException('endDate must be after startDate');
      }
    }

    const updateData = {
      ...updateDto,
      specialty:
        updateDto.specialty !== undefined ? updateDto.specialty : undefined,
      startDate: updateDto.startDate
        ? new Date(updateDto.startDate)
        : undefined,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
    };
    const updated = await this.prisma.competition.update({
      where: { id: competitionId },
      data: updateData as Prisma.CompetitionUncheckedUpdateInput,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });

    return updated;
  }

  async changeCompetitionStatus(
    competitionId: string,
    changeStatusDto: ChangeCompetitionStatusDto,
    _adminUserId: string,
  ) {
    const competition = await this.findCompetitionById(competitionId);
    const currentStatus = competition.status as CompetitionStatus;
    const newStatus = changeStatusDto.status;

    if (!this.isValidStatusTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed next status(es): [${VALID_STATUS_TRANSITIONS[currentStatus].join(', ')}]`,
      );
    }

    const updated = await this.prisma.competition.update({
      where: { id: competitionId },
      data: { status: newStatus },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });

    this.emitEvent('competition.status_changed', {
      competitionId,
      oldStatus: currentStatus,
      newStatus,
    });

    if (newStatus === CompetitionStatus.RUNNING) {
      this.emitEvent('competition.started', {
        competitionId,
        title: competition.title,
      });
    }

    if (newStatus === CompetitionStatus.COMPLETED) {
      this.emitEvent('competition.completed', {
        competitionId,
        title: competition.title,
      });
    }

    return updated;
  }

  async archiveCompetition(competitionId: string) {
    const competition = await this.findCompetitionById(competitionId);

    if (competition.status !== CompetitionStatus.COMPLETED) {
      throw new BadRequestException(
        'Only COMPLETED competitions can be archived',
      );
    }

    return this.prisma.competition.update({
      where: { id: competitionId },
      data: { status: CompetitionStatus.ARCHIVED, isActive: false },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // TALENT METHODS
  // ─────────────────────────────────────────────────────────────────

  async joinCompetition(competitionId: string, userId: string) {
    const competition = await this.findCompetitionById(competitionId);

    if (
      competition.status !== CompetitionStatus.OPEN_FOR_ENTRY &&
      competition.status !== CompetitionStatus.RUNNING
    ) {
      throw new BadRequestException(
        `This competition is not open for entry. Current status: ${competition.status}`,
      );
    }

    // Check duplicate
    const existingParticipation =
      await this.prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: { competitionId, userId },
        },
      });

    if (existingParticipation) {
      throw new ConflictException('You have already joined this competition');
    }

    // Check capacity
    if (competition.maxParticipants !== null) {
      const currentCount = await this.prisma.competitionParticipant.count({
        where: { competitionId, status: ParticipantStatus.JOINED },
      });

      if (currentCount >= competition.maxParticipants) {
        throw new BadRequestException(
          'This competition has reached its maximum participant limit',
        );
      }
    }

    const participation = await this.prisma.competitionParticipant.create({
      data: {
        competitionId,
        userId,
        status: ParticipantStatus.JOINED,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mainSpecialty: true,
          },
        },
        competition: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    await this.createCheckpointSubmissionsForParticipant(participation.id, competitionId);

    this.emitEvent('competition.user_joined', {
      competitionId,
      userId,
      competitionTitle: competition.title,
    });

    return participation;
  }

  // ─────────────────────────────────────────────────────────────────
  // LEADERBOARD
  // ─────────────────────────────────────────────────────────────────

  async getLeaderboard(competitionId: string) {
    await this.findCompetitionById(competitionId); // 404 guard

    const participants = await this.prisma.competitionParticipant.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            mainSpecialty: true,
            totalChallenges: true,
            totalWins: true,
          },
        },
      },
      orderBy: [
        // Ranks SUBMITTED above JOINED, DISQUALIFIED at the bottom
        { status: 'asc' },
        { joinedAt: 'asc' },
      ],
    });

    return {
      competitionId,
      totalParticipants: participants.length,
      leaderboard: participants.map((p, index) => ({
        rank: index + 1,
        participantId: p.id,
        status: p.status,
        joinedAt: p.joinedAt,
        user: p.user,
      })),
    };
  }

  /**
   * Returns the top participants by pipeline score for a competition (preselected for display).
   * Only SUBMITTED participants with a score are included, ordered by score descending.
   */
  async getTopParticipants(
    competitionId: string,
    limit: number = DEFAULT_TOP_PARTICIPANTS_LIMIT,
  ) {
    await this.findCompetitionById(competitionId);

    const take = Math.min(Math.max(1, limit), 50);

    const participants = await this.prisma.competitionParticipant.findMany({
      where: {
        competitionId,
        status: ParticipantStatus.SUBMITTED,
        score: { not: null },
      } as Prisma.CompetitionParticipantWhereInput,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            mainSpecialty: true,
          },
        },
      },
      orderBy: { score: 'desc' } as Prisma.CompetitionParticipantOrderByWithRelationInput,
      take,
    });

    return {
      competitionId,
      preselected: participants.map((p, index) => {
        const row = p as typeof p & { score: number | null; user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; email: string; mainSpecialty: string | null } };
        return {
          rank: index + 1,
          participantId: p.id,
          score: row.score as number,
          antiCheatScore: p.antiCheatScore ?? undefined,
          submittedAt: p.submittedAt ?? undefined,
          user: row.user,
        };
      }),
    };
  }

  async getGlobalLeaderboard(limit = 20) {
    const users = await this.prisma.user.findMany({
      where: { isBanned: false, role: UserRole.USER },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        mainSpecialty: true,
        totalChallenges: true,
        totalWins: true,
      },
      orderBy: [{ totalWins: 'desc' }, { totalChallenges: 'desc' }],
      take: limit,
    });

    return {
      totalUsers: users.length,
      leaderboard: users.map((u, index) => ({
        rank: index + 1,
        ...u,
        winRate:
          u.totalChallenges > 0
            ? Math.round((u.totalWins / u.totalChallenges) * 100)
            : 0,
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED / READ METHODS
  // ─────────────────────────────────────────────────────────────────

  async findAllCompetitions(queryDto: CompetitionQueryDto) {
    const {
      status,
      difficulty,
      specialty,
      onlyActive,
      page = 1,
      limit = 10,
    } = queryDto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (difficulty) where.difficulty = difficulty;
    if (specialty) where.specialty = specialty;
    if (onlyActive !== undefined) where.isActive = onlyActive;

    const [competitions, totalCount] = await Promise.all([
      this.prisma.competition.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.competition.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: competitions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * List competitions relevant to the current user:
   * - If user has mainSpecialty set, returns competitions whose specialty matches
   *   (plus those with no specialty).
   * - If user has no mainSpecialty, returns all competitions.
   */
  async findCompetitionsForUser(userId: string, queryDto: CompetitionQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mainSpecialty: true },
    });

    const {
      status,
      difficulty,
      specialty,
      onlyActive,
      page = 1,
      limit = 10,
    } = queryDto;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (difficulty) where.difficulty = difficulty;
    if (specialty) where.specialty = specialty;
    if (onlyActive !== undefined) where.isActive = onlyActive;

    // Filter by user's specialty: show matching specialty OR no specialty set on competition
    if (user?.mainSpecialty && !specialty) {
      where.OR = [{ specialty: user.mainSpecialty }, { specialty: null }];
    }

    const [competitions, totalCount] = await Promise.all([
      this.prisma.competition.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.competition.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: competitions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findCompetitionById(competitionId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!competition) {
      throw new NotFoundException(
        `Competition with id "${competitionId}" not found`,
      );
    }

    return competition;
  }

  async getCompetitionParticipants(competitionId: string) {
    await this.findCompetitionById(competitionId); // 404 guard

    const participants = await this.prisma.competitionParticipant.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mainSpecialty: true,
            totalChallenges: true,
            totalWins: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      competitionId,
      totalParticipants: participants.length,
      participants,
    };
  }

  async getMyParticipation(competitionId: string, userId: string) {
    await this.findCompetitionById(competitionId);

    const participation =
      await this.prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: { competitionId, userId },
        },
        include: {
          competition: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

    if (!participation) {
      throw new NotFoundException(
        'You are not registered in this competition',
      );
    }

    const result = participation as typeof participation & { score: number | null };
    const score = result.score ?? undefined;
    const antiCheatScore = participation.antiCheatScore ?? undefined;

    let isPreselected = false;
    let preselectedRank: number | null = null;

    if (
      participation.status === ParticipantStatus.SUBMITTED &&
      result.score != null
    ) {
      const topIds = await this.prisma.competitionParticipant.findMany({
        where: {
          competitionId,
          status: ParticipantStatus.SUBMITTED,
          score: { not: null },
        } as Prisma.CompetitionParticipantWhereInput,
        select: { id: true },
        orderBy: { score: 'desc' } as Prisma.CompetitionParticipantOrderByWithRelationInput,
        take: DEFAULT_TOP_PARTICIPANTS_LIMIT,
      });
      const rankIndex = topIds.findIndex((p) => p.id === participation.id);
      if (rankIndex >= 0) {
        isPreselected = true;
        preselectedRank = rankIndex + 1;
      }
    }

    return {
      ...participation,
      score,
      antiCheatScore,
      isPreselected,
      preselectedRank,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CHECKPOINTS
  // ─────────────────────────────────────────────────────────────────

  async getCompetitionCheckpoints(competitionId: string) {
    await this.findCompetitionById(competitionId);
    return this.prisma.competitionCheckpoint.findMany({
      where: { competitionId },
      orderBy: { order: 'asc' },
    });
  }

  async getMyCheckpointSubmissions(competitionId: string, userId: string) {
    await this.findCompetitionById(competitionId);
    const participation = await this.prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });
    if (!participation) {
      throw new NotFoundException('You are not registered in this competition');
    }
    return this.prisma.checkpointSubmission.findMany({
      where: { participantId: participation.id },
      include: {
        checkpoint: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            dueDate: true,
            isMandatory: true,
          },
        },
      },
      orderBy: { checkpoint: { order: 'asc' } },
    });
  }

  async submitCheckpoint(
    competitionId: string,
    userId: string,
    checkpointId: string,
    dto: SubmitCheckpointDto,
  ) {
    await this.findCompetitionById(competitionId);
    const participation = await this.prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });
    if (!participation) {
      throw new NotFoundException('You are not registered in this competition');
    }
    if (participation.status === ParticipantStatus.DISQUALIFIED) {
      throw new BadRequestException(
        'You have been disqualified and cannot submit checkpoints',
      );
    }

    const submission = await this.prisma.checkpointSubmission.findUnique({
      where: {
        checkpointId_participantId: { checkpointId, participantId: participation.id },
      },
      include: { checkpoint: true },
    });
    if (!submission) {
      throw new NotFoundException('Checkpoint or submission not found');
    }
    if (submission.checkpoint.competitionId !== competitionId) {
      throw new BadRequestException('Checkpoint does not belong to this competition');
    }
    if (submission.status !== CheckpointStatus.PENDING) {
      throw new BadRequestException(
        `Checkpoint already ${submission.status.toLowerCase()}. Cannot resubmit.`,
      );
    }
    const now = new Date();
    const dueDate = new Date(submission.checkpoint.dueDate);
    const opensAt = new Date(dueDate.getTime() - CHECKPOINT_SUBMISSION_WINDOW_MINUTES * 60 * 1000);

    if (now < opensAt) {
      throw new BadRequestException(
        `Checkpoint opens at ${opensAt.toISOString()}. You can submit during the ${CHECKPOINT_SUBMISSION_WINDOW_MINUTES}-minute window before the due date.`,
      );
    }
    if (now > dueDate) {
      throw new BadRequestException('Checkpoint submission window has closed. Due date has passed.');
    }

    return this.prisma.checkpointSubmission.update({
      where: { id: submission.id },
      data: {
        proofUrl: dto.proofUrl ?? undefined,
        notes: dto.notes ?? undefined,
        status: CheckpointStatus.SUBMITTED,
        submittedAt: now,
      },
      include: { checkpoint: true },
    });
  }

  async getCheckpointSubmissionsForReview(competitionId: string) {
    await this.findCompetitionById(competitionId);
    const submissions = await this.prisma.checkpointSubmission.findMany({
      where: {
        checkpoint: { competitionId },
      },
      include: {
        checkpoint: {
          select: {
            id: true,
            title: true,
            order: true,
            dueDate: true,
          },
        },
        participant: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { checkpoint: { order: 'asc' } },
        { createdAt: 'asc' },
      ],
    });
    return { competitionId, submissions };
  }

  async reviewCheckpointSubmission(
    competitionId: string,
    submissionId: string,
    _adminUserId: string,
    dto: ReviewCheckpointSubmissionDto,
  ) {
    await this.findCompetitionById(competitionId);
    const submission = await this.prisma.checkpointSubmission.findUnique({
      where: { id: submissionId },
      include: { checkpoint: true, participant: true },
    });
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    if (submission.checkpoint.competitionId !== competitionId) {
      throw new BadRequestException('Submission does not belong to this competition');
    }
    if (submission.status !== CheckpointStatus.SUBMITTED) {
      throw new BadRequestException(
        `Can only review SUBMITTED checkpoints. Current status: ${submission.status}`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.checkpointSubmission.update({
      where: { id: submissionId },
      data: {
        status: dto.status as CheckpointStatus,
        reviewedAt: now,
      },
      include: { checkpoint: true, participant: true },
    });

    this.emitEvent('competition.checkpoint_reviewed', {
      competitionId,
      submissionId,
      status: dto.status,
      participantId: submission.participantId,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────
  // CRON — AUTOMATIC STATUS TRANSITIONS
  // ─────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCompetitionStatusUpdates() {
    console.log('🔄 [CRON] Checking competition statuses...');
    const now = new Date();

    try {
      // OPEN_FOR_ENTRY → RUNNING  (when startDate has passed)
      const toStart = await this.prisma.competition.findMany({
        where: {
          status: CompetitionStatus.OPEN_FOR_ENTRY,
          startDate: { lte: now },
          isActive: true,
        },
      });

      for (const c of toStart) {
        await this.prisma.competition.update({
          where: { id: c.id },
          data: { status: CompetitionStatus.RUNNING },
        });
        console.log(`✅ [CRON] "${c.title}" → RUNNING`);
        this.emitEvent('competition.started', {
          competitionId: c.id,
          title: c.title,
        });
      }

      // RUNNING → SUBMISSION_CLOSED  (when endDate has passed)
      const toClose = await this.prisma.competition.findMany({
        where: {
          status: CompetitionStatus.RUNNING,
          endDate: { lte: now },
          isActive: true,
        },
      });

      for (const c of toClose) {
        await this.prisma.competition.update({
          where: { id: c.id },
          data: { status: CompetitionStatus.SUBMISSION_CLOSED },
        });
        console.log(`✅ [CRON] "${c.title}" → SUBMISSION_CLOSED`);
        this.emitEvent('competition.submission_closed', {
          competitionId: c.id,
          title: c.title,
        });
      }

      // Checkpoints: dueDate passed + PENDING → MISSED, then participant DISQUALIFIED
      const overduePending = await this.prisma.checkpointSubmission.findMany({
        where: {
          status: CheckpointStatus.PENDING,
          checkpoint: { dueDate: { lt: now } },
        },
        include: { participant: true, checkpoint: true },
      });

      for (const sub of overduePending) {
        await this.prisma.$transaction([
          this.prisma.checkpointSubmission.update({
            where: { id: sub.id },
            data: { status: CheckpointStatus.MISSED },
          }),
          this.prisma.competitionParticipant.update({
            where: { id: sub.participantId },
            data: { status: ParticipantStatus.DISQUALIFIED },
          }),
        ]);
        console.log(
          `✅ [CRON] Checkpoint "${sub.checkpoint.title}" missed → participant ${sub.participantId} DISQUALIFIED`,
        );
        this.emitEvent('competition.participant_disqualified_checkpoint_missed', {
          competitionId: sub.participant.competitionId,
          participantId: sub.participantId,
          checkpointId: sub.checkpointId,
          checkpointTitle: sub.checkpoint.title,
        });
      }
    } catch (error) {
      console.error('❌ [CRON] Error updating competition statuses:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SUBMIT WORK (GitHub link + Anti-Cheat)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Runs the full agent pipeline (orchestrator) for a submitted repo and persists the score.
   * Intended to be run asynchronously after submitWork so the HTTP response is not blocked.
   */
  private async runScoringPipeline(
    participantId: string,
    githubUrl: string,
  ): Promise<void> {
    try {
      const participant = await this.prisma.competitionParticipant.findUnique({
        where: { id: participantId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      if (!participant?.user) {
        this.logger.warn(`Participant ${participantId} or user not found; skipping pipeline`);
        return;
      }
      const teamName = [participant.user.firstName, participant.user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Unknown';

      const result = await this.orchestratorAgent.evaluateRepo(githubUrl, {
        submissionId: participantId,
        teamName,
      });

      await this.prisma.competitionParticipant.update({
        where: { id: participantId },
        data: { score: result.finalScore } as Prisma.CompetitionParticipantUncheckedUpdateInput,
      });

      this.logger.log(
        `Pipeline score for participant ${participantId}: ${result.finalScore}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Scoring pipeline failed for participant ${participantId}: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  async submitWork(competitionId: string, userId: string, githubUrl: string) {
    const competition = await this.findCompetitionById(competitionId);

    // Competition must be RUNNING to accept submissions
    if (competition.status !== CompetitionStatus.RUNNING) {
      throw new BadRequestException(
        `Competition is not running. Current status: ${competition.status}`,
      );
    }

    // Find participation
    const participation = await this.prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });

    if (!participation) {
      throw new NotFoundException('You are not registered in this competition');
    }

    // Cannot resubmit if already submitted or disqualified
    if (participation.status === ParticipantStatus.DISQUALIFIED) {
      throw new BadRequestException(
        'You have been disqualified from this competition and cannot submit again.',
      );
    }
    if (participation.status === ParticipantStatus.SUBMITTED) {
      throw new BadRequestException(
        'You have already submitted your work for this competition.',
      );
    }

    // If anti-cheat is enabled, run analysis
    if (competition.antiCheatEnabled) {
      const score = await this.antiCheatService.analyzeRepository(githubUrl);
      const threshold = competition.antiCheatThreshold ?? 70;

      if (score > threshold) {
        // DISQUALIFIED
        const updated = await this.prisma.competitionParticipant.update({
          where: { id: participation.id },
          data: {
            githubUrl,
            antiCheatScore: score,
            status: ParticipantStatus.DISQUALIFIED,
            submittedAt: new Date(),
          },
        });

        this.emitEvent('competition.participant_disqualified', {
          competitionId,
          userId,
          score,
          threshold,
        });

        return {
          status: 'DISQUALIFIED',
          message: `Your code has been detected as ${score}% AI-generated, which exceeds the ${threshold}% threshold. You have been disqualified.`,
          antiCheatScore: score,
          threshold,
          participation: updated,
        };
      }

      // Passed anti-cheat
      const updated = await this.prisma.competitionParticipant.update({
        where: { id: participation.id },
        data: {
          githubUrl,
          antiCheatScore: score,
          status: ParticipantStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });

      void this.runScoringPipeline(updated.id, githubUrl).catch(() => {});

      this.emitEvent('competition.work_submitted', {
        competitionId,
        userId,
        score,
        passed: true,
      });

      return {
        status: 'SUBMITTED',
        message: `Your code passed the anti-cheat check with a score of ${score}% (threshold: ${threshold}%). Submission accepted!`,
        antiCheatScore: score,
        threshold,
        participation: updated,
      };
    }

    // Anti-cheat disabled → accept directly
    const updated = await this.prisma.competitionParticipant.update({
      where: { id: participation.id },
      data: {
        githubUrl,
        status: ParticipantStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    void this.runScoringPipeline(updated.id, githubUrl).catch(() => {});

    this.emitEvent('competition.work_submitted', {
      competitionId,
      userId,
      antiCheatEnabled: false,
    });

    return {
      status: 'SUBMITTED',
      message: 'Your work has been submitted successfully!',
      participation: updated,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────

  private isValidStatusTransition(
    currentStatus: CompetitionStatus,
    newStatus: CompetitionStatus,
  ): boolean {
    return (
      VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
    );
  }

  private emitEvent(eventName: string, data: Record<string, unknown>) {
    console.log(`🎯 [EVENT] ${eventName}:`, JSON.stringify(data));
  }
}
