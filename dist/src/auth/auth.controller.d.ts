import { Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from '../user/dto/update-profile.dto';
import type { User } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(dto: SignUpDto, files: {
        resume?: Express.Multer.File[];
        avatar?: Express.Multer.File[];
    }): Promise<{
        user: import("./auth.types").AuthUser;
        tokens: import("./auth.types").AuthTokens;
    }>;
    getAvatar(filename: string, res: Response): void;
    signIn(dto: SignInDto): Promise<{
        user: import("./auth.types").AuthUser;
        tokens: import("./auth.types").AuthTokens;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    me(user: User): {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        githubUrl: string | null;
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
        fcmToken: string | null;
    };
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        githubUrl: string | null;
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        skillTags: string[];
        linkedinUrl: string | null;
        linkedinPosts: import("@prisma/client/runtime/library").JsonValue;
        githubRepos: import("@prisma/client/runtime/library").JsonValue;
        socialDataLastUpdate: Date | null;
        totalChallenges: number;
        totalWins: number;
        walletBalance: number;
        hederaAccountId: string | null;
        isBanned: boolean;
    } | null>;
    uploadCv(userId: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        githubUrl: string | null;
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        skillTags: string[];
        linkedinUrl: string | null;
        linkedinPosts: import("@prisma/client/runtime/library").JsonValue;
        githubRepos: import("@prisma/client/runtime/library").JsonValue;
        socialDataLastUpdate: Date | null;
        totalChallenges: number;
        totalWins: number;
        walletBalance: number;
        hederaAccountId: string | null;
        isBanned: boolean;
    } | null>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        githubUrl: string | null;
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        skillTags: string[];
        linkedinUrl: string | null;
        linkedinPosts: import("@prisma/client/runtime/library").JsonValue;
        githubRepos: import("@prisma/client/runtime/library").JsonValue;
        socialDataLastUpdate: Date | null;
        totalChallenges: number;
        totalWins: number;
        walletBalance: number;
        hederaAccountId: string | null;
        isBanned: boolean;
    } | null>;
    registerFcmToken(userId: string, fcmToken: string): Promise<{
        message: string;
    }>;
}
