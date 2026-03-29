"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = class NotificationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllForUser(userId, options = {}) {
        const { unreadOnly = false, limit = 50 } = options;
        const where = { userId };
        if (unreadOnly)
            where.read = false;
        const notifications = await this.prisma.notification.findMany({
            where,
            include: {
                competition: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        specialty: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        const unreadCount = await this.prisma.notification.count({
            where: { userId, read: false },
        });
        return {
            data: notifications,
            unreadCount,
        };
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
            include: {
                competition: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        specialty: true,
                    },
                },
            },
        });
    }
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        return this.findAllForUser(userId);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map