import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { ReviewCompanyRequestDto } from './dto/review-company-request.dto';
import { SendPreselectedEmailDto } from './dto/send-preselected-email.dto';
import { CompetitionService } from '../competition/competition.service';
export declare class AdminController {
    private readonly adminService;
    private readonly competitionService;
    constructor(adminService: AdminService, competitionService: CompetitionService);
    updateUserRole(userId: string, role: UserRole): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    getCompanyRequests(status?: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        description: string | null;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
    })[]>;
    reviewCompanyRequest(requestId: string, dto: ReviewCompanyRequestDto): Promise<{
        id: string;
        description: string | null;
        status: import(".prisma/client").$Enums.RequestStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        companyName: string;
    }>;
    getDashboardStats(): Promise<{
        users: {
            total: number;
            verified: number;
            banned: number;
            noSpecialty: number;
            byRole: Record<string, number>;
        };
        specialties: {
            list: import(".prisma/client").$Enums.Specialty[];
            bySpecialty: Record<import(".prisma/client").$Enums.Specialty, number>;
        };
        rooms: {
            total: number;
            description: string;
        };
    }>;
    getRecentUsers(limit?: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        isBanned: boolean;
    }[]>;
    getUsers(limit?: string, offset?: string, search?: string, role?: UserRole): Promise<{
        users: {
            id: string;
            createdAt: Date;
            email: string;
            isEmailVerified: boolean;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string;
            lastName: string;
            mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            isBanned: boolean;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    sendPreselectedEmail(competitionId: string, dto: SendPreselectedEmailDto): Promise<{
        sent: number;
        total: number;
        failedEmails: string[];
    }>;
    triggerN8nWebhookTest(): Promise<{
        success: boolean;
        message?: string;
    }>;
}
