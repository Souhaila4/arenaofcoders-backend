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
exports.CompetitionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const competition_status_enum_1 = require("./competition-status.enum");
let CompetitionService = class CompetitionService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async createCompetition(createDto, adminUserId) {
        const startDate = new Date(createDto.startDate);
        const endDate = new Date(createDto.endDate);
        const now = new Date();
        if (startDate <= now) {
            throw new common_1.BadRequestException('startDate must be in the future');
        }
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('endDate must be after startDate');
        }
        const createData = {
            title: createDto.title,
            description: createDto.description,
            difficulty: createDto.difficulty,
            specialty: createDto.specialty ?? null,
            startDate,
            endDate,
            rewardPool: createDto.rewardPool ?? 0,
            maxParticipants: createDto.maxParticipants ?? null,
            createdBy: adminUserId,
        };
        const competition = await this.prisma.competition.create({
            data: createData,
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: { select: { participants: true } },
            },
        });
        const created = competition;
        this.emitEvent('competition.created', {
            competitionId: created.id,
            title: created.title,
            createdBy: adminUserId,
            specialty: created.specialty ?? undefined,
        });
        if (created.specialty) {
            void this.notifyUsersMatchingSpecialty({
                id: created.id,
                title: created.title,
                specialty: created.specialty,
            }).catch((err) => console.error('Failed to notify users for new hackathon:', err));
        }
        return competition;
    }
    async notifyUsersMatchingSpecialty(competition) {
        if (!competition.specialty)
            return;
        const users = await this.prisma.user.findMany({
            where: {
                role: client_1.UserRole.USER,
                mainSpecialty: competition.specialty,
                isBanned: false,
            },
            select: { id: true, email: true, firstName: true },
        });
        const title = `New hackathon for ${competition.specialty}: ${competition.title}`;
        const body = `A new ${competition.specialty} hackathon is open. Check it out and join if you're interested!`;
        for (const user of users) {
            await this.prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'HACKATHON_MATCH',
                    title,
                    body,
                    competitionId: competition.id,
                },
            });
            await this.emailService.sendHackathonNotification(user.email, user.firstName, competition.title, competition.specialty);
        }
    }
    async updateCompetition(competitionId, updateDto, _adminUserId) {
        const competition = await this.findCompetitionById(competitionId);
        const lockedStatuses = [
            competition_status_enum_1.CompetitionStatus.RUNNING,
            competition_status_enum_1.CompetitionStatus.SUBMISSION_CLOSED,
            competition_status_enum_1.CompetitionStatus.EVALUATING,
            competition_status_enum_1.CompetitionStatus.COMPLETED,
        ];
        if (lockedStatuses.includes(competition.status)) {
            throw new common_1.BadRequestException('Cannot update a competition that is running or already completed');
        }
        if (updateDto.startDate || updateDto.endDate) {
            const startDate = new Date(updateDto.startDate ?? competition.startDate);
            const endDate = new Date(updateDto.endDate ?? competition.endDate);
            const now = new Date();
            if (updateDto.startDate && startDate <= now) {
                throw new common_1.BadRequestException('New startDate must be in the future');
            }
            if (endDate <= startDate) {
                throw new common_1.BadRequestException('endDate must be after startDate');
            }
        }
        const updateData = {
            ...updateDto,
            specialty: updateDto.specialty !== undefined ? updateDto.specialty : undefined,
            startDate: updateDto.startDate
                ? new Date(updateDto.startDate)
                : undefined,
            endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
        };
        const updated = await this.prisma.competition.update({
            where: { id: competitionId },
            data: updateData,
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: { select: { participants: true } },
            },
        });
        return updated;
    }
    async changeCompetitionStatus(competitionId, changeStatusDto, _adminUserId) {
        const competition = await this.findCompetitionById(competitionId);
        const currentStatus = competition.status;
        const newStatus = changeStatusDto.status;
        if (!this.isValidStatusTransition(currentStatus, newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition: ${currentStatus} → ${newStatus}. ` +
                `Allowed next status(es): [${competition_status_enum_1.VALID_STATUS_TRANSITIONS[currentStatus].join(', ')}]`);
        }
        const updated = await this.prisma.competition.update({
            where: { id: competitionId },
            data: { status: newStatus },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: { select: { participants: true } },
            },
        });
        this.emitEvent('competition.status_changed', {
            competitionId,
            oldStatus: currentStatus,
            newStatus,
        });
        if (newStatus === competition_status_enum_1.CompetitionStatus.RUNNING) {
            this.emitEvent('competition.started', {
                competitionId,
                title: competition.title,
            });
        }
        if (newStatus === competition_status_enum_1.CompetitionStatus.COMPLETED) {
            this.emitEvent('competition.completed', {
                competitionId,
                title: competition.title,
            });
        }
        return updated;
    }
    async archiveCompetition(competitionId) {
        const competition = await this.findCompetitionById(competitionId);
        if (competition.status !== competition_status_enum_1.CompetitionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Only COMPLETED competitions can be archived');
        }
        return this.prisma.competition.update({
            where: { id: competitionId },
            data: { status: competition_status_enum_1.CompetitionStatus.ARCHIVED, isActive: false },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: { select: { participants: true } },
            },
        });
    }
    async joinCompetition(competitionId, userId) {
        const competition = await this.findCompetitionById(competitionId);
        if (competition.status !== competition_status_enum_1.CompetitionStatus.OPEN_FOR_ENTRY) {
            throw new common_1.BadRequestException(`This competition is not open for entry. Current status: ${competition.status}`);
        }
        const existingParticipation = await this.prisma.competitionParticipant.findUnique({
            where: {
                competitionId_userId: { competitionId, userId },
            },
        });
        if (existingParticipation) {
            throw new common_1.ConflictException('You have already joined this competition');
        }
        if (competition.maxParticipants !== null) {
            const currentCount = await this.prisma.competitionParticipant.count({
                where: { competitionId, status: competition_status_enum_1.ParticipantStatus.JOINED },
            });
            if (currentCount >= competition.maxParticipants) {
                throw new common_1.BadRequestException('This competition has reached its maximum participant limit');
            }
        }
        const participation = await this.prisma.competitionParticipant.create({
            data: {
                competitionId,
                userId,
                status: competition_status_enum_1.ParticipantStatus.JOINED,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        mainSpecialty: true,
                    },
                },
                competition: {
                    select: { id: true, title: true, status: true },
                },
            },
        });
        this.emitEvent('competition.user_joined', {
            competitionId,
            userId,
            competitionTitle: competition.title,
        });
        return participation;
    }
    async getLeaderboard(competitionId) {
        await this.findCompetitionById(competitionId);
        const participants = await this.prisma.competitionParticipant.findMany({
            where: { competitionId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        mainSpecialty: true,
                        totalChallenges: true,
                        totalWins: true,
                    },
                },
            },
            orderBy: [
                { status: 'asc' },
                { joinedAt: 'asc' },
            ],
        });
        return {
            competitionId,
            totalParticipants: participants.length,
            leaderboard: participants.map((p, index) => ({
                rank: index + 1,
                participantId: p.id,
                status: p.status,
                joinedAt: p.joinedAt,
                user: p.user,
            })),
        };
    }
    async getGlobalLeaderboard(limit = 20) {
        const users = await this.prisma.user.findMany({
            where: { isBanned: false, role: client_1.UserRole.USER },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                mainSpecialty: true,
                totalChallenges: true,
                totalWins: true,
            },
            orderBy: [{ totalWins: 'desc' }, { totalChallenges: 'desc' }],
            take: limit,
        });
        return {
            totalUsers: users.length,
            leaderboard: users.map((u, index) => ({
                rank: index + 1,
                ...u,
                winRate: u.totalChallenges > 0
                    ? Math.round((u.totalWins / u.totalChallenges) * 100)
                    : 0,
            })),
        };
    }
    async findAllCompetitions(queryDto) {
        const { status, difficulty, specialty, onlyActive, page = 1, limit = 10, } = queryDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (difficulty)
            where.difficulty = difficulty;
        if (specialty)
            where.specialty = specialty;
        if (onlyActive !== undefined)
            where.isActive = onlyActive;
        const [competitions, totalCount] = await Promise.all([
            this.prisma.competition.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    _count: { select: { participants: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.competition.count({ where }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        return {
            data: competitions,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    async findCompetitionsForUser(userId, queryDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { mainSpecialty: true },
        });
        const { status, difficulty, specialty, onlyActive, page = 1, limit = 10, } = queryDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (difficulty)
            where.difficulty = difficulty;
        if (specialty)
            where.specialty = specialty;
        if (onlyActive !== undefined)
            where.isActive = onlyActive;
        if (user?.mainSpecialty && !specialty) {
            where.OR = [{ specialty: user.mainSpecialty }, { specialty: null }];
        }
        const [competitions, totalCount] = await Promise.all([
            this.prisma.competition.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    _count: { select: { participants: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.competition.count({ where }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        return {
            data: competitions,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    async findCompetitionById(competitionId) {
        const competition = await this.prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: { select: { participants: true } },
            },
        });
        if (!competition) {
            throw new common_1.NotFoundException(`Competition with id "${competitionId}" not found`);
        }
        return competition;
    }
    async getCompetitionParticipants(competitionId) {
        await this.findCompetitionById(competitionId);
        const participants = await this.prisma.competitionParticipant.findMany({
            where: { competitionId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        mainSpecialty: true,
                        totalChallenges: true,
                        totalWins: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });
        return {
            competitionId,
            totalParticipants: participants.length,
            participants,
        };
    }
    async getMyParticipation(competitionId, userId) {
        await this.findCompetitionById(competitionId);
        const participation = await this.prisma.competitionParticipant.findUnique({
            where: {
                competitionId_userId: { competitionId, userId },
            },
            include: {
                competition: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                    },
                },
            },
        });
        if (!participation) {
            throw new common_1.NotFoundException('You are not registered in this competition');
        }
        return participation;
    }
    async handleCompetitionStatusUpdates() {
        console.log('🔄 [CRON] Checking competition statuses...');
        const now = new Date();
        try {
            const toStart = await this.prisma.competition.findMany({
                where: {
                    status: competition_status_enum_1.CompetitionStatus.OPEN_FOR_ENTRY,
                    startDate: { lte: now },
                    isActive: true,
                },
            });
            for (const c of toStart) {
                await this.prisma.competition.update({
                    where: { id: c.id },
                    data: { status: competition_status_enum_1.CompetitionStatus.RUNNING },
                });
                console.log(`✅ [CRON] "${c.title}" → RUNNING`);
                this.emitEvent('competition.started', {
                    competitionId: c.id,
                    title: c.title,
                });
            }
            const toClose = await this.prisma.competition.findMany({
                where: {
                    status: competition_status_enum_1.CompetitionStatus.RUNNING,
                    endDate: { lte: now },
                    isActive: true,
                },
            });
            for (const c of toClose) {
                await this.prisma.competition.update({
                    where: { id: c.id },
                    data: { status: competition_status_enum_1.CompetitionStatus.SUBMISSION_CLOSED },
                });
                console.log(`✅ [CRON] "${c.title}" → SUBMISSION_CLOSED`);
                this.emitEvent('competition.submission_closed', {
                    competitionId: c.id,
                    title: c.title,
                });
            }
        }
        catch (error) {
            console.error('❌ [CRON] Error updating competition statuses:', error);
        }
    }
    isValidStatusTransition(currentStatus, newStatus) {
        return (competition_status_enum_1.VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false);
    }
    emitEvent(eventName, data) {
        console.log(`🎯 [EVENT] ${eventName}:`, JSON.stringify(data));
    }
};
exports.CompetitionService = CompetitionService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionService.prototype, "handleCompetitionStatusUpdates", null);
exports.CompetitionService = CompetitionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], CompetitionService);
//# sourceMappingURL=competition.service.js.map