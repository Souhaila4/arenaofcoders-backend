import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllForUser(userId: string, options?: {
        unreadOnly?: boolean;
        limit?: number;
    }): Promise<{
        data: ({
            competition: {
                id: string;
                title: string;
                status: import(".prisma/client").$Enums.CompetitionStatus;
                specialty: import(".prisma/client").$Enums.Specialty | null;
                startDate: Date;
                endDate: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            type: string;
            title: string;
            userId: string;
            body: string | null;
            competitionId: string | null;
            read: boolean;
        })[];
        unreadCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        competition: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.CompetitionStatus;
            specialty: import(".prisma/client").$Enums.Specialty | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        type: string;
        title: string;
        userId: string;
        body: string | null;
        competitionId: string | null;
        read: boolean;
    }>;
    markAllAsRead(userId: string): Promise<{
        data: ({
            competition: {
                id: string;
                title: string;
                status: import(".prisma/client").$Enums.CompetitionStatus;
                specialty: import(".prisma/client").$Enums.Specialty | null;
                startDate: Date;
                endDate: Date;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            type: string;
            title: string;
            userId: string;
            body: string | null;
            competitionId: string | null;
            read: boolean;
        })[];
        unreadCount: number;
    }>;
}
