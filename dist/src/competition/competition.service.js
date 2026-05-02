"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CompetitionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionService = void 0;
const common_1 = require("@nestjs/common");
const orchestrator_agent_1 = require("../agents/orchestrator.agent");
const github_url_util_1 = require("../common/github-url.util");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const anti_cheat_service_1 = require("../anti-cheat/anti-cheat.service");
const scoring_dispatcher_service_1 = require("../scoring/scoring-dispatcher.service");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const competition_status_enum_1 = require("./competition-status.enum");
const client_2 = require("@prisma/client");
const wallet_service_1 = require("../wallet/wallet.service");
const equipe_service_1 = require("../equipe/equipe.service");
const stream_service_1 = require("../stream/stream.service");
const CHECKPOINT_SUBMISSION_WINDOW_MINUTES = 15;
const DEFAULT_TOP_PARTICIPANTS_LIMIT = 5;
let CompetitionService = CompetitionService_1 = class CompetitionService {
    prisma;
    emailService;
    antiCheatService;
    scoringDispatcher;
    walletService;
    streamService;
    orchestratorAgent;
    equipeService;
    logger = new common_1.Logger(CompetitionService_1.name);
    constructor(prisma, emailService, antiCheatService, scoringDispatcher, walletService, streamService, orchestratorAgent, equipeService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.antiCheatService = antiCheatService;
        this.scoringDispatcher = scoringDispatcher;
        this.walletService = walletService;
        this.streamService = streamService;
        this.orchestratorAgent = orchestratorAgent;
        this.equipeService = equipeService;
    }
    async createCompetition(createDto, user) {
        const adminUserId = user.id;
        const startDate = new Date(createDto.startDate);
        const endDate = new Date(createDto.endDate);
        const now = new Date();
        if (startDate <= now) {
            throw new common_1.BadRequestException('startDate must be in the future');
        }
        const durationMs = endDate.getTime() - startDate.getTime();
        if (durationMs < 8 * 60 * 60 * 1000) {
            throw new common_1.BadRequestException("Désolé, la durée minimale d'un hackathon est fixée à 8 heures pour garantir une compétition équitable et permettre la génération automatique des points de contrôle (checkpoints).");
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
            antiCheatEnabled: createDto.antiCheatEnabled ?? false,
            antiCheatThreshold: createDto.antiCheatThreshold ?? 70.0,
            createdBy: adminUserId,
            status: competition_status_enum_1.CompetitionStatus.OPEN_FOR_ENTRY,
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
        await this.createDefaultCheckpoints(competition.id, startDate, endDate);
        const created = competition;
        this.emitEvent('competition.created', {
            competitionId: created.id,
            title: created.title,
            createdBy: adminUserId,
            specialty: created.specialty ?? undefined,
        });
        void this.notifyUsersForNewHackathon({
            id: created.id,
            title: created.title,
            specialty: created.specialty ?? null,
        }).catch((err) => console.error('Failed to notify users for new hackathon:', err));
        if ((createData.rewardPool ?? 0) > 0) {
            void this.walletService
                .lockEscrow(adminUserId, createData.rewardPool, competition.id)
                .catch((err) => this.logger.warn(`Escrow lock skipped for competition ${competition.id}: ${err?.message ?? err}`));
        }
        return competition;
    }
    async getHackathonIdeas() {
        const webhookUrl = 'https://sayariii.app.n8n.cloud/webhook/generate-ideas';
        try {
            const response = await axios_1.default.post(webhookUrl, {}, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 60000,
            });
            const data = response.data;
            if (data && Array.isArray(data.ideas)) {
                return { ideas: data.ideas };
            }
            this.logger.warn('Hackathon ideas webhook returned unexpected format');
            return { ideas: [] };
        }
        catch (error) {
            this.logger.error(`Failed to fetch hackathon ideas: ${error?.message ?? error}`, error?.stack);
            throw new common_1.BadRequestException('Unable to fetch hackathon ideas. Please try again later.');
        }
    }
    async createDefaultCheckpoints(competitionId, startDate, endDate) {
        const defaults = [];
        const totalDurationMs = endDate.getTime() - startDate.getTime();
        const totalHours = totalDurationMs / (60 * 60 * 1000);
        const interval = totalHours < 19 ? 4 : 6;
        const numCheckpointsMax = Math.floor(totalHours / interval);
        let activeCpIndex = 1;
        for (let i = 1; i <= numCheckpointsMax; i++) {
            const opensAt = new Date(startDate.getTime() + i * interval * 60 * 60 * 1000);
            const blackoutLimit = new Date(endDate.getTime() - 30 * 60 * 1000);
            if (opensAt >= blackoutLimit) {
                continue;
            }
            let dueDate = new Date(opensAt.getTime() + 15 * 60 * 1000);
            if (dueDate > endDate) {
                dueDate = endDate;
            }
            defaults.push({
                competitionId,
                title: `Checkpoint ${activeCpIndex}`,
                description: `Évaluation Anti-Triche automatique par l'IA (Checkpoint ${activeCpIndex}). Vous avez 15 minutes à partir de l'ouverture pour soumettre.`,
                order: activeCpIndex,
                dueDate,
                isMandatory: true,
            });
            activeCpIndex++;
        }
        if (defaults.length === 0) {
            defaults.push({
                competitionId,
                title: 'Checkpoint Unique',
                description: "Évaluation Anti-Triche automatique par l'IA de mi-parcours.",
                order: 1,
                dueDate: new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2),
                isMandatory: true,
            });
        }
        try {
            this.logger.log(`🔍 Tentative d'insertion de ${defaults.length} checkpoints pour ${competitionId}`);
            await this.prisma.competitionCheckpoint.createMany({
                data: defaults,
            });
            this.logger.log(`✅ ${defaults.length} checkpoints créés avec succès.`);
        }
        catch (error) {
            this.logger.error(`❌ Échec de la création des checkpoints: ${error.message}`);
            console.dir(error, { depth: null });
            console.log('--- DEFAULT DATA ---', JSON.stringify(defaults, null, 2));
            throw error;
        }
    }
    async createCheckpointSubmissionsForParticipant(participantId, competitionId) {
        const checkpoints = await this.prisma.competitionCheckpoint.findMany({
            where: { competitionId },
            select: { id: true },
            orderBy: { order: 'asc' },
        });
        await this.prisma.checkpointSubmission.createMany({
            data: checkpoints.map((cp) => ({
                checkpointId: cp.id,
                participantId,
                status: client_2.CheckpointStatus.PENDING,
            })),
        });
    }
    async notifyUsersForNewHackathon(competition) {
        const whereClause = {
            role: client_1.UserRole.USER,
            isBanned: false,
        };
        if (competition.specialty) {
            whereClause.mainSpecialty = competition.specialty;
        }
        const users = await this.prisma.user.findMany({
            where: whereClause,
            select: { id: true, email: true, firstName: true, fcmToken: true },
        });
        const title = competition.specialty
            ? `Nouveau hackathon ${competition.specialty}: ${competition.title}`
            : `Nouveau hackathon: ${competition.title}`;
        const body = competition.specialty
            ? `Un nouveau hackathon ${competition.specialty} est ouvert. Rejoignez-le !`
            : `Un nouveau hackathon est disponible. Découvrez-le et participez !`;
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
        }
        const fcmTokens = users
            .filter((u) => u.fcmToken)
            .map((u) => u.fcmToken);
        if (fcmTokens.length > 0) {
            try {
                if (!admin.apps.length) {
                    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
                    const serviceAccount = require(serviceAccountPath);
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                }
                const message = {
                    tokens: fcmTokens,
                    notification: {
                        title,
                        body,
                    },
                    data: {
                        competitionId: competition.id,
                        type: 'NEW_HACKATHON',
                    },
                };
                const result = await admin.messaging().sendEachForMulticast(message);
                console.log(`📱 Push notifications: ${result.successCount} sent, ${result.failureCount} failed`);
            }
            catch (pushError) {
                console.error('📱 Failed to send push notifications:', pushError);
            }
        }
        console.log(`📢 Notifications sent to ${users.length} users for hackathon "${competition.title}"`);
    }
    async updateCompetition(competitionId, updateDto, user) {
        const competition = await this.findCompetitionById(competitionId);
        if (user.role === client_1.UserRole.COMPANY && competition.createdBy !== user.id) {
            throw new common_1.ForbiddenException('You can only modify your own hackathons');
        }
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
            const durationMs = endDate.getTime() - startDate.getTime();
            if (durationMs < 8 * 60 * 60 * 1000) {
                throw new common_1.BadRequestException("Désolé, la durée minimale d'un hackathon est fixée à 8 heures pour garantir une compétition équitable et permettre la génération automatique des points de contrôle (checkpoints).");
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
    async changeCompetitionStatus(competitionId, changeStatusDto, user) {
        const competition = await this.findCompetitionById(competitionId);
        if (user.role === client_1.UserRole.COMPANY && competition.createdBy !== user.id) {
            throw new common_1.ForbiddenException('You can only modify your own hackathons');
        }
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
            void this.equipeService
                .autoAssignSoloUsers(competitionId)
                .catch((err) => this.logger.warn(`Auto-assign failed for ${competitionId}: ${err?.message ?? err}`));
        }
        if (newStatus === competition_status_enum_1.CompetitionStatus.COMPLETED) {
            this.emitEvent('competition.completed', {
                competitionId,
                title: competition.title,
            });
            void this.archiveTeamChatChannels(competitionId).catch((err) => this.logger.warn(`Failed to archive team chat channels for competition ${competitionId}: ${err?.message ?? err}`));
        }
        return updated;
    }
    async archiveCompetition(competitionId, user) {
        const competition = await this.findCompetitionById(competitionId);
        if (user.role === client_1.UserRole.COMPANY && competition.createdBy !== user.id) {
            throw new common_1.ForbiddenException('You can only modify your own hackathons');
        }
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
    async joinCompetition(competitionId, userId, faceImage) {
        const competition = await this.findCompetitionById(competitionId);
        if (competition.status !== competition_status_enum_1.CompetitionStatus.OPEN_FOR_ENTRY &&
            competition.status !== competition_status_enum_1.CompetitionStatus.RUNNING) {
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
        let hackathonFaceUrl = '/uploads/hackathon-faces/default.png';
        if (faceImage) {
            const uploadDir = path.join(process.cwd(), 'uploads', 'hackathon-faces');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(faceImage.originalname);
            const filename = `face-${userId}-${competitionId}-${uniqueSuffix}${ext}`;
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, faceImage.buffer);
            hackathonFaceUrl = `/uploads/hackathon-faces/${filename}`;
        }
        const participation = await this.prisma.competitionParticipant.create({
            data: {
                competitionId,
                userId,
                status: competition_status_enum_1.ParticipantStatus.JOINED,
                hackathonFaceUrl,
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
        await this.createCheckpointSubmissionsForParticipant(participation.id, competitionId);
        await this.prisma.user.update({
            where: { id: userId },
            data: { totalChallenges: { increment: 1 } },
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
    async getTopParticipants(competitionId, limitOverride) {
        const competition = await this.findCompetitionById(competitionId);
        const take = Math.min(Math.max(1, limitOverride ?? competition.topN ?? 5), 50);
        const participants = await this.prisma.competitionParticipant.findMany({
            where: {
                competitionId,
                status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                score: { not: null },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        email: true,
                        mainSpecialty: true,
                    },
                },
            },
            orderBy: {
                score: 'desc',
            },
            take,
        });
        return {
            competitionId,
            topN: take,
            winnerId: competition.winnerId ?? null,
            preselected: participants.map((p, index) => {
                const row = p;
                return {
                    rank: index + 1,
                    participantId: p.id,
                    score: row.score,
                    antiCheatScore: p.antiCheatScore ?? undefined,
                    githubUrl: p.githubUrl ?? undefined,
                    scoringReport: p.scoringReport ?? undefined,
                    isWinner: p.isWinner,
                    submittedAt: p.submittedAt ?? undefined,
                    user: row.user,
                };
            }),
        };
    }
    async sendEmailToPreselectedParticipants(competitionId, subjectTemplate, htmlBodyTemplate, limit) {
        const competition = await this.findCompetitionById(competitionId);
        const top = await this.getTopParticipants(competitionId, limit);
        const failedEmails = [];
        let sent = 0;
        const titleSafe = this.escapeHtmlForEmail(competition.title);
        for (const row of top.preselected) {
            const email = row.user?.email;
            if (!email?.trim())
                continue;
            const firstName = row.user?.firstName ?? 'Participant';
            const firstNameSafe = this.escapeHtmlForEmail(firstName);
            const subject = subjectTemplate
                .replace(/\{\{firstName\}\}/g, firstName)
                .replace(/\{\{competitionTitle\}\}/g, competition.title);
            const html = htmlBodyTemplate
                .replace(/\{\{firstName\}\}/g, firstNameSafe)
                .replace(/\{\{competitionTitle\}\}/g, titleSafe);
            try {
                await this.emailService.sendCustomHtmlEmail(email, subject, html);
                sent++;
            }
            catch {
                failedEmails.push(email);
            }
        }
        return {
            sent,
            total: top.preselected.length,
            failedEmails,
        };
    }
    escapeHtmlForEmail(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    async getAllParticipantsForAdmin(competitionId) {
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
                        email: true,
                        mainSpecialty: true,
                    },
                },
            },
            orderBy: [
                { status: 'asc' },
                { score: 'desc' },
            ],
        });
        return {
            competitionId,
            totalParticipants: participants.length,
            participants: participants.map((p) => ({
                participantId: p.id,
                status: p.status,
                joinedAt: p.joinedAt,
                githubUrl: p.githubUrl,
                antiCheatScore: p.antiCheatScore,
                score: p.score,
                scoringReport: p.scoringReport,
                isWinner: p.isWinner,
                submittedAt: p.submittedAt,
                user: p.user,
            })),
        };
    }
    async selectWinner(competitionId, participantId, adminUserId) {
        const competition = await this.findCompetitionById(competitionId);
        if (competition.createdBy !== adminUserId) {
            const adminUser = await this.prisma.user.findUnique({
                where: { id: adminUserId },
            });
            if (!adminUser || adminUser.role !== client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only the hackathon creator or an admin can select a winner.');
            }
        }
        const participant = await this.prisma.competitionParticipant.findUnique({
            where: { id: participantId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!participant || participant.competitionId !== competitionId) {
            throw new common_1.NotFoundException('Participant not found in this competition.');
        }
        if (participant.status !== competition_status_enum_1.ParticipantStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted participants can be selected as winner.');
        }
        if (competition.winnerId) {
            await this.prisma.competitionParticipant.updateMany({
                where: { competitionId, isWinner: true },
                data: { isWinner: false },
            });
        }
        await this.prisma.competitionParticipant.update({
            where: { id: participantId },
            data: { isWinner: true },
        });
        await this.prisma.competition.update({
            where: { id: competitionId },
            data: { winnerId: participantId },
        });
        await this.prisma.user.update({
            where: { id: participant.userId },
            data: { totalWins: { increment: 1 } },
        });
        const creator = await this.prisma.user.findUnique({
            where: { id: competition.createdBy },
            select: { firstName: true, lastName: true, email: true },
        });
        await this.prisma.notification.create({
            data: {
                userId: participant.userId,
                type: 'HACKATHON_WINNER',
                title: `🏆 Vous avez gagné le hackathon "${competition.title}" !`,
                body: `Félicitations ! Vous avez été sélectionné(e) comme gagnant(e).\n\nContact de l'organisateur:\nNom: ${creator?.firstName ?? ''} ${creator?.lastName ?? ''}\nEmail: ${creator?.email ?? 'Non disponible'}`,
                competitionId,
            },
        });
        this.logger.log(`Winner selected: participant ${participantId} for competition ${competitionId}`);
        let rewardResult = null;
        if (competition.rewardPool > 0) {
            try {
                rewardResult = await this.walletService.releaseRewardToWinner(participant.userId, competition.rewardPool, competitionId);
                this.logger.log(`Reward release result for ${participant.userId}: ${JSON.stringify(rewardResult)}`);
            }
            catch (err) {
                this.logger.error(`Reward release failed: ${err?.message ?? err}`);
            }
        }
        return {
            message: `${participant.user.firstName} ${participant.user.lastName} has been selected as the winner!`,
            winnerId: participantId,
            userId: participant.userId,
            reward: rewardResult ?? null,
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
                role: true,
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
    previousRankMap = new Map();
    async getGlobalLeaderboardWithMovements(limit = 50) {
        const result = await this.getGlobalLeaderboard(limit);
        const enriched = result.leaderboard.map((entry) => {
            const prevRank = this.previousRankMap.get(entry.id);
            let movement = 'new';
            if (prevRank !== undefined) {
                if (entry.rank < prevRank)
                    movement = 'up';
                else if (entry.rank > prevRank)
                    movement = 'down';
                else
                    movement = 'same';
            }
            return {
                ...entry,
                previousRank: prevRank ?? entry.rank,
                movement,
            };
        });
        this.previousRankMap.clear();
        for (const entry of enriched) {
            this.previousRankMap.set(entry.id, entry.rank);
        }
        return {
            type: 'leaderboard_update',
            timestamp: new Date().toISOString(),
            totalUsers: result.totalUsers,
            leaderboard: enriched,
        };
    }
    async findAllCompetitions(queryDto, creatorId) {
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
        if (creatorId)
            where.createdBy = creatorId;
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
            data: competitions.map((comp) => this.censorPreHackathonDetails(comp)),
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
            select: { mainSpecialty: true, role: true },
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
        if (user?.role === 'COMPANY') {
            where.createdBy = userId;
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
            data: competitions.map((comp) => this.censorPreHackathonDetails(comp, user?.role, userId)),
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
    async getCompetitionsWonByUser(userId) {
        const participations = await this.prisma.competitionParticipant.findMany({
            where: {
                userId,
                isWinner: true,
            },
            include: {
                competition: {
                    include: {
                        creator: {
                            select: {
                                firstName: true,
                                lastName: true,
                                id: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                        _count: { select: { participants: true } },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
        return {
            data: participations
                .map((p) => p.competition)
                .map((comp) => this.censorPreHackathonDetails(comp)),
            pagination: {
                page: 1,
                limit: 100,
                totalCount: participations.length,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            },
        };
    }
    async findCompetitionById(competitionId, requestUser) {
        const competition = await this.prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                _count: { select: { participants: true } },
            },
        });
        if (!competition) {
            throw new common_1.NotFoundException(`Competition with id "${competitionId}" not found`);
        }
        return this.censorPreHackathonDetails(competition, requestUser?.role, requestUser?.id);
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
        let equipeRole = null;
        if (participation.equipeId) {
            const membership = await this.prisma.equipeMember.findFirst({
                where: { equipeId: participation.equipeId, userId },
            });
            equipeRole = membership?.role ?? null;
        }
        const result = participation;
        const score = result.score ?? undefined;
        const antiCheatScore = participation.antiCheatScore ?? undefined;
        let isPreselected = false;
        let preselectedRank = null;
        if (participation.status === competition_status_enum_1.ParticipantStatus.SUBMITTED &&
            result.score != null) {
            const topIds = await this.prisma.competitionParticipant.findMany({
                where: {
                    competitionId,
                    status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                    score: { not: null },
                },
                select: { id: true },
                orderBy: {
                    score: 'desc',
                },
                take: DEFAULT_TOP_PARTICIPANTS_LIMIT,
            });
            const rankIndex = topIds.findIndex((p) => p.id === participation.id);
            if (rankIndex >= 0) {
                isPreselected = true;
                preselectedRank = rankIndex + 1;
            }
        }
        return {
            ...participation,
            score,
            antiCheatScore,
            isPreselected,
            preselectedRank,
            equipeId: participation.equipeId,
            equipeRole,
        };
    }
    async getCompetitionCheckpoints(competitionId) {
        await this.findCompetitionById(competitionId);
        return this.prisma.competitionCheckpoint.findMany({
            where: { competitionId },
            orderBy: { order: 'asc' },
        });
    }
    async getMyCheckpointSubmissions(competitionId, userId) {
        await this.findCompetitionById(competitionId);
        const participation = await this.prisma.competitionParticipant.findUnique({
            where: { competitionId_userId: { competitionId, userId } },
        });
        if (!participation) {
            throw new common_1.NotFoundException('You are not registered in this competition');
        }
        return this.prisma.checkpointSubmission.findMany({
            where: { participantId: participation.id },
            include: {
                checkpoint: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        dueDate: true,
                        isMandatory: true,
                    },
                },
            },
            orderBy: { checkpoint: { order: 'asc' } },
        });
    }
    async submitCheckpoint(competitionId, userId, checkpointId, dto) {
        await this.findCompetitionById(competitionId);
        const participation = await this.prisma.competitionParticipant.findUnique({
            where: { competitionId_userId: { competitionId, userId } },
        });
        if (!participation) {
            throw new common_1.NotFoundException('You are not registered in this competition');
        }
        if (participation.status === competition_status_enum_1.ParticipantStatus.DISQUALIFIED) {
            throw new common_1.BadRequestException('You have been disqualified and cannot submit checkpoints');
        }
        const submission = await this.prisma.checkpointSubmission.findUnique({
            where: {
                checkpointId_participantId: {
                    checkpointId,
                    participantId: participation.id,
                },
            },
            include: { checkpoint: true },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Checkpoint or submission not found');
        }
        if (submission.checkpoint.competitionId !== competitionId) {
            throw new common_1.BadRequestException('Checkpoint does not belong to this competition');
        }
        if (submission.status !== client_2.CheckpointStatus.PENDING &&
            submission.status !== client_2.CheckpointStatus.REJECTED) {
            throw new common_1.BadRequestException(`Checkpoint already ${submission.status.toLowerCase()}. Cannot resubmit.`);
        }
        const now = new Date();
        const dueDate = new Date(submission.checkpoint.dueDate);
        const opensAt = new Date(dueDate.getTime() - CHECKPOINT_SUBMISSION_WINDOW_MINUTES * 60 * 1000);
        if (now < opensAt) {
            throw new common_1.BadRequestException(`Checkpoint opens at ${opensAt.toISOString()}. You can submit during the ${CHECKPOINT_SUBMISSION_WINDOW_MINUTES}-minute window before the due date.`);
        }
        if (now > dueDate) {
            throw new common_1.BadRequestException('Checkpoint submission window has closed. Due date has passed.');
        }
        const checkpointOrder = submission.checkpoint.order;
        if (participation.equipeId) {
            const membership = await this.prisma.equipeMember.findFirst({
                where: { equipeId: participation.equipeId, userId },
            });
            if (!membership || membership.role !== client_1.EquipeMemberRole.LEADER) {
                throw new common_1.ForbiddenException("Seul le leader de l'équipe peut valider les checkpoints pour toute l'équipe.");
            }
            const advancedResult = await this.executeAdvancedCheckpointLogic(participation, submission, checkpointOrder, dto, competitionId, now);
            const teamParticipants = await this.prisma.competitionParticipant.findMany({
                where: {
                    competitionId,
                    equipeId: participation.equipeId,
                    status: { not: competition_status_enum_1.ParticipantStatus.DISQUALIFIED },
                },
                select: { id: true },
            });
            const participantIds = teamParticipants.map((p) => p.id);
            await this.prisma.checkpointSubmission.updateMany({
                where: {
                    checkpointId,
                    participantId: { in: participantIds },
                    status: { in: [client_2.CheckpointStatus.PENDING, client_2.CheckpointStatus.REJECTED] },
                },
                data: {
                    proofUrl: dto.proofUrl ?? undefined,
                    notes: dto.notes ?? (dto.proofUrl ? `Validé collectivement par le leader` : undefined),
                    status: advancedResult.status,
                    submittedAt: now,
                    internalAiScore: advancedResult.internalAiScore ?? undefined,
                    rejectionReason: advancedResult.rejectionReason ?? undefined,
                    warningMessage: advancedResult.warningMessage ?? undefined,
                },
            });
            if (checkpointOrder === 1 && advancedResult.status === client_2.CheckpointStatus.APPROVED) {
                const normalizedUrl = (0, github_url_util_1.normalizeGithubUrl)(dto.proofUrl);
                await this.prisma.competitionParticipant.updateMany({
                    where: {
                        competitionId,
                        equipeId: participation.equipeId,
                        status: { not: competition_status_enum_1.ParticipantStatus.DISQUALIFIED },
                    },
                    data: { baseRepositoryUrl: normalizedUrl },
                });
            }
            if (advancedResult.usedExtraLife) {
                await this.prisma.competitionParticipant.updateMany({
                    where: {
                        competitionId,
                        equipeId: participation.equipeId,
                        status: { not: competition_status_enum_1.ParticipantStatus.DISQUALIFIED },
                    },
                    data: { hasUsedExtraLife: true },
                });
            }
            const updatedSubmission = await this.prisma.checkpointSubmission.findUnique({
                where: { id: submission.id },
                include: { checkpoint: true },
            });
            return {
                ...updatedSubmission,
                advancedValidation: {
                    status: advancedResult.status,
                    internalAiScore: advancedResult.internalAiScore,
                    advancement: advancedResult.advancement,
                    warningMessage: advancedResult.warningMessage,
                    rejectionReason: advancedResult.rejectionReason,
                },
            };
        }
        const advancedResult = await this.executeAdvancedCheckpointLogic(participation, submission, checkpointOrder, dto, competitionId, now);
        const updatedSubmission = await this.prisma.checkpointSubmission.update({
            where: { id: submission.id },
            data: {
                proofUrl: dto.proofUrl ?? undefined,
                notes: dto.notes ?? undefined,
                status: advancedResult.status,
                submittedAt: now,
                internalAiScore: advancedResult.internalAiScore ?? undefined,
                rejectionReason: advancedResult.rejectionReason ?? undefined,
                warningMessage: advancedResult.warningMessage ?? undefined,
            },
            include: { checkpoint: true },
        });
        if (checkpointOrder === 1 && advancedResult.status === client_2.CheckpointStatus.APPROVED) {
            const normalizedUrl = (0, github_url_util_1.normalizeGithubUrl)(dto.proofUrl);
            await this.prisma.competitionParticipant.update({
                where: { id: participation.id },
                data: { baseRepositoryUrl: normalizedUrl },
            });
        }
        if (advancedResult.usedExtraLife) {
            await this.prisma.competitionParticipant.update({
                where: { id: participation.id },
                data: { hasUsedExtraLife: true },
            });
        }
        return {
            ...updatedSubmission,
            advancedValidation: {
                status: advancedResult.status,
                internalAiScore: advancedResult.internalAiScore,
                advancement: advancedResult.advancement,
                warningMessage: advancedResult.warningMessage,
                rejectionReason: advancedResult.rejectionReason,
            },
        };
    }
    async executeAdvancedCheckpointLogic(participation, submission, checkpointOrder, dto, competitionId, now) {
        if (checkpointOrder === 1) {
            this.logger.log(`📌 [CP1] Validating GitHub repository for participant ${participation.id}`);
            const validation = await (0, github_url_util_1.validateGithubRepoExists)(dto.proofUrl);
            if (!validation.valid) {
                this.logger.warn(`🚫 [CP1] GitHub validation failed for participant ${participation.id}: ${validation.reason}`);
                return {
                    status: client_2.CheckpointStatus.REJECTED,
                    internalAiScore: null,
                    advancement: null,
                    warningMessage: null,
                    rejectionReason: validation.reason,
                    usedExtraLife: false,
                };
            }
            this.logger.log(`✅ [CP1] GitHub repository validated. Saving baseRepositoryUrl for participant ${participation.id}`);
            return {
                status: client_2.CheckpointStatus.APPROVED,
                internalAiScore: null,
                advancement: null,
                warningMessage: null,
                rejectionReason: null,
                usedExtraLife: false,
            };
        }
        const normalizedSubmittedUrl = (0, github_url_util_1.normalizeGithubUrl)(dto.proofUrl);
        const savedBaseUrl = participation.baseRepositoryUrl;
        if (savedBaseUrl) {
            const normalizedBaseUrl = (0, github_url_util_1.normalizeGithubUrl)(savedBaseUrl);
            if (normalizedSubmittedUrl !== normalizedBaseUrl) {
                this.logger.warn(`🚫 [CP${checkpointOrder}] Repo mismatch for participant ${participation.id}: ` +
                    `submitted="${normalizedSubmittedUrl}" vs base="${normalizedBaseUrl}"`);
                return {
                    status: client_2.CheckpointStatus.REJECTED,
                    internalAiScore: null,
                    advancement: null,
                    warningMessage: null,
                    rejectionReason: 'Le lien soumis ne correspond pas au repository officiel',
                    usedExtraLife: false,
                };
            }
        }
        let currentAiScore = 0;
        let currentFileCount = 0;
        let aiFeedback = '';
        try {
            this.logger.log(`🤖 [CP${checkpointOrder}] Running AI evaluation for participant ${participation.id}...`);
            const participant = await this.prisma.competitionParticipant.findUnique({
                where: { id: participation.id },
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    competition: { select: { description: true } },
                },
            });
            const teamName = [participant?.user?.firstName, participant?.user?.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() || 'Unknown';
            const fullUrlForAi = dto.proofUrl.startsWith('http')
                ? dto.proofUrl
                : `https://${dto.proofUrl}`;
            const result = await this.orchestratorAgent.evaluateRepo(fullUrlForAi, {
                submissionId: participation.id,
                teamName,
                competitionTopic: participant?.competition?.description ?? undefined,
            });
            currentAiScore = Math.round(result.finalScore);
            currentFileCount = result.evidence?.repo?.fileCount ?? 0;
            const warnings = result.report?.warnings?.length ? '⚠️ ' + result.report.warnings.join(', ') : '';
            const highlights = result.report?.highlights?.length ? '✅ ' + result.report.highlights.join(', ') : '';
            aiFeedback = [warnings, highlights].filter(Boolean).join('\n') || 'Aucun retour textuel disponible.';
            this.logger.log(`✅ [CP${checkpointOrder}] AI Score: ${currentAiScore} | Files: ${currentFileCount} for participant ${participation.id}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`❌ [CP${checkpointOrder}] AI evaluation failed for participant ${participation.id}: ${message}`);
            return {
                status: client_2.CheckpointStatus.REJECTED,
                internalAiScore: null,
                advancement: null,
                warningMessage: null,
                rejectionReason: "L'évaluation de votre code a échoué (lien invalide ou erreur). Veuillez vérifier et réessayer.",
                usedExtraLife: false,
            };
        }
        const previousSubmission = await this.prisma.checkpointSubmission.findFirst({
            where: {
                participantId: participation.id,
                checkpoint: {
                    competitionId,
                    order: { lt: checkpointOrder },
                },
                internalAiScore: { not: null },
            },
            include: { checkpoint: true },
            orderBy: { checkpoint: { order: 'desc' } },
        });
        const previousFileCount = previousSubmission?.internalAiScore ?? 0;
        const advancement = currentFileCount - previousFileCount;
        this.logger.log(`📊 [CP${checkpointOrder}] Advancement for participant ${participation.id}: ` +
            `currentFiles=${currentFileCount} - previousFiles=${previousFileCount} = ${advancement} files added | AI Score=${currentAiScore}`);
        if (advancement > 0) {
            return {
                status: client_2.CheckpointStatus.APPROVED,
                internalAiScore: currentFileCount,
                advancement,
                warningMessage: null,
                rejectionReason: null,
                usedExtraLife: false,
            };
        }
        this.logger.warn(`🚫 [CP${checkpointOrder}] No new code for participant ${participation.id} (Files: ${currentFileCount} vs ${previousFileCount})`);
        return {
            status: client_2.CheckpointStatus.REJECTED,
            internalAiScore: currentFileCount,
            advancement,
            warningMessage: null,
            rejectionReason: `Aucun nouveau code détecté (Fichiers précédents: ${previousFileCount}, Fichiers actuels: ${currentFileCount}). Ajoutez du code à votre branche et réessayez.\n\n📝 Détails de l'IA (Score: ${currentAiScore}/100) :\n${aiFeedback}\n\n👉 Vous pouvez continuer à travailler et resoumettre un lien avant la fin du temps.`,
            usedExtraLife: false,
        };
    }
    async getCheckpointSubmissionsForReview(competitionId, user) {
        const competition = await this.findCompetitionById(competitionId);
        if (user.role === client_1.UserRole.COMPANY && competition.createdBy !== user.id) {
            throw new common_1.ForbiddenException('You can only access your own hackathons');
        }
        const submissions = await this.prisma.checkpointSubmission.findMany({
            where: {
                checkpoint: { competitionId },
            },
            include: {
                checkpoint: {
                    select: {
                        id: true,
                        title: true,
                        order: true,
                        dueDate: true,
                    },
                },
                participant: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ checkpoint: { order: 'asc' } }, { createdAt: 'asc' }],
        });
        return { competitionId, submissions };
    }
    async reviewCheckpointSubmission(competitionId, submissionId, user, dto) {
        const competition = await this.findCompetitionById(competitionId);
        if (user.role === client_1.UserRole.COMPANY && competition.createdBy !== user.id) {
            throw new common_1.ForbiddenException('You can only review your own hackathons');
        }
        const submission = await this.prisma.checkpointSubmission.findUnique({
            where: { id: submissionId },
            include: { checkpoint: true, participant: true },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        if (submission.checkpoint.competitionId !== competitionId) {
            throw new common_1.BadRequestException('Submission does not belong to this competition');
        }
        if (submission.status !== client_2.CheckpointStatus.SUBMITTED) {
            throw new common_1.BadRequestException(`Can only review SUBMITTED checkpoints. Current status: ${submission.status}`);
        }
        const now = new Date();
        const updated = await this.prisma.checkpointSubmission.update({
            where: { id: submissionId },
            data: {
                status: dto.status,
                reviewedAt: now,
            },
            include: { checkpoint: true, participant: true },
        });
        this.emitEvent('competition.checkpoint_reviewed', {
            competitionId,
            submissionId,
            status: dto.status,
            participantId: submission.participantId,
        });
        return updated;
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
                void this.equipeService
                    .autoAssignSoloUsers(c.id)
                    .then((r) => console.log(`✅ [CRON] Auto-assigned ${r.teamsCreated} teams for "${c.title}"`))
                    .catch((err) => console.error(`❌ [CRON] Auto-assign failed for "${c.title}":`, err));
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
            const overdueSubmissions = await this.prisma.checkpointSubmission.findMany({
                where: {
                    status: { in: [client_2.CheckpointStatus.PENDING, client_2.CheckpointStatus.REJECTED] },
                    checkpoint: { dueDate: { lt: now } },
                },
                include: { participant: true, checkpoint: true },
            });
            for (const sub of overdueSubmissions) {
                if (!sub.participant.hasUsedExtraLife) {
                    if (sub.participant.equipeId) {
                        await this.prisma.competitionParticipant.updateMany({
                            where: { equipeId: sub.participant.equipeId, competitionId: sub.participant.competitionId, status: { not: competition_status_enum_1.ParticipantStatus.DISQUALIFIED } },
                            data: { hasUsedExtraLife: true },
                        });
                        await this.prisma.checkpointSubmission.updateMany({
                            where: { checkpointId: sub.checkpointId, participant: { equipeId: sub.participant.equipeId } },
                            data: { status: client_2.CheckpointStatus.APPROVED, warningMessage: "⚠️ Checkpoint validé exceptionnellement après expiration (Joker utilisé)." },
                        });
                    }
                    else {
                        await this.prisma.competitionParticipant.update({
                            where: { id: sub.participantId },
                            data: { hasUsedExtraLife: true },
                        });
                        await this.prisma.checkpointSubmission.update({
                            where: { id: sub.id },
                            data: { status: client_2.CheckpointStatus.APPROVED, warningMessage: "⚠️ Checkpoint validé exceptionnellement après expiration (Joker utilisé)." },
                        });
                    }
                    console.log(`✅ [CRON] Joker used automatically for participant ${sub.participantId} on checkpoint ${sub.checkpointId}`);
                    continue;
                }
                if (sub.status === client_2.CheckpointStatus.PENDING) {
                    await this.prisma.checkpointSubmission.update({
                        where: { id: sub.id },
                        data: { status: client_2.CheckpointStatus.MISSED },
                    });
                }
                const failedCount = await this.prisma.checkpointSubmission.count({
                    where: {
                        participantId: sub.participantId,
                        status: {
                            in: [client_2.CheckpointStatus.MISSED, client_2.CheckpointStatus.REJECTED],
                        },
                    },
                });
                if (failedCount >= 3) {
                    await this.prisma.competitionParticipant.update({
                        where: { id: sub.participantId },
                        data: { status: competition_status_enum_1.ParticipantStatus.DISQUALIFIED },
                    });
                    console.log(`✅ [CRON] Checkpoint "${sub.checkpoint.title}" missed. Total failed (${failedCount}) >= 3 → participant ${sub.participantId} DISQUALIFIED`);
                    this.emitEvent('competition.participant_disqualified_checkpoint_missed', {
                        competitionId: sub.participant.competitionId,
                        participantId: sub.participantId,
                        checkpointId: sub.checkpointId,
                        checkpointTitle: sub.checkpoint.title,
                    });
                }
                else {
                    console.log(`ℹ️ [CRON] Checkpoint "${sub.checkpoint.title}" missed for participant ${sub.participantId}. Total failed: ${failedCount}/3 (Not disqualified yet).`);
                }
            }
        }
        catch (error) {
            console.error('❌ [CRON] Error updating competition statuses:', error);
        }
    }
    async submitWork(competitionId, userId, githubUrl) {
        const competition = await this.findCompetitionById(competitionId);
        if (competition.status !== competition_status_enum_1.CompetitionStatus.RUNNING) {
            throw new common_1.BadRequestException(`Competition is not running. Current status: ${competition.status}`);
        }
        const now = new Date();
        const submissionOpensAt = new Date(competition.endDate.getTime() - 20 * 60 * 1000);
        if (now < submissionOpensAt) {
            const formattedTime = submissionOpensAt.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            });
            throw new common_1.BadRequestException(`La soumission finale (GitHub) ne s'ouvre que 20 minutes avant la fin du hackathon. (Ouverture prévue à ${formattedTime})`);
        }
        const participation = await this.prisma.competitionParticipant.findUnique({
            where: { competitionId_userId: { competitionId, userId } },
        });
        if (!participation) {
            throw new common_1.NotFoundException('You are not registered in this competition');
        }
        if (participation.equipeId) {
            const membership = await this.prisma.equipeMember.findFirst({
                where: { equipeId: participation.equipeId, userId },
            });
            if (!membership || membership.role !== client_1.EquipeMemberRole.LEADER) {
                throw new common_1.ForbiddenException("Seul le leader de l'équipe peut soumettre le travail final.");
            }
            const equipe = await this.prisma.equipe.findUnique({
                where: { id: participation.equipeId },
            });
            if (equipe?.submittedAt) {
                throw new common_1.BadRequestException('Your team has already submitted work for this competition.');
            }
        }
        if (participation.status === competition_status_enum_1.ParticipantStatus.DISQUALIFIED) {
            throw new common_1.BadRequestException('You have been disqualified from this competition and cannot submit again.');
        }
        if (participation.status === competition_status_enum_1.ParticipantStatus.SUBMITTED) {
            throw new common_1.BadRequestException('You have already submitted your work for this competition.');
        }
        const alreadySubmittedMessage = 'You have already submitted your work for this competition.';
        if (competition.antiCheatEnabled) {
            const score = await this.antiCheatService.analyzeRepository(githubUrl);
            const threshold = competition.antiCheatThreshold ?? 70;
            if (score > threshold) {
                const dq = await this.prisma.competitionParticipant.updateMany({
                    where: {
                        id: participation.id,
                        status: competition_status_enum_1.ParticipantStatus.JOINED,
                    },
                    data: {
                        githubUrl,
                        antiCheatScore: score,
                        status: competition_status_enum_1.ParticipantStatus.DISQUALIFIED,
                        submittedAt: new Date(),
                    },
                });
                if (dq.count === 0) {
                    throw new common_1.BadRequestException(alreadySubmittedMessage);
                }
                const updated = await this.prisma.competitionParticipant.findUnique({
                    where: { id: participation.id },
                });
                if (!updated) {
                    throw new common_1.NotFoundException('Participant not found after update');
                }
                this.emitEvent('competition.participant_disqualified', {
                    competitionId,
                    userId,
                    score,
                    threshold,
                });
                return {
                    status: 'DISQUALIFIED',
                    message: `Your code has been detected as ${score}% AI-generated, which exceeds the ${threshold}% threshold. You have been disqualified.`,
                    antiCheatScore: score,
                    threshold,
                    participation: updated,
                };
            }
            const submittedAt = new Date();
            const equipeId = participation.equipeId;
            if (equipeId) {
                await this.prisma.$transaction(async (tx) => {
                    const ok = await tx.competitionParticipant.updateMany({
                        where: {
                            id: participation.id,
                            status: competition_status_enum_1.ParticipantStatus.JOINED,
                        },
                        data: {
                            githubUrl,
                            antiCheatScore: score,
                            status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                            submittedAt,
                        },
                    });
                    if (ok.count === 0) {
                        throw new common_1.BadRequestException(alreadySubmittedMessage);
                    }
                    await this.markEquipeSubmittedTx(tx, equipeId, githubUrl, score, competitionId, userId, submittedAt);
                });
            }
            else {
                const ok = await this.prisma.competitionParticipant.updateMany({
                    where: {
                        id: participation.id,
                        status: competition_status_enum_1.ParticipantStatus.JOINED,
                    },
                    data: {
                        githubUrl,
                        antiCheatScore: score,
                        status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                        submittedAt,
                    },
                });
                if (ok.count === 0) {
                    throw new common_1.BadRequestException(alreadySubmittedMessage);
                }
            }
            const updated = await this.prisma.competitionParticipant.findUnique({
                where: { id: participation.id },
            });
            if (!updated) {
                throw new common_1.NotFoundException('Participant not found after update');
            }
            this.scoringDispatcher.dispatchAfterSubmit(updated.id, githubUrl);
            this.emitEvent('competition.work_submitted', {
                competitionId,
                userId,
                score,
                passed: true,
            });
            return {
                status: 'SUBMITTED',
                message: `Your code passed the anti-cheat check with a score of ${score}% (threshold: ${threshold}%). Submission accepted!`,
                antiCheatScore: score,
                threshold,
                participation: updated,
            };
        }
        const submittedAtNoAc = new Date();
        const equipeIdNoAc = participation.equipeId;
        if (equipeIdNoAc) {
            await this.prisma.$transaction(async (tx) => {
                const ok = await tx.competitionParticipant.updateMany({
                    where: {
                        id: participation.id,
                        status: competition_status_enum_1.ParticipantStatus.JOINED,
                    },
                    data: {
                        githubUrl,
                        status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                        submittedAt: submittedAtNoAc,
                    },
                });
                if (ok.count === 0) {
                    throw new common_1.BadRequestException(alreadySubmittedMessage);
                }
                await this.markEquipeSubmittedTx(tx, equipeIdNoAc, githubUrl, null, competitionId, userId, submittedAtNoAc);
            });
        }
        else {
            const ok = await this.prisma.competitionParticipant.updateMany({
                where: {
                    id: participation.id,
                    status: competition_status_enum_1.ParticipantStatus.JOINED,
                },
                data: {
                    githubUrl,
                    status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                    submittedAt: submittedAtNoAc,
                },
            });
            if (ok.count === 0) {
                throw new common_1.BadRequestException(alreadySubmittedMessage);
            }
        }
        const updated = await this.prisma.competitionParticipant.findUnique({
            where: { id: participation.id },
        });
        if (!updated) {
            throw new common_1.NotFoundException('Participant not found after update');
        }
        this.scoringDispatcher.dispatchAfterSubmit(updated.id, githubUrl);
        this.emitEvent('competition.work_submitted', {
            competitionId,
            userId,
            antiCheatEnabled: false,
        });
        return {
            status: 'SUBMITTED',
            message: 'Your work has been submitted successfully!',
            participation: updated,
        };
    }
    async markEquipeSubmittedTx(tx, equipeId, githubUrl, antiCheatScore, competitionId, submitterId, submittedAt) {
        const eq = await tx.equipe.updateMany({
            where: { id: equipeId, submittedAt: null },
            data: {
                githubUrl,
                antiCheatScore,
                submittedAt,
            },
        });
        if (eq.count === 0) {
            throw new common_1.BadRequestException('Your team has already submitted work for this competition.');
        }
        await tx.competitionParticipant.updateMany({
            where: {
                equipeId,
                competitionId,
                userId: { not: submitterId },
                status: competition_status_enum_1.ParticipantStatus.JOINED,
            },
            data: {
                githubUrl,
                antiCheatScore,
                status: competition_status_enum_1.ParticipantStatus.SUBMITTED,
                submittedAt,
            },
        });
    }
    isValidStatusTransition(currentStatus, newStatus) {
        return (competition_status_enum_1.VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false);
    }
    emitEvent(eventName, data) {
        console.log(`🎯 [EVENT] ${eventName}:`, JSON.stringify(data));
    }
    censorPreHackathonDetails(competition, userRole, userId) {
        if (!competition)
            return competition;
        if (competition.status === competition_status_enum_1.CompetitionStatus.SCHEDULED ||
            competition.status === competition_status_enum_1.CompetitionStatus.OPEN_FOR_ENTRY) {
            if (userRole === client_1.UserRole.ADMIN ||
                (userId && competition.createdBy === userId)) {
                return competition;
            }
            return {
                ...competition,
                description: "Le sujet détaillé et le lien du repository github de ce hackathon seront dévoilés publiquement à l'heure exacte du départ. Préparez-vous bien ! ⏳\n\n(Les challenges sont gardés secrets en base de données pour garantir l'équité).",
            };
        }
        return competition;
    }
    async archiveTeamChatChannels(competitionId) {
        const equipes = await this.prisma.equipe.findMany({
            where: { competitionId },
            select: { id: true },
        });
        if (equipes.length === 0)
            return;
        const equipeIds = equipes.map((e) => e.id);
        await this.streamService.archiveTeamChannels(competitionId, equipeIds);
        this.logger.log(`📢 Archived ${equipeIds.length} team chat channels for competition ${competitionId}`);
    }
};
exports.CompetitionService = CompetitionService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionService.prototype, "handleCompetitionStatusUpdates", null);
exports.CompetitionService = CompetitionService = CompetitionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => equipe_service_1.EquipeService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        anti_cheat_service_1.AntiCheatService,
        scoring_dispatcher_service_1.ScoringDispatcherService,
        wallet_service_1.WalletService,
        stream_service_1.StreamService,
        orchestrator_agent_1.OrchestratorAgent,
        equipe_service_1.EquipeService])
], CompetitionService);
//# sourceMappingURL=competition.service.js.map