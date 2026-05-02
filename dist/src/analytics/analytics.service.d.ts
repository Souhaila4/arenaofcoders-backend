import { PrismaService } from '../prisma/prisma.service';
export interface DeveloperDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mainSpecialty: string;
    skillTags: string[];
    totalChallenges: number;
    totalWins: number;
    winRate: number;
    avgScore: number;
    avatarUrl?: string | null;
}
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDevelopers(filters?: {
        specialty?: string;
        skill?: string;
        minWins?: number;
    }): Promise<{
        developers: DeveloperDto[];
        total: number;
    }>;
}
