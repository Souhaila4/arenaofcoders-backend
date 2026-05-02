import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../auth.types';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly config;
    private readonly authService;
    constructor(config: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<{
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
    }>;
}
export {};
