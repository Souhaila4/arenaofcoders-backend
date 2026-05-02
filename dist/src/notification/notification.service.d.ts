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
                specialty: import(".prisma/client").$Enums.Specialty | null;
                startDate: Date;
                endDate: Date;
                status: import(".prisma/client").$Enums.CompetitionStatus;
            } | null;
        } & {
            id: string;
            title: string;
            createdAt: Date;
            competitionId: string | null;
            userId: string;
            type: string;
            body: string | null;
            read: boolean;
        })[];
        unreadCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        competition: {
            id: string;
            title: string;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        } | null;
    } & {
        id: string;
        title: string;
        createdAt: Date;
        competitionId: string | null;
        userId: string;
        type: string;
        body: string | null;
        read: boolean;
    }>;
    markAllAsRead(userId: string): Promise<{
        data: ({
            competition: {
                id: string;
                title: string;
                specialty: import(".prisma/client").$Enums.Specialty | null;
                startDate: Date;
                endDate: Date;
                status: import(".prisma/client").$Enums.CompetitionStatus;
            } | null;
        } & {
            id: string;
            title: string;
            createdAt: Date;
            competitionId: string | null;
            userId: string;
            type: string;
            body: string | null;
            read: boolean;
        })[];
        unreadCount: number;
    }>;
}
