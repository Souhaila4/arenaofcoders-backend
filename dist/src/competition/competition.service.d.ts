import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateCompetitionDto, UpdateCompetitionDto, ChangeCompetitionStatusDto, CompetitionQueryDto } from './competition.dto';
export declare class CompetitionService {
    private readonly prisma;
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    createCompetition(createDto: CreateCompetitionDto, adminUserId: string): Promise<{
        _count: {
            participants: number;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        startDate: Date;
        endDate: Date;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        createdBy: string;
    }>;
    private notifyUsersMatchingSpecialty;
    updateCompetition(competitionId: string, updateDto: UpdateCompetitionDto, _adminUserId: string): Promise<{
        _count: {
            participants: number;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        startDate: Date;
        endDate: Date;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        createdBy: string;
    }>;
    changeCompetitionStatus(competitionId: string, changeStatusDto: ChangeCompetitionStatusDto, _adminUserId: string): Promise<{
        _count: {
            participants: number;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        startDate: Date;
        endDate: Date;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        createdBy: string;
    }>;
    archiveCompetition(competitionId: string): Promise<{
        _count: {
            participants: number;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        startDate: Date;
        endDate: Date;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        createdBy: string;
    }>;
    joinCompetition(competitionId: string, userId: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        };
        competition: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ParticipantStatus;
        userId: string;
        competitionId: string;
        joinedAt: Date;
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
    getGlobalLeaderboard(limit?: number): Promise<{
        totalUsers: number;
        leaderboard: {
            winRate: number;
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            totalChallenges: number;
            totalWins: number;
            rank: number;
        }[];
    }>;
    findAllCompetitions(queryDto: CompetitionQueryDto): Promise<{
        data: ({
            _count: {
                participants: number;
            };
            creator: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            title: string;
            status: import(".prisma/client").$Enums.CompetitionStatus;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
            startDate: Date;
            endDate: Date;
            rewardPool: number;
            maxParticipants: number | null;
            isActive: boolean;
            createdBy: string;
        })[];
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
        data: ({
            _count: {
                participants: number;
            };
            creator: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            title: string;
            status: import(".prisma/client").$Enums.CompetitionStatus;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
            startDate: Date;
            endDate: Date;
            rewardPool: number;
            maxParticipants: number | null;
            isActive: boolean;
            createdBy: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    findCompetitionById(competitionId: string): Promise<{
        _count: {
            participants: number;
        };
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import(".prisma/client").$Enums.CompetitionStatus;
        specialty: import(".prisma/client").$Enums.Specialty | null;
        difficulty: import(".prisma/client").$Enums.CompetitionDifficulty;
        startDate: Date;
        endDate: Date;
        rewardPool: number;
        maxParticipants: number | null;
        isActive: boolean;
        createdBy: string;
    }>;
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
            userId: string;
            competitionId: string;
            joinedAt: Date;
        })[];
    }>;
    getMyParticipation(competitionId: string, userId: string): Promise<{
        competition: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.CompetitionStatus;
            startDate: Date;
            endDate: Date;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ParticipantStatus;
        userId: string;
        competitionId: string;
        joinedAt: Date;
    }>;
    handleCompetitionStatusUpdates(): Promise<void>;
    private isValidStatusTransition;
    private emitEvent;
}
