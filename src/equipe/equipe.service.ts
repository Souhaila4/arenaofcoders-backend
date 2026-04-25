import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StreamService } from '../stream/stream.service';
import {
  EquipeStatus,
  EquipeMemberRole,
  EquipeInvitationStatus,
  CompetitionStatus,
  ParticipantStatus,
  UserRole,
  CheckpointStatus,
} from '@prisma/client';
import { CreateEquipeDto, InviteToEquipeDto } from './equipe.dto';
import { GroqAiService } from '../agents/groq-ai.service';

/** Taille d'équipe (leader inclus) : min/max pour valider le groupe. */
const MIN_TEAM_MEMBERS = 4;
const MAX_TEAM_MEMBERS = 6;

@Injectable()
export class EquipeService {
  private readonly logger = new Logger(EquipeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly streamService: StreamService,
    private readonly groqAiService: GroqAiService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // CREATE EQUIPE
  // ─────────────────────────────────────────────────────────────────

  async createEquipe(dto: CreateEquipeDto, userId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: dto.competitionId },
    });
    if (!competition) {
      throw new NotFoundException('Competition not found');
    }
    if (
      competition.status !== CompetitionStatus.OPEN_FOR_ENTRY &&
      competition.status !== CompetitionStatus.RUNNING
    ) {
      throw new BadRequestException(
        'Competition is not open for registration',
      );
    }

    // Check user is not already in a team for this competition
    const existingMembership = await this.prisma.equipeMember.findFirst({
      where: {
        userId,
        equipe: { competitionId: dto.competitionId },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'You are already in a team for this competition',
      );
    }

    // Check user is not already a solo participant
    const existingParticipation =
      await this.prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: {
            competitionId: dto.competitionId,
            userId,
          },
        },
      });
    if (existingParticipation) {
      throw new ConflictException(
        'You are already registered in this competition. Leave solo queue first.',
      );
    }

    // Create equipe + leader membership + competition participant in a transaction
    const equipe = await this.prisma.$transaction(async (tx) => {
      const newEquipe = await tx.equipe.create({
        data: {
          name: dto.name,
          competitionId: dto.competitionId,
          status: EquipeStatus.FORMING,
        },
      });

      await tx.equipeMember.create({
        data: {
          equipeId: newEquipe.id,
          userId,
          role: EquipeMemberRole.LEADER,
        },
      });

      // Create competition participant for the leader
      const participant = await tx.competitionParticipant.create({
        data: {
          competitionId: dto.competitionId,
          userId,
          equipeId: newEquipe.id,
          status: ParticipantStatus.JOINED,
          hackathonFaceUrl: '/uploads/hackathon-faces/default.png',
        },
      });

      // Create checkpoint submissions for the participant
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
            status: CheckpointStatus.PENDING,
          })),
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { totalChallenges: { increment: 1 } },
      });

      return newEquipe;
    });

    // Créer le canal de chat privé pour l'équipe
    void this.streamService
      .createTeamChannel(equipe.id, dto.competitionId, dto.name, [userId])
      .catch((err) =>
        this.logger.warn(
          `Failed to create team chat channel for equipe ${equipe.id}: ${err?.message ?? err}`,
        ),
      );

    return this.getEquipeById(equipe.id);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET EQUIPE
  // ─────────────────────────────────────────────────────────────────

  async getEquipeById(equipeId: string) {
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
          where: { status: EquipeInvitationStatus.PENDING },
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
      throw new NotFoundException('Equipe not found');
    }

    return equipe;
  }

  async getMyEquipe(competitionId: string, userId: string) {
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
              where: { status: EquipeInvitationStatus.PENDING },
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

  async getCompetitionEquipes(competitionId: string) {
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

  // ─────────────────────────────────────────────────────────────────
  // INVITE
  // ─────────────────────────────────────────────────────────────────

  async inviteToEquipe(equipeId: string, dto: InviteToEquipeDto, inviterId: string) {
    const equipe = await this.prisma.equipe.findUnique({
      where: { id: equipeId },
      include: {
        members: true,
        competition: { select: { id: true, status: true, title: true } },
      },
    });

    if (!equipe) {
      throw new NotFoundException('Equipe not found');
    }

    // Only leader can invite
    const leaderMember = equipe.members.find(
      (m) => m.userId === inviterId && m.role === EquipeMemberRole.LEADER,
    );
    if (!leaderMember) {
      throw new ForbiddenException('Only the team leader can send invitations');
    }

    if (equipe.members.length >= MAX_TEAM_MEMBERS) {
      throw new BadRequestException(
        `Team is already full (${MAX_TEAM_MEMBERS}/${MAX_TEAM_MEMBERS} members)`,
      );
    }

    // Find invitee by email
    const invitee = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    if (!invitee) {
      throw new NotFoundException('User not found with this email');
    }
    if (invitee.role !== UserRole.USER) {
      throw new BadRequestException('Only users with role USER can be invited');
    }
    if (invitee.id === inviterId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check invitee is not already in a team for this competition
    const existingMembership = await this.prisma.equipeMember.findFirst({
      where: {
        userId: invitee.id,
        equipe: { competitionId: equipe.competitionId },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'This user is already in a team for this competition',
      );
    }

    // We DO NOT block if existingParticipation && !existingParticipation.equipeId
    // Solo participants CAN be invited to a team.

    // Check no pending invitation already exists
    const existingInvite = await this.prisma.equipeInvitation.findUnique({
      where: {
        equipeId_inviteeId: { equipeId, inviteeId: invitee.id },
      },
    });
    if (existingInvite && existingInvite.status === EquipeInvitationStatus.PENDING) {
      throw new ConflictException('An invitation is already pending for this user');
    }

    // Create or update invitation
    const invitation = existingInvite
      ? await this.prisma.equipeInvitation.update({
          where: { id: existingInvite.id },
          data: { status: EquipeInvitationStatus.PENDING },
        })
      : await this.prisma.equipeInvitation.create({
          data: {
            equipeId,
            inviterId,
            inviteeId: invitee.id,
            status: EquipeInvitationStatus.PENDING,
          },
        });

    // Create a notification for the invitee
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

  // ─────────────────────────────────────────────────────────────────
  // ACCEPT / DECLINE INVITATION
  // ─────────────────────────────────────────────────────────────────

  async acceptInvitation(invitationId: string, userId: string) {
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
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }
    if (invitation.status !== EquipeInvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is already ${invitation.status.toLowerCase()}`,
      );
    }

    const equipe = invitation.equipe;

    if (equipe.members.length >= MAX_TEAM_MEMBERS) {
      // Auto-decline since team is full
      await this.prisma.equipeInvitation.update({
        where: { id: invitationId },
        data: { status: EquipeInvitationStatus.EXPIRED },
      });
      throw new BadRequestException(
        `Team is already full (${MAX_TEAM_MEMBERS}/${MAX_TEAM_MEMBERS} members)`,
      );
    }

    // Check user is not already in another team
    const existingMembership = await this.prisma.equipeMember.findFirst({
      where: {
        userId,
        equipe: { competitionId: equipe.competitionId },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'You are already in a team for this competition',
      );
    }

    // We DO NOT block if existingParticipation && !existingParticipation.equipeId
    // Solo participants CAN accept a team invite.

    // Accept in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.equipeInvitation.update({
        where: { id: invitationId },
        data: { status: EquipeInvitationStatus.ACCEPTED },
      });

      // Add member
      await tx.equipeMember.create({
        data: {
          equipeId: equipe.id,
          userId,
          role: EquipeMemberRole.MEMBER,
        },
      });

      // Handle competition participant (upsert)
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
          status: ParticipantStatus.JOINED,
        },
        create: {
          competitionId: equipe.competitionId,
          userId,
          equipeId: equipe.id,
          status: ParticipantStatus.JOINED,
          hackathonFaceUrl: '/uploads/hackathon-faces/default.png',
        },
      });

      // If it was a new participant (not existing), initialize checkpoints and stats
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
              status: CheckpointStatus.PENDING,
            })),
          });
        }

        await tx.user.update({
          where: { id: userId },
          data: { totalChallenges: { increment: 1 } },
        });
      }

      // At max size: expire pending invites (status READY is set only by leader via markGroupReady)
      const newMemberCount = equipe.members.length + 1;
      if (newMemberCount >= MAX_TEAM_MEMBERS) {
        await tx.equipeInvitation.updateMany({
          where: {
            equipeId: equipe.id,
            status: EquipeInvitationStatus.PENDING,
          },
          data: { status: EquipeInvitationStatus.EXPIRED },
        });
      }
    });

    // Ajouter le nouveau membre au canal de chat de l'équipe
    void this.streamService
      .ensureTeamMember(equipe.id, equipe.competitionId, userId)
      .catch((err) =>
        this.logger.warn(
          `Failed to add member to team chat channel for equipe ${equipe.id}: ${err?.message ?? err}`,
        ),
      );

    return this.getEquipeById(equipe.id);
  }

  async declineInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.equipeInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }
    if (invitation.status !== EquipeInvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is already ${invitation.status.toLowerCase()}`,
      );
    }

    await this.prisma.equipeInvitation.update({
      where: { id: invitationId },
      data: { status: EquipeInvitationStatus.DECLINED },
    });

    return { message: 'Invitation declined' };
  }

  // ─────────────────────────────────────────────────────────────────
  // REMOVE MEMBER (leader only)
  // ─────────────────────────────────────────────────────────────────

  async removeMember(equipeId: string, memberUserId: string, requesterId: string) {
    const equipe = await this.prisma.equipe.findUnique({
      where: { id: equipeId },
      include: {
        members: true,
      },
    });

    if (!equipe) {
      throw new NotFoundException('Equipe not found');
    }

    // Verify requester is the leader
    const isLeader = equipe.members.some(
      (m) => m.userId === requesterId && m.role === EquipeMemberRole.LEADER,
    );
    if (!isLeader) {
      throw new ForbiddenException('Only the team leader can remove members');
    }

    // Prevent leader from removing themselves
    if (requesterId === memberUserId) {
      throw new BadRequestException('You cannot remove yourself. Use leave team instead.');
    }

    // Verify the user to be removed is actually in the team
    const memberToRemove = equipe.members.find((m) => m.userId === memberUserId);
    if (!memberToRemove) {
      throw new NotFoundException('User is not a member of this team');
    }

    // Transaction to safely remove member and reset participant status
    await this.prisma.$transaction(async (prisma) => {
      // 1. Delete EquipeMember record
      await prisma.equipeMember.delete({
        where: { id: memberToRemove.id },
      });

      // 2. Set the participant's equipeId to null (revert to solo)
      await prisma.competitionParticipant.updateMany({
        where: {
          userId: memberUserId,
          competitionId: equipe.competitionId,
        },
        data: {
          equipeId: null,
        },
      });
      
      // 3. If the team was previously MARKED AS READY but now falls below the minimum required members (4),
      // we might want to un-ready them. For now, we leave it as is or change status to PENDING if needed.
      // But standard logic usually requires manual re-validation or we can force it here:
      if (equipe.status === 'READY' && equipe.members.length - 1 < 4) {
        await prisma.equipe.update({
          where: { id: equipeId },
          data: { status: EquipeStatus.FORMING },
        });
      }
    });

    return { message: 'Member successfully removed from the team' };
  }

  // ─────────────────────────────────────────────────────────────────
  // MARK GROUP READY (leader only, 4–6 members)
  // ─────────────────────────────────────────────────────────────────

  async markGroupReady(equipeId: string, userId: string) {
    const equipe = await this.prisma.equipe.findUnique({
      where: { id: equipeId },
      include: {
        members: true,
        competition: { select: { id: true, status: true } },
      },
    });

    if (!equipe) {
      throw new NotFoundException('Equipe not found');
    }

    const isLeader = equipe.members.some(
      (m) => m.userId === userId && m.role === EquipeMemberRole.LEADER,
    );
    if (!isLeader) {
      throw new ForbiddenException(
        'Only the team leader can mark the group as ready',
      );
    }

    if (equipe.status === EquipeStatus.READY) {
      return this.getEquipeById(equipeId);
    }

    if (equipe.status !== EquipeStatus.FORMING) {
      throw new BadRequestException(
        'Group can only be finalized from FORMING status',
      );
    }

    const n = equipe.members.length;
    if (n < MIN_TEAM_MEMBERS || n > MAX_TEAM_MEMBERS) {
      throw new BadRequestException(
        `Team must have between ${MIN_TEAM_MEMBERS} and ${MAX_TEAM_MEMBERS} members to be marked ready (currently ${n}).`,
      );
    }

    if (
      equipe.competition.status !== CompetitionStatus.OPEN_FOR_ENTRY &&
      equipe.competition.status !== CompetitionStatus.RUNNING
    ) {
      throw new BadRequestException(
        'Competition is not open; cannot finalize team roster',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.equipe.update({
        where: { id: equipeId },
        data: { status: EquipeStatus.READY },
      });
      await tx.equipeInvitation.updateMany({
        where: {
          equipeId,
          status: EquipeInvitationStatus.PENDING,
        },
        data: { status: EquipeInvitationStatus.EXPIRED },
      });
    });

    return this.getEquipeById(equipeId);
  }

  async getMyInvitations(userId: string) {
    const invitations = await this.prisma.equipeInvitation.findMany({
      where: {
        inviteeId: userId,
        status: EquipeInvitationStatus.PENDING,
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

  // ─────────────────────────────────────────────────────────────────
  // JOIN SOLO (waiting pool)
  // ─────────────────────────────────────────────────────────────────

  async joinSolo(competitionId: string, userId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
    });
    if (!competition) {
      throw new NotFoundException('Competition not found');
    }
    if (
      competition.status !== CompetitionStatus.OPEN_FOR_ENTRY &&
      competition.status !== CompetitionStatus.RUNNING
    ) {
      throw new BadRequestException('Competition is not open for registration');
    }

    // Check not already in a team
    const existingMembership = await this.prisma.equipeMember.findFirst({
      where: {
        userId,
        equipe: { competitionId },
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'You are already in a team for this competition',
      );
    }

    // Check not already registered
    const existingParticipation =
      await this.prisma.competitionParticipant.findUnique({
        where: { competitionId_userId: { competitionId, userId } },
      });
    if (existingParticipation) {
      throw new ConflictException(
        'You are already registered in this competition',
      );
    }

    // Check capacity
    if (competition.maxParticipants !== null) {
      const currentCount = await this.prisma.competitionParticipant.count({
        where: { competitionId, status: ParticipantStatus.JOINED },
      });
      if (currentCount >= competition.maxParticipants) {
        throw new BadRequestException(
          'This competition has reached its maximum participant limit',
        );
      }
    }

    // Create participant without equipeId (solo waiting pool)
    const participant = await this.prisma.$transaction(async (tx) => {
      const p = await tx.competitionParticipant.create({
        data: {
          competitionId,
          userId,
          equipeId: null,
          status: ParticipantStatus.JOINED,
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
            status: CheckpointStatus.PENDING,
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
      message:
        "Vous avez rejoint la file d'attente solo. Vous serez automatiquement assigné à une équipe.",
      participant,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // AUTO-ASSIGN SOLO USERS TO EQUIPES
  // ─────────────────────────────────────────────────────────────────

  async autoAssignSoloUsers(competitionId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true, title: true, status: true },
    });
    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Get all solo participants (no equipeId)
    const soloParticipants = await this.prisma.competitionParticipant.findMany({
      where: {
        competitionId,
        equipeId: null,
        status: ParticipantStatus.JOINED,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (soloParticipants.length === 0) {
      return { message: 'No solo participants to assign', teamsCreated: 0 };
    }

    // Shuffle for randomness
    const shuffled = [...soloParticipants].sort(() => Math.random() - 0.5);

    const teamsCreated: string[] = [];

    // Group into chunks of up to MAX_TEAM_MEMBERS (solo auto-assign)
    for (let i = 0; i < shuffled.length; i += MAX_TEAM_MEMBERS) {
      const chunk = shuffled.slice(i, i + MAX_TEAM_MEMBERS);

      // Pick random leader
      const leaderIndex = Math.floor(Math.random() * chunk.length);

      const equipe = await this.prisma.$transaction(async (tx) => {
        const teamNumber = Math.floor(i / MAX_TEAM_MEMBERS) + 1;
        const newEquipe = await tx.equipe.create({
          data: {
            name: `Équipe Auto #${teamNumber}`,
            competitionId,
            status:
              chunk.length >= MIN_TEAM_MEMBERS &&
              chunk.length <= MAX_TEAM_MEMBERS
                ? EquipeStatus.READY
                : EquipeStatus.FORMING,
            isAutoFormed: true,
          },
        });

        // Create members and update participants
        for (let j = 0; j < chunk.length; j++) {
          const participant = chunk[j];
          const role =
            j === leaderIndex
              ? EquipeMemberRole.LEADER
              : EquipeMemberRole.MEMBER;

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

      // Créer le canal de chat privé pour l'équipe auto-assignée
      const memberUserIds = chunk.map((p) => p.userId);
      void this.streamService
        .createTeamChannel(
          equipe.id,
          competitionId,
          equipe.name,
          memberUserIds,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to create team chat for auto-assigned equipe ${equipe.id}: ${err?.message ?? err}`,
          ),
        );

      // Send notifications to all members
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

    this.logger.log(
      `Auto-assigned ${shuffled.length} solo users into ${teamsCreated.length} teams for competition ${competitionId}`,
    );

    return {
      message: `${teamsCreated.length} teams created from ${shuffled.length} solo participants`,
      teamsCreated: teamsCreated.length,
      teamIds: teamsCreated,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // SEARCH USERS FOR INVITE
  // ─────────────────────────────────────────────────────────────────

  async searchUsers(query: string, competitionId?: string) {
    const where: any = {
      role: UserRole.USER,
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

    // If competitionId provided, mark users who are already in a team
    if (competitionId) {
      const teamedUserIds = await this.prisma.equipeMember.findMany({
        where: { equipe: { competitionId } },
        select: { userId: true },
      });
      const teamedSet = new Set(teamedUserIds.map((m) => m.userId));

      const soloParticipantIds =
        await this.prisma.competitionParticipant.findMany({
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

  // ─────────────────────────────────────────────────────────────────
  // AI TEAM SYNERGY PREDICTOR
  // ─────────────────────────────────────────────────────────────────

  /** Skill axes we evaluate */
  private readonly SYNERGY_AXES = [
    'Frontend',
    'Backend',
    'AI / Data',
    'Mobile',
    'DevOps',
    'Design',
  ] as const;

  /** Maps mainSpecialty enum → primary axis points */
  private readonly SPECIALTY_TO_AXIS: Record<string, Record<string, number>> = {
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

  /** Maps common skill tags to axes */
  private readonly TAG_TO_AXIS: Record<string, Record<string, number>> = {
    // Frontend
    react: { Frontend: 10 },
    angular: { Frontend: 10 },
    vue: { Frontend: 10 },
    tailwindcss: { Frontend: 8, Design: 5 },
    html: { Frontend: 5 },
    css: { Frontend: 5 },
    nextjs: { Frontend: 8, Backend: 5 },
    // Backend
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
    // AI / Data
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
    // Mobile
    flutter: { Mobile: 12, Frontend: 5 },
    dart: { Mobile: 10 },
    'react native': { Mobile: 12, Frontend: 5 },
    swift: { Mobile: 10 },
    kotlin: { Mobile: 10 },
    android: { Mobile: 10 },
    ios: { Mobile: 10 },
    // DevOps
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
    // Design
    figma: { Design: 12 },
    'ui/ux': { Design: 12, Frontend: 5 },
    photoshop: { Design: 10 },
    illustrator: { Design: 8 },
    canva: { Design: 5 },
    sketch: { Design: 10 },
  };

  /** GitHub language → axes */
  private readonly LANG_TO_AXIS: Record<string, Record<string, number>> = {
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

  async getTeamSynergy(equipeId: string) {
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
      throw new NotFoundException('Equipe not found');
    }

    // Accumulate raw scores per axis
    const rawScores: Record<string, number> = {};
    for (const axis of this.SYNERGY_AXES) {
      rawScores[axis] = 0;
    }

    // Per-member analysis
    const memberAnalysis: Array<{
      name: string;
      specialty: string | null;
      contributions: Record<string, number>;
    }> = [];

    for (const member of equipe.members) {
      const user = member.user;
      const contributions: Record<string, number> = {};

      // 1) mainSpecialty
      if (user.mainSpecialty) {
        const mapping = this.SPECIALTY_TO_AXIS[user.mainSpecialty];
        if (mapping) {
          for (const [axis, pts] of Object.entries(mapping)) {
            rawScores[axis] = (rawScores[axis] || 0) + pts;
            contributions[axis] = (contributions[axis] || 0) + pts;
          }
        }
      }

      // 2) skillTags
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

      // 3) githubRepos (JSON array of repos with language/name)
      if (user.githubRepos && Array.isArray(user.githubRepos)) {
        const seenLangs = new Set<string>();
        for (const repo of user.githubRepos as any[]) {
          const lang = (
            repo?.language ||
            repo?.primaryLanguage?.name ||
            ''
          )
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

    // Normalise to 0–100
    const maxPossible = Math.max(...Object.values(rawScores), 1);
    const scores: Record<string, number> = {};
    for (const axis of this.SYNERGY_AXES) {
      scores[axis] = Math.min(
        100,
        Math.round((rawScores[axis] / maxPossible) * 100),
      );
    }

    // Context: Hackathon specialty / description analysis
    let targetAxis: string | null = null;
    if (equipe.competition?.specialty) {
      const mapping = this.SPECIALTY_TO_AXIS[equipe.competition.specialty];
      if (mapping) {
        targetAxis = Object.keys(mapping)[0]; // e.g. "Frontend"
      }
    } else if (equipe.competition?.description) {
      // NLP Keyword extraction if specialty is missing
      const desc = equipe.competition.description.toLowerCase();
      let bestAxis = '';
      let bestScore = 0;
      
      const descKeywords: Record<string, string[]> = {
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
          if (desc.includes(word)) score++;
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

    // NLP Keyword extraction for General Theme (Domain)
    let targetTheme: string | null = null;
    const fullText = `${equipe.competition?.title || ''} ${equipe.competition?.description || ''}`.toLowerCase();
    
    if (fullText.trim().length > 0) {
      const themeKeywords: Record<string, string[]> = {
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
          if (fullText.includes(word)) score++;
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

    // Compute overall match score
    let synergyScore = 0;
    if (targetAxis) {
      // MATCH SCORE (Dynamic based on Hackathon Target)
      const targetScore = scores[targetAxis] || 0;
      const otherVals = this.SYNERGY_AXES.filter((a) => a !== targetAxis).map(
        (a) => scores[a] || 0,
      );
      const otherAvg = otherVals.reduce((a, b) => a + b, 0) / (otherVals.length || 1);
      
      // 70% weight on the required skill, 30% on having a well-rounded team
      synergyScore = Math.round(targetScore * 0.7 + otherAvg * 0.3);
    } else {
      // General Synergy (penalise imbalance)
      const vals = Object.values(scores);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const stddev = Math.sqrt(
        vals.reduce((sum, v) => sum + (v - avg) ** 2, 0) / vals.length,
      );
      const balanceBonus = Math.max(0, 100 - stddev * 2);
      synergyScore = Math.round(avg * 0.6 + balanceBonus * 0.4);
    }

    // Generate Context-Aware French advice
    const strengths = this.SYNERGY_AXES.filter((a) => scores[a] >= 60);
    // Sort weaknesses to pick the worst ones (max 2) to avoid listing everything
    const weaknesses = this.SYNERGY_AXES.filter((a) => scores[a] <= 25).sort(
      (a, b) => scores[a] - scores[b],
    );

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
        
        const response = await this.groqAiService.askForJson<{ advice: string }>(systemPrompt, userPrompt);
        advice = response.advice;
      } catch (error) {
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
        } else {
          advice += `⚠️ **Attention :** Votre équipe manque de compétences en ${targetAxis} (${scores[targetAxis]}%), ce qui est crucial pour gagner ! `;
          // Ensure the target axis is treated as a priority weakness
          const typedTargetAxis = targetAxis as typeof this.SYNERGY_AXES[number];
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

      if (
        weaknesses.length === 0 &&
        strengths.length >= 4
      ) {
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
}
