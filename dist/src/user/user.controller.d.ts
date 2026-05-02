import { UserService } from './user.service';
import { RequestCompanyRoleDto } from './dto/company-request.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
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
    getPublicProfile(id: string): Promise<{
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
    requestCompanyRole(userId: string, dto: RequestCompanyRoleDto): Promise<{
        id: string;
        description: string | null;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
    }>;
    updateWallet(userId: string, dto: UpdateWalletDto): Promise<{
        id: string;
        hederaAccountId: string | null;
    }>;
}
