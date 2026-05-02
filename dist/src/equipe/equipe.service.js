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
var EquipeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stream_service_1 = require("../stream/stream.service");
const client_1 = require("@prisma/client");
const groq_ai_service_1 = require("../agents/groq-ai.service");
const MIN_TEAM_MEMBERS = 4;
const MAX_TEAM_MEMBERS = 6;
let EquipeService = EquipeService_1 = class EquipeService {
    prisma;
    streamService;
    groqAiService;
    logger = new common_1.Logger(EquipeService_1.name);
    constructor(prisma, streamService, groqAiService) {
        this.prisma = prisma;
        this.streamService = streamService;
        this.groqAiService = groqAiService;
    }
    async createEquipe(dto, userId) {
        const competition = await this.prisma.competition.findUnique({
            where: { id: dto.competitionId },
        });
        if (!competition) {
            throw new common_1.NotFoundException('Competition not found');
        }
        if (competition.status !== client_1.CompetitionStatus.OPEN_FOR_ENTRY &&
            competition.status !== client_1.CompetitionStatus.RUNNING) {
            throw new common_1.BadRequestException('Competition is not open for registration');
        }
        const existingMembership = await this.prisma.equipeMember.findFirst({
            where: {
                userId,
                equipe: { competitionId: dto.competitionId },
            },
        });
        if (existingMembership) {
            throw new common_1.ConflictException('You are already in a team for this competition');
        }
        const existingParticipation = await this.prisma.competitionParticipant.findUnique({
            where: {
                competitionId_userId: {
                    competitionId: dto.competitionId,
                    userId,
                },
            },
        });
        if (existingParticipation) {
            throw new common_1.ConflictException('You are already registered in this competition. Leave solo queue first.');
        }
        const equipe = await this.prisma.$transaction(async (tx) => {
            const newEquipe = await tx.equipe.create({
                data: {
                    name: dto.name,
                    competitionId: dto.competitionId,
                    status: client_1.EquipeStatus.FORMING,
                },
            });
            await tx.equipeMember.create({
                data: {
                    equipeId: newEquipe.id,
                    userId,
                    role: client_1.EquipeMemberRole.LEADER,
                },
            });
            const participant = await tx.competitionParticipant.create({
                data: {
                    competitionId: dto.competitionId,
                    userId,
                    equipeId: newEquipe.id,
                    status: client_1.ParticipantStatus.JOINED,
                    hackathonFaceUrl: '/uploads/hackathon-faces/default.png',
                },
            });
            const checkpoints = await tx.competitionCheckpoint.findMany({
                where: { competitionId: dto.competitionId },
                select: { id: true },
                orderBy: { order: 'asc' },
            });
            if (checkpoints.length > 0) {
                await tx.checkpointSubmission.createMany({
                    data: checkpoints.map((cp) => ({
                        checkpointId: cp.id,
                        participantId: participant.id,
                        status: client_1.CheckpointStatus.PENDING,
                    })),
                });
            }
            await tx.user.update({
                where: { id: userId },
                data: { totalChallenges: { increment: 1 } },
            });
            return newEquipe;
        });
        void this.streamService
            .createTeamChannel(equipe.id, dto.competitionId, dto.name, [userId])
            .catch((err) => this.logger.warn(`Failed to create team chat channel for equipe ${equipe.id}: ${err?.message ?? err}`));
        return this.getEquipeById(equipe.id);
    }
    async getEquipeById(equipeId) {
        const equipe = await this.prisma.equipe.findUnique({
            where: { id: equipeId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatarUrl: true,
                                mainSpecialty: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                invitations: {
                    where: { status: client_1.EquipeInvitationStatus.PENDING },
                    include: {
                        invitee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
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
        if (!equipe) {
            throw new common_1.NotFoundException('Equipe not found');
        }
        return equipe;
    }
    async getMyEquipe(competitionId, userId) {
        const membership = await this.prisma.equipeMember.findFirst({
            where: {
                userId,
                equipe: { competitionId },
            },
            include: {
                equipe: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        avatarUrl: true,
                                        mainSpecialty: true,
                                    },
                                },
                            },
                            orderBy: { joinedAt: 'asc' },
                        },
                        invitations: {
                            where: { status: client_1.EquipeInvitationStatus.PENDING },
                            include: {
                                invitee: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                        competition: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                specialty: true,
                            },
                        },
                    },
                },
            },
        });
        if (!membership) {
            return null;
        }
        return {
            ...membership.equipe,
            myRole: membership.role,
        };
    }
    async getCompetitionEquipes(competitionId) {
        const equipes = await this.prisma.equipe.findMany({
            where: { competitionId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                                mainSpecialty: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        return { competitionId, equipes, total: equipes.length };
    }
    async inviteToEquipe(equipeId, dto, inviterId) {
        const equipe = await this.prisma.equipe.findUnique({
            where: { id: equipeId },
            include: {
                members: true,
                competition: { select: { id: true, status: true, title: true } },
            },
        });
        if (!equipe) {
            throw new common_1.NotFoundException('Equipe not found');
        }
        const leaderMember = equipe.members.find((m) => m.userId === inviterId && m.role === client_1.EquipeMemberRole.LEADER);
        if (!leaderMember) {
            throw new common_1.ForbiddenException('Only the team leader can send invitations');
        }
        if (equipe.members.length >= MAX_TEAM_MEMBERS) {
            throw new common_1.BadRequestException(`Team is already full (${MAX_TEAM_MEMBERS}/${MAX_TEAM_MEMBERS} members)`);
        }
        const invitee = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true, firstName: true, lastName: true, role: true },
        });
        if (!invitee) {
            throw new common_1.NotFoundException('User not found with this email');
        }
        if (invitee.role !== client_1.UserRole.USER) {
            throw new common_1.BadRequestException('Only users with role USER can be invited');
        }
        if (invitee.id === inviterId) {
            throw new common_1.BadRequestException('You cannot invite yourself');
        }
        const existingMembership = await this.prisma.equipeMember.findFirst({
            where: {
                userId: invitee.id,
                equipe: { competitionId: equipe.competitionId },
            },
        });
        if (existingMembership) {
            throw new common_1.ConflictException('This user is already in a team for this competition');
        }
        const existingInvite = await this.prisma.equipeInvitation.findUnique({
            where: {
                equipeId_inviteeId: { equipeId, inviteeId: invitee.id },
            },
        });
        if (existingInvite && existingInvite.status === client_1.EquipeInvitationStatus.PENDING) {
            throw new common_1.ConflictException('An invitation is already pending for this user');
        }
        const invitation = existingInvite
            ? await this.prisma.equipeInvitation.update({
                where: { id: existingInvite.id },
                data: { status: client_1.EquipeInvitationStatus.PENDING },
            })
            : await this.prisma.equipeInvitation.create({
                data: {
                    equipeId,
                    inviterId,
                    inviteeId: invitee.id,
                    status: client_1.EquipeInvitationStatus.PENDING,
                },
            });
        await this.prisma.notification.create({
            data: {
                userId: invitee.id,
                type: 'EQUIPE_INVITATION',
                title: `Invitation à rejoindre l'équipe "${equipe.name}"`,
                body: `Vous avez été invité(e) à rejoindre l'équipe "${equipe.name}" pour le hackathon "${equipe.competition.title}".`,
                competitionId: equipe.competitionId,
            },
        });
        return {
            message: `Invitation sent to ${invitee.firstName} ${invitee.lastName}`,
            invitation,
        };
    }
    async acceptInvitation(invitationId, userId) {
        const invitation = await this.prisma.equipeInvitation.findUnique({
            where: { id: invitationId },
            include: {
                equipe: {
                    include: {
                        members: true,
                        competition: { select: { id: true, status: true } },
                    },
                },
            },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.inviteeId !== userId) {
            throw new common_1.ForbiddenException('This invitation is not for you');
        }
        if (invitation.status !== client_1.EquipeInvitationStatus.PENDING) {
            throw new common_1.BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
        }
        const equipe = invitation.equipe;
        if (equipe.members.length >= MAX_TEAM_MEMBERS) {
            await this.prisma.equipeInvitation.update({
                where: { id: invitationId },
                data: { status: client_1.EquipeInvitationStatus.EXPIRED },
            });
            throw new common_1.BadRequestException(`Team is already full (${MAX_TEAM_MEMBERS}/${MAX_TEAM_MEMBERS} members)`);
        }
        const existingMembership = await this.prisma.equipeMember.findFirst({
            where: {
                userId,
                equipe: { competitionId: equipe.competitionId },
            },
        });
        if (existingMembership) {
            throw new common_1.ConflictException('You are already in a team for this competition');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.equipeInvitation.update({
                where: { id: invitationId },
                data: { status: client_1.EquipeInvitationStatus.ACCEPTED },
            });
            await tx.equipeMember.create({
                data: {
                    equipeId: equipe.id,
                    userId,
                    role: client_1.EquipeMemberRole.MEMBER,
                },
            });
            const existingParticipant = await tx.competitionParticipant.findUnique({
                where: {
                    competitionId_userId: {
                        competitionId: equipe.competitionId,
                        userId,
                    },
                },
            });
            const participant = await tx.competitionParticipant.upsert({
                where: {
                    competitionId_userId: {
                        competitionId: equipe.competitionId,
                        userId,
                    },
                },
                update: {
                    equipeId: equipe.id,
                    status: client_1.ParticipantStatus.JOINED,
                },
                create: {
                    competitionId: equipe.competitionId,
                    userId,
                    equipeId: equipe.id,
                    status: client_1.ParticipantStatus.JOINED,
                    hackathonFaceUrl: '/uploads/hackathon-faces/default.png',
                },
            });
            if (!existingParticipant) {
                const checkpoints = await tx.competitionCheckpoint.findMany({
                    where: { competitionId: equipe.competitionId },
                    select: { id: true },
                    orderBy: { order: 'asc' },
                });
                if (checkpoints.length > 0) {
                    await tx.checkpointSubmission.createMany({
                        data: checkpoints.map((cp) => ({
                            checkpointId: cp.id,
                            participantId: participant.id,
                            status: client_1.CheckpointStatus.PENDING,
                        })),
                    });
                }
                await tx.user.update({
                    where: { id: userId },
                    data: { totalChallenges: { increment: 1 } },
                });
            }
            const newMemberCount = equipe.members.length + 1;
            if (newMemberCount >= MAX_TEAM_MEMBERS) {
                await tx.equipeInvitation.updateMany({
                    where: {
                        equipeId: equipe.id,
                        status: client_1.EquipeInvitationStatus.PENDING,
                    },
                    data: { status: client_1.EquipeInvitationStatus.EXPIRED },
                });
            }
        });
        void this.streamService
            .ensureTeamMember(equipe.id, equipe.competitionId, userId)
            .catch((err) => this.logger.warn(`Failed to add member to team chat channel for equipe ${equipe.id}: ${err?.message ?? err}`));
        return this.getEquipeById(equipe.id);
    }
    async declineInvitation(invitationId, userId) {
        const invitation = await this.prisma.equipeInvitation.findUnique({
            where: { id: invitationId },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        if (invitation.inviteeId !== userId) {
            throw new common_1.ForbiddenException('This invitation is not for you');
        }
        if (invitation.status !== client_1.EquipeInvitationStatus.PENDING) {
            throw new common_1.BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
        }
        await this.prisma.equipeInvitation.update({
            where: { id: invitationId },
            data: { status: client_1.EquipeInvitationStatus.DECLINED },
        });
        return { message: 'Invitation declined' };
    }
    async removeMember(equipeId, memberUserId, requesterId) {
        const equipe = await this.prisma.equipe.findUnique({
            where: { id: equipeId },
            include: {
                members: true,
            },
        });
        if (!equipe) {
            throw new common_1.NotFoundException('Equipe not found');
        }
        const isLeader = equipe.members.some((m) => m.userId === requesterId && m.role === client_1.EquipeMemberRole.LEADER);
        if (!isLeader) {
            throw new common_1.ForbiddenException('Only the team leader can remove members');
        }
        if (requesterId === memberUserId) {
            throw new common_1.BadRequestException('You cannot remove yourself. Use leave team instead.');
        }
        const memberToRemove = equipe.members.find((m) => m.userId === memberUserId);
        if (!memberToRemove) {
            throw new common_1.NotFoundException('User is not a member of this team');
        }
        await this.prisma.$transaction(async (prisma) => {
            await prisma.equipeMember.delete({
                where: { id: memberToRemove.id },
            });
            await prisma.competitionParticipant.updateMany({
                where: {
                    userId: memberUserId,
                    competitionId: equipe.competitionId,
                },
                data: {
                    equipeId: null,
                },
            });
            if (equipe.status === 'READY' && equipe.members.length - 1 < 4) {
                await prisma.equipe.update({
                    where: { id: equipeId },
                    data: { status: client_1.EquipeStatus.FORMING },
                });
            }
        });
        return { message: 'Member successfully removed from the team' };
    }
    async markGroupReady(equipeId, userId) {
        const equipe = await this.prisma.equipe.findUnique({
            where: { id: equipeId },
            include: {
                members: true,
                competition: { select: { id: true, status: true } },
            },
        });
        if (!equipe) {
            throw new common_1.NotFoundException('Equipe not found');
        }
        const isLeader = equipe.members.some((m) => m.userId === userId && m.role === client_1.EquipeMemberRole.LEADER);
        if (!isLeader) {
            throw new common_1.ForbiddenException('Only the team leader can mark the group as ready');
        }
        if (equipe.status === client_1.EquipeStatus.READY) {
            return this.getEquipeById(equipeId);
        }
        if (equipe.status !== client_1.EquipeStatus.FORMING) {
            throw new common_1.BadRequestException('Group can only be finalized from FORMING status');
        }
        const n = equipe.members.length;
        if (n < MIN_TEAM_MEMBERS || n > MAX_TEAM_MEMBERS) {
            throw new common_1.BadRequestException(`Team must have between ${MIN_TEAM_MEMBERS} and ${MAX_TEAM_MEMBERS} members to be marked ready (currently ${n}).`);
        }
        if (equipe.competition.status !== client_1.CompetitionStatus.OPEN_FOR_ENTRY &&
            equipe.competition.status !== client_1.CompetitionStatus.RUNNING) {
            throw new common_1.BadRequestException('Competition is not open; cannot finalize team roster');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.equipe.update({
                where: { id: equipeId },
                data: { status: client_1.EquipeStatus.READY },
            });
            await tx.equipeInvitation.updateMany({
                where: {
                    equipeId,
                    status: client_1.EquipeInvitationStatus.PENDING,
                },
                data: { status: client_1.EquipeInvitationStatus.EXPIRED },
            });
        });
        return this.getEquipeById(equipeId);
    }
    async getMyInvitations(userId) {
        const invitations = await this.prisma.equipeInvitation.findMany({
            where: {
                inviteeId: userId,
                status: client_1.EquipeInvitationStatus.PENDING,
            },
            include: {
                equipe: {
                    include: {
                        competition: {
                            select: { id: true, title: true, status: true, specialty: true },
                        },
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                        _count: { select: { members: true } },
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { invitations, total: invitations.length };
    }
    async joinSolo(competitionId, userId) {
        const competition = await this.prisma.competition.findUnique({
            where: { id: competitionId },
        });
        if (!competition) {
            throw new common_1.NotFoundException('Competition not found');
        }
        if (competition.status !== client_1.CompetitionStatus.OPEN_FOR_ENTRY &&
            competition.status !== client_1.CompetitionStatus.RUNNING) {
            throw new common_1.BadRequestException('Competition is not open for registration');
        }
        const existingMembership = await this.prisma.equipeMember.findFirst({
            where: {
                userId,
                equipe: { competitionId },
            },
        });
        if (existingMembership) {
            throw new common_1.ConflictException('You are already in a team for this competition');
        }
        const existingParticipation = await this.prisma.competitionParticipant.findUnique({
            where: { competitionId_userId: { competitionId, userId } },
        });
        if (existingParticipation) {
            throw new common_1.ConflictException('You are already registered in this competition');
        }
        if (competition.maxParticipants !== null) {
            const currentCount = await this.prisma.competitionParticipant.count({
                where: { competitionId, status: client_1.ParticipantStatus.JOINED },
            });
            if (currentCount >= competition.maxParticipants) {
                throw new common_1.BadRequestException('This competition has reached its maximum participant limit');
            }
        }
        const participant = await this.prisma.$transaction(async (tx) => {
            const p = await tx.competitionParticipant.create({
                data: {
                    competitionId,
                    userId,
                    equipeId: null,
                    status: client_1.ParticipantStatus.JOINED,
                    hackathonFaceUrl: '/uploads/hackathon-faces/default.png',
                },
            });
            const checkpoints = await tx.competitionCheckpoint.findMany({
                where: { competitionId },
                select: { id: true },
                orderBy: { order: 'asc' },
            });
            if (checkpoints.length > 0) {
                await tx.checkpointSubmission.createMany({
                    data: checkpoints.map((cp) => ({
                        checkpointId: cp.id,
                        participantId: p.id,
                        status: client_1.CheckpointStatus.PENDING,
                    })),
                });
            }
            await tx.user.update({
                where: { id: userId },
                data: { totalChallenges: { increment: 1 } },
            });
            return p;
        });
        return {
            message: "Vous avez rejoint la file d'attente solo. Vous serez automatiquement assigné à une équipe.",
            participant,
        };
    }
    async autoAssignSoloUsers(competitionId) {
        const competition = await this.prisma.competition.findUnique({
            where: { id: competitionId },
            select: { id: true, title: true, status: true },
        });
        if (!competition) {
            throw new common_1.NotFoundException('Competition not found');
        }
        const soloParticipants = await this.prisma.competitionParticipant.findMany({
            where: {
                competitionId,
                equipeId: null,
                status: client_1.ParticipantStatus.JOINED,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (soloParticipants.length === 0) {
            return { message: 'No solo participants to assign', teamsCreated: 0 };
        }
        const shuffled = [...soloParticipants].sort(() => Math.random() - 0.5);
        const teamsCreated = [];
        for (let i = 0; i < shuffled.length; i += MAX_TEAM_MEMBERS) {
            const chunk = shuffled.slice(i, i + MAX_TEAM_MEMBERS);
            const leaderIndex = Math.floor(Math.random() * chunk.length);
            const equipe = await this.prisma.$transaction(async (tx) => {
                const teamNumber = Math.floor(i / MAX_TEAM_MEMBERS) + 1;
                const newEquipe = await tx.equipe.create({
                    data: {
                        name: `Équipe Auto #${teamNumber}`,
                        competitionId,
                        status: chunk.length >= MIN_TEAM_MEMBERS &&
                            chunk.length <= MAX_TEAM_MEMBERS
                            ? client_1.EquipeStatus.READY
                            : client_1.EquipeStatus.FORMING,
                        isAutoFormed: true,
                    },
                });
                for (let j = 0; j < chunk.length; j++) {
                    const participant = chunk[j];
                    const role = j === leaderIndex
                        ? client_1.EquipeMemberRole.LEADER
                        : client_1.EquipeMemberRole.MEMBER;
                    await tx.equipeMember.create({
                        data: {
                            equipeId: newEquipe.id,
                            userId: participant.userId,
                            role,
                        },
                    });
                    await tx.competitionParticipant.update({
                        where: { id: participant.id },
                        data: { equipeId: newEquipe.id },
                    });
                }
                return newEquipe;
            });
            teamsCreated.push(equipe.id);
            const memberUserIds = chunk.map((p) => p.userId);
            void this.streamService
                .createTeamChannel(equipe.id, competitionId, equipe.name, memberUserIds)
                .catch((err) => this.logger.warn(`Failed to create team chat for auto-assigned equipe ${equipe.id}: ${err?.message ?? err}`));
            for (const participant of chunk) {
                await this.prisma.notification.create({
                    data: {
                        userId: participant.userId,
                        type: 'EQUIPE_AUTO_ASSIGNED',
                        title: `Vous avez été assigné à une équipe`,
                        body: `Vous avez été automatiquement assigné à une équipe pour le hackathon "${competition.title}".`,
                        competitionId,
                    },
                });
            }
        }
        this.logger.log(`Auto-assigned ${shuffled.length} solo users into ${teamsCreated.length} teams for competition ${competitionId}`);
        return {
            message: `${teamsCreated.length} teams created from ${shuffled.length} solo participants`,
            teamsCreated: teamsCreated.length,
            teamIds: teamsCreated,
        };
    }
    async searchUsers(query, competitionId) {
        const where = {
            role: client_1.UserRole.USER,
            isBanned: false,
            OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
        };
        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                mainSpecialty: true,
            },
            take: 10,
        });
        if (competitionId) {
            const teamedUserIds = await this.prisma.equipeMember.findMany({
                where: { equipe: { competitionId } },
                select: { userId: true },
            });
            const teamedSet = new Set(teamedUserIds.map((m) => m.userId));
            const soloParticipantIds = await this.prisma.competitionParticipant.findMany({
                where: { competitionId, equipeId: null },
                select: { userId: true },
            });
            const soloSet = new Set(soloParticipantIds.map((p) => p.userId));
            return users.map((u) => ({
                ...u,
                alreadyInTeam: teamedSet.has(u.id),
                inSoloQueue: soloSet.has(u.id),
            }));
        }
        return users;
    }
    SYNERGY_AXES = [
        'Frontend',
        'Backend',
        'AI / Data',
        'Mobile',
        'DevOps',
        'Design',
    ];
    SPECIALTY_TO_AXIS = {
        FRONTEND: { Frontend: 40 },
        BACKEND: { Backend: 40 },
        FULLSTACK: { Frontend: 25, Backend: 25 },
        MOBILE: { Mobile: 40 },
        DATA: { 'AI / Data': 40 },
        BI: { 'AI / Data': 30, Backend: 10 },
        CYBERSECURITY: { Backend: 20, DevOps: 20 },
        DESIGN: { Design: 40 },
        DEVOPS: { DevOps: 40 },
    };
    TAG_TO_AXIS = {
        react: { Frontend: 10 },
        angular: { Frontend: 10 },
        vue: { Frontend: 10 },
        tailwindcss: { Frontend: 8, Design: 5 },
        html: { Frontend: 5 },
        css: { Frontend: 5 },
        nextjs: { Frontend: 8, Backend: 5 },
        nodejs: { Backend: 10 },
        nestjs: { Backend: 10 },
        express: { Backend: 8 },
        django: { Backend: 10 },
        spring: { Backend: 10 },
        mongodb: { Backend: 8 },
        postgresql: { Backend: 8 },
        sql: { Backend: 5 },
        prisma: { Backend: 8 },
        graphql: { Backend: 8 },
        python: { 'AI / Data': 8 },
        tensorflow: { 'AI / Data': 12 },
        pytorch: { 'AI / Data': 12 },
        'machine learning': { 'AI / Data': 12 },
        ml: { 'AI / Data': 10 },
        ai: { 'AI / Data': 10 },
        'deep learning': { 'AI / Data': 12 },
        pandas: { 'AI / Data': 8 },
        numpy: { 'AI / Data': 6 },
        jupyter: { 'AI / Data': 8 },
        opencv: { 'AI / Data': 10 },
        flutter: { Mobile: 12, Frontend: 5 },
        dart: { Mobile: 10 },
        'react native': { Mobile: 12, Frontend: 5 },
        swift: { Mobile: 10 },
        kotlin: { Mobile: 10 },
        android: { Mobile: 10 },
        ios: { Mobile: 10 },
        docker: { DevOps: 12 },
        kubernetes: { DevOps: 12 },
        ci: { DevOps: 8 },
        cd: { DevOps: 8 },
        aws: { DevOps: 10 },
        gcp: { DevOps: 10 },
        azure: { DevOps: 10 },
        linux: { DevOps: 8 },
        terraform: { DevOps: 10 },
        jenkins: { DevOps: 8 },
        github: { DevOps: 5 },
        figma: { Design: 12 },
        'ui/ux': { Design: 12, Frontend: 5 },
        photoshop: { Design: 10 },
        illustrator: { Design: 8 },
        canva: { Design: 5 },
        sketch: { Design: 10 },
    };
    LANG_TO_AXIS = {
        typescript: { Backend: 8, Frontend: 5 },
        javascript: { Frontend: 8, Backend: 5 },
        python: { 'AI / Data': 10 },
        java: { Backend: 8, Mobile: 5 },
        kotlin: { Mobile: 10 },
        swift: { Mobile: 10 },
        dart: { Mobile: 10 },
        go: { Backend: 8, DevOps: 5 },
        rust: { Backend: 8 },
        c: { Backend: 5 },
        'c++': { Backend: 5 },
        html: { Frontend: 5 },
        css: { Frontend: 5, Design: 3 },
        dockerfile: { DevOps: 12 },
        shell: { DevOps: 8 },
        hcl: { DevOps: 10 },
    };
    async getTeamSynergy(equipeId) {
        const equipe = await this.prisma.equipe.findUnique({
            where: { id: equipeId },
            include: {
                competition: { select: { title: true, specialty: true, description: true } },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                mainSpecialty: true,
                                skillTags: true,
                                githubRepos: true,
                                githubUrl: true,
                            },
                        },
                    },
                },
            },
        });
        if (!equipe) {
            throw new common_1.NotFoundException('Equipe not found');
        }
        const rawScores = {};
        for (const axis of this.SYNERGY_AXES) {
            rawScores[axis] = 0;
        }
        const memberAnalysis = [];
        for (const member of equipe.members) {
            const user = member.user;
            const contributions = {};
            if (user.mainSpecialty) {
                const mapping = this.SPECIALTY_TO_AXIS[user.mainSpecialty];
                if (mapping) {
                    for (const [axis, pts] of Object.entries(mapping)) {
                        rawScores[axis] = (rawScores[axis] || 0) + pts;
                        contributions[axis] = (contributions[axis] || 0) + pts;
                    }
                }
            }
            if (user.skillTags && Array.isArray(user.skillTags)) {
                for (const tag of user.skillTags) {
                    const normalised = tag.toLowerCase().trim();
                    const mapping = this.TAG_TO_AXIS[normalised];
                    if (mapping) {
                        for (const [axis, pts] of Object.entries(mapping)) {
                            rawScores[axis] = (rawScores[axis] || 0) + pts;
                            contributions[axis] = (contributions[axis] || 0) + pts;
                        }
                    }
                }
            }
            if (user.githubRepos && Array.isArray(user.githubRepos)) {
                const seenLangs = new Set();
                for (const repo of user.githubRepos) {
                    const lang = (repo?.language ||
                        repo?.primaryLanguage?.name ||
                        '')
                        .toLowerCase()
                        .trim();
                    if (lang && !seenLangs.has(lang)) {
                        seenLangs.add(lang);
                        const mapping = this.LANG_TO_AXIS[lang];
                        if (mapping) {
                            for (const [axis, pts] of Object.entries(mapping)) {
                                rawScores[axis] = (rawScores[axis] || 0) + pts;
                                contributions[axis] = (contributions[axis] || 0) + pts;
                            }
                        }
                    }
                }
            }
            memberAnalysis.push({
                name: `${user.firstName} ${user.lastName}`.trim(),
                specialty: user.mainSpecialty,
                contributions,
            });
        }
        const maxPossible = Math.max(...Object.values(rawScores), 1);
        const scores = {};
        for (const axis of this.SYNERGY_AXES) {
            scores[axis] = Math.min(100, Math.round((rawScores[axis] / maxPossible) * 100));
        }
        let targetAxis = null;
        if (equipe.competition?.specialty) {
            const mapping = this.SPECIALTY_TO_AXIS[equipe.competition.specialty];
            if (mapping) {
                targetAxis = Object.keys(mapping)[0];
            }
        }
        else if (equipe.competition?.description) {
            const desc = equipe.competition.description.toLowerCase();
            let bestAxis = '';
            let bestScore = 0;
            const descKeywords = {
                'AI / Data': ['ia', 'ai', 'intelligence artificielle', 'data', 'machine learning', 'algorithme', 'python', 'bi', 'business intelligence'],
                'Mobile': ['mobile', 'app', 'application', 'ios', 'android', 'smartphone'],
                'Frontend': ['web', 'frontend', 'interface', 'ui', 'ux', 'site'],
                'Backend': ['backend', 'api', 'serveur', 'base de données', 'database'],
                'DevOps': ['cloud', 'déploiement', 'docker', 'aws', 'infrastructure', 'devops'],
                'Design': ['design', 'maquette', 'figma', 'prototype']
            };
            for (const [axis, words] of Object.entries(descKeywords)) {
                let score = 0;
                for (const word of words) {
                    if (desc.includes(word))
                        score++;
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestAxis = axis;
                }
            }
            if (bestAxis !== '') {
                targetAxis = bestAxis;
            }
        }
        let targetTheme = null;
        const fullText = `${equipe.competition?.title || ''} ${equipe.competition?.description || ''}`.toLowerCase();
        if (fullText.trim().length > 0) {
            const themeKeywords = {
                'Santé & Médical': ['santé', 'médical', 'medical', 'docteur', 'patient', 'hôpital', 'health', 'care', 'maladie', 'soins'],
                'Finance & Fintech': ['finance', 'fintech', 'banque', 'argent', 'paiement', 'crypto', 'blockchain', 'investissement', 'trading'],
                'Environnement & Écologie': ['environnement', 'écologie', 'climat', 'vert', 'énergie', 'green', 'durable', 'recyclage', 'planète', 'nature'],
                'Éducation & EdTech': ['éducation', 'école', 'étudiant', 'apprentissage', 'learn', 'edtech', 'professeur', 'enseignement', 'université'],
                'E-commerce & Retail': ['commerce', 'vente', 'boutique', 'magasin', 'shop', 'ecommerce', 'retail', 'client', 'achat'],
                'Gaming & Divertissement': ['jeu', 'gaming', 'divertissement', 'entertainment', 'play', 'game', 'joueur', 'esport'],
                'Transport & Logistique': ['transport', 'logistique', 'livraison', 'voiture', 'mobilité', 'mobility', 'véhicule', 'trafic']
            };
            let bestTheme = '';
            let bestThemeScore = 0;
            for (const [theme, words] of Object.entries(themeKeywords)) {
                let score = 0;
                for (const word of words) {
                    if (fullText.includes(word))
                        score++;
                }
                if (score > bestThemeScore) {
                    bestThemeScore = score;
                    bestTheme = theme;
                }
            }
            if (bestTheme !== '') {
                targetTheme = bestTheme;
            }
        }
        let synergyScore = 0;
        if (targetAxis) {
            const targetScore = scores[targetAxis] || 0;
            const otherVals = this.SYNERGY_AXES.filter((a) => a !== targetAxis).map((a) => scores[a] || 0);
            const otherAvg = otherVals.reduce((a, b) => a + b, 0) / (otherVals.length || 1);
            synergyScore = Math.round(targetScore * 0.7 + otherAvg * 0.3);
        }
        else {
            const vals = Object.values(scores);
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const stddev = Math.sqrt(vals.reduce((sum, v) => sum + (v - avg) ** 2, 0) / vals.length);
            const balanceBonus = Math.max(0, 100 - stddev * 2);
            synergyScore = Math.round(avg * 0.6 + balanceBonus * 0.4);
        }
        const strengths = this.SYNERGY_AXES.filter((a) => scores[a] >= 60);
        const weaknesses = this.SYNERGY_AXES.filter((a) => scores[a] <= 25).sort((a, b) => scores[a] - scores[b]);
        let advice = '';
        if (this.groqAiService.hasApiKey()) {
            try {
                const systemPrompt = `Tu es "Synergy Agent", une IA experte en recrutement tech pour des hackathons.
Ta mission est d'analyser les scores de compétences (0 à 100%) d'une équipe et de donner un conseil stratégique au Leader en 2 à 3 phrases courtes et percutantes en français.
Le message doit commencer par un emoji représentatif de la force principale ou du thème.
S'il y a un manque critique par rapport au besoin du hackathon, conseille directement quel profil recruter.
Le ton doit être professionnel, encourageant, mais ultra-direct et sans blabla.
Format JSON STRICT attendu: { "advice": "Ton message ici" }`;
                const userPrompt = `
Hackathon Titre: ${equipe.competition?.title || 'Hackathon Général'}
Hackathon Thème inféré: ${targetTheme || 'Général'}
Compétence clé requise par le hackathon: ${targetAxis || 'Aucune spécifiée'}
Scores actuels de l'équipe: ${JSON.stringify(scores)}
Forces principales (>60%): ${strengths.join(', ')}
Faiblesses critiques (<25%): ${weaknesses.slice(0, 2).join(', ')}
`;
                const response = await this.groqAiService.askForJson(systemPrompt, userPrompt);
                advice = response.advice;
            }
            catch (error) {
                this.logger.error('Failed to generate synergy advice with Groq', error);
            }
        }
        if (!advice) {
            if (targetTheme) {
                advice += `🌍 Le thème de ce hackathon semble s'orienter vers **${targetTheme}**. `;
            }
            if (targetAxis) {
                advice += `🎯 Ce défi cible principalement des compétences en **${targetAxis}**. `;
                if (scores[targetAxis] >= 60) {
                    advice += `Votre équipe est très bien préparée sur ce point clé ! `;
                }
                else {
                    advice += `⚠️ **Attention :** Votre équipe manque de compétences en ${targetAxis} (${scores[targetAxis]}%), ce qui est crucial pour gagner ! `;
                    const typedTargetAxis = targetAxis;
                    if (!weaknesses.includes(typedTargetAxis)) {
                        weaknesses.unshift(typedTargetAxis);
                    }
                }
            }
            if (strengths.length > 0) {
                const topStrengths = strengths.slice(0, 2);
                const strengthStr = topStrengths.map((a) => `${a} (${scores[a]}%)`).join(' et ');
                advice += `🚀 Votre force de frappe réside dans le ${strengthStr}. `;
            }
            const otherWeaknesses = weaknesses.filter((w) => w !== targetAxis).slice(0, targetAxis ? 1 : 2);
            if (otherWeaknesses.length > 0) {
                const weakStr = otherWeaknesses.map((a) => a).join(' et ');
                advice += `Pour construire un projet complet, il serait judicieux de recruter un profil axé **${weakStr}**.`;
            }
            if (strengths.length === 0 && weaknesses.length === 0 && !targetAxis && !targetTheme) {
                advice +=
                    '📊 Votre équipe a un profil équilibré. Continuez à renforcer vos compétences pour atteindre l\'excellence !';
            }
            if (weaknesses.length === 0 &&
                strengths.length >= 4) {
                advice +=
                    '🏆 Votre équipe est exceptionnellement bien équilibrée ! Vous avez toutes les cartes en main pour dominer ce hackathon.';
            }
        }
        return {
            equipeId: equipe.id,
            equipeName: equipe.name,
            memberCount: equipe.members.length,
            synergyScore,
            axes: this.SYNERGY_AXES.map((axis) => ({
                name: axis,
                score: scores[axis],
            })),
            strengths: strengths.map((a) => ({
                name: a,
                score: scores[a],
            })),
            weaknesses: weaknesses.map((a) => ({
                name: a,
                score: scores[a],
            })),
            advice,
            targetTheme,
            targetAxis,
            memberAnalysis,
        };
    }
};
exports.EquipeService = EquipeService;
exports.EquipeService = EquipeService = EquipeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stream_service_1.StreamService,
        groq_ai_service_1.GroqAiService])
], EquipeService);
//# sourceMappingURL=equipe.service.js.map