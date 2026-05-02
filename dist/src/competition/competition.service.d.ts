import { OrchestratorAgent } from '../agents/orchestrator.agent';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AntiCheatService } from '../anti-cheat/anti-cheat.service';
import { ScoringDispatcherService } from '../scoring/scoring-dispatcher.service';
import { type Prisma } from '@prisma/client';
import { CreateCompetitionDto, UpdateCompetitionDto, ChangeCompetitionStatusDto, CompetitionQueryDto, SubmitCheckpointDto, ReviewCheckpointSubmissionDto } from './competition.dto';
import { WalletService } from '../wallet/wallet.service';
import { EquipeService } from '../equipe/equipe.service';
import { StreamService } from '../stream/stream.service';
export declare class CompetitionService {
    private readonly prisma;
    private readonly emailService;
    private readonly antiCheatService;
    private readonly scoringDispatcher;
    private readonly walletService;
    private readonly streamService;
    private readonly orchestratorAgent;
    private readonly equipeService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, antiCheatService: AntiCheatService, scoringDispatcher: ScoringDispatcherService, walletService: WalletService, streamService: StreamService, orchestratorAgent: OrchestratorAgent, equipeService: EquipeService);
    createCompetition(createDto: CreateCompetitionDto, user: any): Promise<{
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        _count: {
            participants: number;
        };
    } & {
        id: string;
        title: string;
        description: string;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        antiCheatEnabled: boolean;
        antiCheatThreshold: number;
        topN: number;
        winnerId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getHackathonIdeas(): Promise<{
        ideas: Array<{
            title: string;
            score: number;
            description: string;
            target_market: string;
            feasibility: string;
        }>;
    }>;
    private createDefaultCheckpoints;
    private createCheckpointSubmissionsForParticipant;
    private notifyUsersForNewHackathon;
    updateCompetition(competitionId: string, updateDto: UpdateCompetitionDto, user: any): Promise<{
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        _count: {
            participants: number;
        };
    } & {
        id: string;
        title: string;
        description: string;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        antiCheatEnabled: boolean;
        antiCheatThreshold: number;
        topN: number;
        winnerId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changeCompetitionStatus(competitionId: string, changeStatusDto: ChangeCompetitionStatusDto, user: any): Promise<{
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        _count: {
            participants: number;
        };
    } & {
        id: string;
        title: string;
        description: string;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        antiCheatEnabled: boolean;
        antiCheatThreshold: number;
        topN: number;
        winnerId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    archiveCompetition(competitionId: string, user: any): Promise<{
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        _count: {
            participants: number;
        };
    } & {
        id: string;
        title: string;
        description: string;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        antiCheatEnabled: boolean;
        antiCheatThreshold: number;
        topN: number;
        winnerId: string | null;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    joinCompetition(competitionId: string, userId: string, faceImage?: Express.Multer.File): Promise<{
        competition: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ParticipantStatus;
        competitionId: string;
        userId: string;
        equipeId: string | null;
        joinedAt: Date;
        hackathonFaceUrl: string | null;
        githubUrl: string | null;
        antiCheatScore: number | null;
        score: number | null;
        scoringReport: Prisma.JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        baseRepositoryUrl: string | null;
        hasUsedExtraLife: boolean;
    }>;
    getLeaderboard(competitionId: string): Promise<{
        competitionId: string;
        totalParticipants: number;
        leaderboard: {
            rank: number;
            participantId: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            joinedAt: Date;
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
                totalChallenges: number;
                totalWins: number;
            };
        }[];
    }>;
    getTopParticipants(competitionId: string, limitOverride?: number): Promise<{
        competitionId: string;
        topN: number;
        winnerId: any;
        preselected: {
            rank: number;
            participantId: string;
            score: number;
            antiCheatScore: number | undefined;
            githubUrl: string | undefined;
            scoringReport: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | undefined;
            isWinner: boolean;
            submittedAt: Date | undefined;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            } & {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                email: string;
                mainSpecialty: string | null;
            };
        }[];
    }>;
    sendEmailToPreselectedParticipants(competitionId: string, subjectTemplate: string, htmlBodyTemplate: string, limit?: number): Promise<{
        sent: number;
        total: number;
        failedEmails: string[];
    }>;
    private escapeHtmlForEmail;
    getAllParticipantsForAdmin(competitionId: string): Promise<{
        competitionId: string;
        totalParticipants: number;
        participants: {
            participantId: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            joinedAt: Date;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: Prisma.JsonValue;
            isWinner: boolean;
            submittedAt: Date | null;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            };
        }[];
    }>;
    selectWinner(competitionId: string, participantId: string, adminUserId: string): Promise<{
        message: string;
        winnerId: string;
        userId: string;
        reward: any;
    }>;
    getGlobalLeaderboard(limit?: number): Promise<{
        totalUsers: number;
        leaderboard: {
            winRate: number;
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            totalChallenges: number;
            totalWins: number;
            rank: number;
        }[];
    }>;
    private previousRankMap;
    getGlobalLeaderboardWithMovements(limit?: number): Promise<{
        type: string;
        timestamp: string;
        totalUsers: number;
        leaderboard: any[];
    }>;
    findAllCompetitions(queryDto: CompetitionQueryDto, creatorId?: string): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    findCompetitionsForUser(userId: string, queryDto: CompetitionQueryDto): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getCompetitionsWonByUser(userId: string): Promise<{
        data: any[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    findCompetitionById(competitionId: string, requestUser?: any): Promise<any>;
    getCompetitionParticipants(competitionId: string): Promise<{
        competitionId: string;
        totalParticipants: number;
        participants: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
                totalChallenges: number;
                totalWins: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            competitionId: string;
            userId: string;
            equipeId: string | null;
            joinedAt: Date;
            hackathonFaceUrl: string | null;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: Prisma.JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        })[];
    }>;
    getMyParticipation(competitionId: string, userId: string): Promise<{
        score: number | undefined;
        antiCheatScore: number | undefined;
        isPreselected: boolean;
        preselectedRank: number | null;
        equipeId: string | null;
        equipeRole: string | null;
        competition: {
            id: string;
            title: string;
            startDate: Date;
            endDate: Date;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        id: string;
        status: import(".prisma/client").$Enums.ParticipantStatus;
        competitionId: string;
        userId: string;
        joinedAt: Date;
        hackathonFaceUrl: string | null;
        githubUrl: string | null;
        scoringReport: Prisma.JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        baseRepositoryUrl: string | null;
        hasUsedExtraLife: boolean;
    }>;
    getCompetitionCheckpoints(competitionId: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        createdAt: Date;
        order: number;
        dueDate: Date;
        isMandatory: boolean;
        competitionId: string;
    }[]>;
    getMyCheckpointSubmissions(competitionId: string, userId: string): Promise<({
        checkpoint: {
            id: string;
            title: string;
            description: string | null;
            order: number;
            dueDate: Date;
            isMandatory: boolean;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.CheckpointStatus;
        createdAt: Date;
        submittedAt: Date | null;
        proofUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        internalAiScore: number | null;
        rejectionReason: string | null;
        warningMessage: string | null;
        checkpointId: string;
        participantId: string;
    })[]>;
    submitCheckpoint(competitionId: string, userId: string, checkpointId: string, dto: SubmitCheckpointDto): Promise<{
        advancedValidation: {
            status: string;
            internalAiScore: number | null;
            advancement: number | null;
            warningMessage: string | null;
            rejectionReason: string | null;
        };
        checkpoint?: {
            id: string;
            title: string;
            description: string | null;
            createdAt: Date;
            order: number;
            dueDate: Date;
            isMandatory: boolean;
            competitionId: string;
        } | undefined;
        id?: string | undefined;
        status?: import(".prisma/client").$Enums.CheckpointStatus | undefined;
        createdAt?: Date | undefined;
        submittedAt?: Date | null | undefined;
        proofUrl?: string | null | undefined;
        notes?: string | null | undefined;
        reviewedAt?: Date | null | undefined;
        internalAiScore?: number | null | undefined;
        rejectionReason?: string | null | undefined;
        warningMessage?: string | null | undefined;
        checkpointId?: string | undefined;
        participantId?: string | undefined;
    }>;
    private executeAdvancedCheckpointLogic;
    getCheckpointSubmissionsForReview(competitionId: string, user: any): Promise<{
        competitionId: string;
        submissions: ({
            checkpoint: {
                id: string;
                title: string;
                order: number;
                dueDate: Date;
            };
            participant: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.ParticipantStatus;
                competitionId: string;
                userId: string;
                equipeId: string | null;
                joinedAt: Date;
                hackathonFaceUrl: string | null;
                githubUrl: string | null;
                antiCheatScore: number | null;
                score: number | null;
                scoringReport: Prisma.JsonValue | null;
                submittedAt: Date | null;
                isWinner: boolean;
                baseRepositoryUrl: string | null;
                hasUsedExtraLife: boolean;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CheckpointStatus;
            createdAt: Date;
            submittedAt: Date | null;
            proofUrl: string | null;
            notes: string | null;
            reviewedAt: Date | null;
            internalAiScore: number | null;
            rejectionReason: string | null;
            warningMessage: string | null;
            checkpointId: string;
            participantId: string;
        })[];
    }>;
    reviewCheckpointSubmission(competitionId: string, submissionId: string, user: any, dto: ReviewCheckpointSubmissionDto): Promise<{
        checkpoint: {
            id: string;
            title: string;
            description: string | null;
            createdAt: Date;
            order: number;
            dueDate: Date;
            isMandatory: boolean;
            competitionId: string;
        };
        participant: {
            id: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            competitionId: string;
            userId: string;
            equipeId: string | null;
            joinedAt: Date;
            hackathonFaceUrl: string | null;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: Prisma.JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.CheckpointStatus;
        createdAt: Date;
        submittedAt: Date | null;
        proofUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        internalAiScore: number | null;
        rejectionReason: string | null;
        warningMessage: string | null;
        checkpointId: string;
        participantId: string;
    }>;
    handleCompetitionStatusUpdates(): Promise<void>;
    submitWork(competitionId: string, userId: string, githubUrl: string): Promise<{
        status: string;
        message: string;
        antiCheatScore: number;
        threshold: any;
        participation: {
            id: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            competitionId: string;
            userId: string;
            equipeId: string | null;
            joinedAt: Date;
            hackathonFaceUrl: string | null;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: Prisma.JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        };
    } | {
        status: string;
        message: string;
        participation: {
            id: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            competitionId: string;
            userId: string;
            equipeId: string | null;
            joinedAt: Date;
            hackathonFaceUrl: string | null;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: Prisma.JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        };
        antiCheatScore?: undefined;
        threshold?: undefined;
    }>;
    private markEquipeSubmittedTx;
    private isValidStatusTransition;
    private emitEvent;
    private censorPreHackathonDetails;
    private archiveTeamChatChannels;
}
