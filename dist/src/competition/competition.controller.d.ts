import { CompetitionService } from './competition.service';
import { CreateCompetitionDto, UpdateCompetitionDto, ChangeCompetitionStatusDto, JoinCompetitionDto, CompetitionQueryDto } from './competition.dto';
export declare class CompetitionController {
    private readonly competitionService;
    constructor(competitionService: CompetitionService);
    createCompetition(createCompetitionDto: CreateCompetitionDto, adminUserId: string): Promise<{
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
    updateCompetition(competitionId: string, updateCompetitionDto: UpdateCompetitionDto, adminUserId: string): Promise<{
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
    changeCompetitionStatus(competitionId: string, changeStatusDto: ChangeCompetitionStatusDto, adminUserId: string): Promise<{
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
    archiveCompetition(competitionId: string): Promise<unknown>;
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
    findCompetitionsForMe(queryDto: CompetitionQueryDto, userId: string): Promise<{
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
    getGlobalLeaderboard(limit?: string): Promise<{
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
    findCompetition(competitionId: string): Promise<{
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
    joinCompetition(competitionId: string, userId: string, _dto: JoinCompetitionDto): Promise<{
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
}
