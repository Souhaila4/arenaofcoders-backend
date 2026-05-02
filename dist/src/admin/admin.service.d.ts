import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, UserRole } from '@prisma/client';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    updateUserRole(userId: string, role: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    getCompanyRequests(status?: RequestStatus): Promise<({
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
    reviewCompanyRequest(requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<{
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
    private readonly userListSelect;
    getRecentUsers(limit?: number): Promise<{
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
    getUsers(options: {
        limit?: number;
        offset?: number;
        search?: string;
        role?: UserRole;
    }): Promise<{
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
    triggerN8nWebhookTest(): Promise<{
        success: boolean;
        message?: string;
    }>;
}
