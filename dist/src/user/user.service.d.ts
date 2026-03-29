import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import type { UpdateProfileDto } from './dto/update-profile.dto';
export interface CreateUserInput {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    githubUrl?: string;
    linkedinUrl?: string;
}
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        cvUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        skillTags: string[];
        githubUrl: string | null;
        linkedinUrl: string | null;
        linkedinPosts: import("@prisma/client/runtime/library").JsonValue | null;
        githubRepos: import("@prisma/client/runtime/library").JsonValue | null;
        socialDataLastUpdate: Date | null;
        totalChallenges: number;
        totalWins: number;
        walletBalance: number;
        hederaAccountId: string | null;
        isBanned: boolean;
        bannedReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        skillTags: string[];
        githubUrl: string | null;
        linkedinUrl: string | null;
        linkedinPosts: import("@prisma/client/runtime/library").JsonValue;
        githubRepos: import("@prisma/client/runtime/library").JsonValue;
        socialDataLastUpdate: Date | null;
        totalChallenges: number;
        totalWins: number;
        walletBalance: number;
        hederaAccountId: string | null;
        isBanned: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        skillTags: string[];
        githubUrl: string | null;
        linkedinUrl: string | null;
        linkedinPosts: import("@prisma/client/runtime/library").JsonValue;
        githubRepos: import("@prisma/client/runtime/library").JsonValue;
        socialDataLastUpdate: Date | null;
        totalChallenges: number;
        totalWins: number;
        walletBalance: number;
        hederaAccountId: string | null;
        isBanned: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updatePasswordByEmail(email: string, passwordHash: string): Promise<void>;
    updateWallet(userId: string, hederaAccountId: string): Promise<{
        id: string;
        hederaAccountId: string | null;
    }>;
    create(data: CreateUserInput): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        createdAt: Date;
    }>;
    getLeaderboard(): Promise<{
        total: number;
        users: {
            rank: number;
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            mainSpecialty: string;
            xp: number;
            skillTags: string[];
        }[];
    }>;
}
