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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const room_specialty_config_1 = require("../stream/room-specialty.config");
const N8N_WEBHOOK_TEST_TIMEOUT_MS = 120_000;
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [totalUsers, usersByRole, usersBySpecialty, verifiedCount, bannedCount, noSpecialtyCount,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.groupBy({
                by: ['role'],
                _count: { id: true },
            }),
            this.prisma.user.groupBy({
                by: ['mainSpecialty'],
                _count: { id: true },
                where: { mainSpecialty: { not: null } },
            }),
            this.prisma.user.count({ where: { isEmailVerified: true } }),
            this.prisma.user.count({ where: { isBanned: true } }),
            this.prisma.user.count({ where: { mainSpecialty: null } }),
        ]);
        const byRole = usersByRole.reduce((acc, r) => {
            acc[r.role] = r._count.id;
            return acc;
        }, {});
        const bySpecialty = room_specialty_config_1.ALL_SPECIALTIES.reduce((acc, s) => {
            const found = usersBySpecialty.find((x) => x.mainSpecialty === s);
            acc[s] = found?._count.id ?? 0;
            return acc;
        }, {});
        return {
            users: {
                total: totalUsers,
                verified: verifiedCount,
                banned: bannedCount,
                noSpecialty: noSpecialtyCount,
                byRole,
            },
            specialties: {
                list: room_specialty_config_1.ALL_SPECIALTIES,
                bySpecialty,
            },
            rooms: {
                total: room_specialty_config_1.ALL_SPECIALTIES.length,
                description: 'Une salle par spécialité (créée à la demande)',
            },
        };
    }
    userListSelect = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        mainSpecialty: true,
        isEmailVerified: true,
        isBanned: true,
        createdAt: true,
    };
    async getRecentUsers(limit = 10) {
        return this.prisma.user.findMany({
            take: Math.min(limit, 50),
            orderBy: { createdAt: 'desc' },
            select: this.userListSelect,
        });
    }
    async getUsers(options) {
        const limit = Math.min(options.limit ?? 20, 100);
        const offset = options.offset ?? 0;
        const search = options.search?.trim().toLowerCase();
        const where = search
            ? {
                OR: [
                    { email: { contains: search } },
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                ],
            }
            : undefined;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                select: this.userListSelect,
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, limit, offset };
    }
    async triggerN8nWebhookTest() {
        const url = process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_TEST_URL;
        if (!url) {
            return {
                success: false,
                message: 'N8N_WEBHOOK_URL (ou N8N_WEBHOOK_TEST_URL) non configuré dans .env',
            };
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), N8N_WEBHOOK_TEST_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok) {
                const text = await res.text();
                return {
                    success: false,
                    message: text || `HTTP ${res.status}`,
                };
            }
            return { success: true };
        }
        catch (err) {
            clearTimeout(timeoutId);
            const isAbort = err instanceof Error && err.name === 'AbortError';
            return {
                success: false,
                message: isAbort
                    ? 'Délai dépassé (2 min). Vérifiez que le workflow a bien reçu le test event dans n8n.'
                    : err instanceof Error
                        ? err.message
                        : 'Échec du déclenchement du workflow',
            };
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map