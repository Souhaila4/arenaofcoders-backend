import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CompetitionService } from './competition.service';
import { CreateCompetitionDto, UpdateCompetitionDto, ChangeCompetitionStatusDto, CompetitionQueryDto, SubmitWorkDto, SubmitCheckpointDto, ReviewCheckpointSubmissionDto } from './competition.dto';
export declare class CompetitionController {
    private readonly competitionService;
    constructor(competitionService: CompetitionService);
    createCompetition(createCompetitionDto: CreateCompetitionDto, user: any): Promise<{
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
    updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto, user: any): Promise<{
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
    archiveCompetition(competitionId: string, user: any): Promise<unknown>;
    findAllCompetitions(queryDto: CompetitionQueryDto, user: any): Promise<{
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
    findCompetitionsForMe(queryDto: CompetitionQueryDto, userId: string): Promise<{
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
    getMyWins(userId: string): Promise<{
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
    getGlobalLeaderboard(limit?: string): Promise<{
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
    leaderboardLive(): Observable<MessageEvent>;
    getHackathonIdeas(): Promise<{
        ideas: Array<{
            title: string;
            score: number;
            description: string;
            target_market: string;
            feasibility: string;
        }>;
    }>;
    findCompetition(competitionId: string, user?: any): Promise<any>;
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
            scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        })[];
    }>;
    getCompetitionLeaderboard(competitionId: string): Promise<{
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
    getTopParticipants(competitionId: string, limit?: string): Promise<{
        competitionId: string;
        topN: number;
        winnerId: any;
        preselected: {
            rank: number;
            participantId: string;
            score: number;
            antiCheatScore: number | undefined;
            githubUrl: string | undefined;
            scoringReport: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | undefined;
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
            scoringReport: import("@prisma/client/runtime/library").JsonValue;
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
    selectWinner(competitionId: string, participantId: string, userId: string): Promise<{
        message: string;
        winnerId: string;
        userId: string;
        reward: any;
    }>;
    joinCompetition(competitionId: string, userId: string, file?: Express.Multer.File): Promise<{
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
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        baseRepositoryUrl: string | null;
        hasUsedExtraLife: boolean;
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
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
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
    submitCheckpoint(competitionId: string, checkpointId: string, userId: string, dto: SubmitCheckpointDto): Promise<{
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
                scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
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
            scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
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
    submitWork(competitionId: string, userId: string, dto: SubmitWorkDto): Promise<{
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
            scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
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
            scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        };
        antiCheatScore?: undefined;
        threshold?: undefined;
    }>;
}
