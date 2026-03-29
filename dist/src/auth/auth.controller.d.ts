import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from '../user/dto/update-profile.dto';
import type { User } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(dto: SignUpDto, file: Express.Multer.File): Promise<{
        email: string;
        message: string;
    }>;
    signIn(dto: SignInDto): Promise<{
        user: import("./auth.types").AuthUser;
        tokens: import("./auth.types").AuthTokens;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        user: import("./auth.types").AuthUser;
        tokens: import("./auth.types").AuthTokens;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    me(user: User): {
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
    };
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
    uploadCv(userId: string, file: Express.Multer.File): Promise<{
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
}
