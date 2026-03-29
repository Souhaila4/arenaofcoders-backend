import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        email: string;
        isEmailVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string;
        lastName: string;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
        isBanned: boolean;
        createdAt: Date;
    }[]>;
    getUsers(options: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<{
        users: {
            id: string;
            email: string;
            isEmailVerified: boolean;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string;
            lastName: string;
            mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            isBanned: boolean;
            createdAt: Date;
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
