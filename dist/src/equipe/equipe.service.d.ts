import { PrismaService } from '../prisma/prisma.service';
import { StreamService } from '../stream/stream.service';
import { CreateEquipeDto, InviteToEquipeDto } from './equipe.dto';
import { GroqAiService } from '../agents/groq-ai.service';
export declare class EquipeService {
    private readonly prisma;
    private readonly streamService;
    private readonly groqAiService;
    private readonly logger;
    constructor(prisma: PrismaService, streamService: StreamService, groqAiService: GroqAiService);
    createEquipe(dto: CreateEquipeDto, userId: string): Promise<{
        competition: {
            id: string;
            title: string;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            };
        } & {
            id: string;
            userId: string;
            equipeId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.EquipeMemberRole;
        })[];
        invitations: ({
            invitee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.EquipeStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        competitionId: string;
        githubUrl: string | null;
        antiCheatScore: number | null;
        score: number | null;
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        isAutoFormed: boolean;
    }>;
    getEquipeById(equipeId: string): Promise<{
        competition: {
            id: string;
            title: string;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            };
        } & {
            id: string;
            userId: string;
            equipeId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.EquipeMemberRole;
        })[];
        invitations: ({
            invitee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.EquipeStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        competitionId: string;
        githubUrl: string | null;
        antiCheatScore: number | null;
        score: number | null;
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        isAutoFormed: boolean;
    }>;
    getMyEquipe(competitionId: string, userId: string): Promise<{
        myRole: import(".prisma/client").$Enums.EquipeMemberRole;
        competition: {
            id: string;
            title: string;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            };
        } & {
            id: string;
            userId: string;
            equipeId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.EquipeMemberRole;
        })[];
        invitations: ({
            invitee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        })[];
        id: string;
        status: import(".prisma/client").$Enums.EquipeStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        competitionId: string;
        githubUrl: string | null;
        antiCheatScore: number | null;
        score: number | null;
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        isAutoFormed: boolean;
    } | null>;
    getCompetitionEquipes(competitionId: string): Promise<{
        competitionId: string;
        equipes: ({
            _count: {
                members: number;
            };
            members: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatarUrl: string | null;
                    mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
                };
            } & {
                id: string;
                userId: string;
                equipeId: string;
                joinedAt: Date;
                role: import(".prisma/client").$Enums.EquipeMemberRole;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            competitionId: string;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            isAutoFormed: boolean;
        })[];
        total: number;
    }>;
    inviteToEquipe(equipeId: string, dto: InviteToEquipeDto, inviterId: string): Promise<{
        message: string;
        invitation: {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        };
    }>;
    acceptInvitation(invitationId: string, userId: string): Promise<{
        competition: {
            id: string;
            title: string;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            };
        } & {
            id: string;
            userId: string;
            equipeId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.EquipeMemberRole;
        })[];
        invitations: ({
            invitee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.EquipeStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        competitionId: string;
        githubUrl: string | null;
        antiCheatScore: number | null;
        score: number | null;
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        isAutoFormed: boolean;
    }>;
    declineInvitation(invitationId: string, userId: string): Promise<{
        message: string;
    }>;
    removeMember(equipeId: string, memberUserId: string, requesterId: string): Promise<{
        message: string;
    }>;
    markGroupReady(equipeId: string, userId: string): Promise<{
        competition: {
            id: string;
            title: string;
            specialty: import(".prisma/client").$Enums.Specialty | null;
            status: import(".prisma/client").$Enums.CompetitionStatus;
        };
        members: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
            };
        } & {
            id: string;
            userId: string;
            equipeId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.EquipeMemberRole;
        })[];
        invitations: ({
            invitee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.EquipeStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        competitionId: string;
        githubUrl: string | null;
        antiCheatScore: number | null;
        score: number | null;
        scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
        submittedAt: Date | null;
        isWinner: boolean;
        isAutoFormed: boolean;
    }>;
    getMyInvitations(userId: string): Promise<{
        invitations: ({
            equipe: {
                competition: {
                    id: string;
                    title: string;
                    specialty: import(".prisma/client").$Enums.Specialty | null;
                    status: import(".prisma/client").$Enums.CompetitionStatus;
                };
                _count: {
                    members: number;
                };
                members: ({
                    user: {
                        id: string;
                        firstName: string;
                        lastName: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    userId: string;
                    equipeId: string;
                    joinedAt: Date;
                    role: import(".prisma/client").$Enums.EquipeMemberRole;
                })[];
            } & {
                id: string;
                status: import(".prisma/client").$Enums.EquipeStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                competitionId: string;
                githubUrl: string | null;
                antiCheatScore: number | null;
                score: number | null;
                scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
                submittedAt: Date | null;
                isWinner: boolean;
                isAutoFormed: boolean;
            };
            inviter: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EquipeInvitationStatus;
            createdAt: Date;
            updatedAt: Date;
            equipeId: string;
            inviterId: string;
            inviteeId: string;
        })[];
        total: number;
    }>;
    joinSolo(competitionId: string, userId: string): Promise<{
        message: string;
        participant: {
            id: string;
            status: import(".prisma/client").$Enums.ParticipantStatus;
            competitionId: string;
            userId: string;
            equipeId: string | null;
            joinedAt: Date;
            hackathonFaceUrl: string | null;
            githubUrl: string | null;
            antiCheatScore: number | null;
            score: number | null;
            scoringReport: import("@prisma/client/runtime/library").JsonValue | null;
            submittedAt: Date | null;
            isWinner: boolean;
            baseRepositoryUrl: string | null;
            hasUsedExtraLife: boolean;
        };
    }>;
    autoAssignSoloUsers(competitionId: string): Promise<{
        message: string;
        teamsCreated: number;
        teamIds?: undefined;
    } | {
        message: string;
        teamsCreated: number;
        teamIds: string[];
    }>;
    searchUsers(query: string, competitionId?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
    }[]>;
    private readonly SYNERGY_AXES;
    private readonly SPECIALTY_TO_AXIS;
    private readonly TAG_TO_AXIS;
    private readonly LANG_TO_AXIS;
    getTeamSynergy(equipeId: string): Promise<{
        equipeId: string;
        equipeName: string;
        memberCount: number;
        synergyScore: number;
        axes: {
            name: "Frontend" | "Backend" | "AI / Data" | "Mobile" | "DevOps" | "Design";
            score: number;
        }[];
        strengths: {
            name: "Frontend" | "Backend" | "AI / Data" | "Mobile" | "DevOps" | "Design";
            score: number;
        }[];
        weaknesses: {
            name: "Frontend" | "Backend" | "AI / Data" | "Mobile" | "DevOps" | "Design";
            score: number;
        }[];
        advice: string;
        targetTheme: string | null;
        targetAxis: string | null;
        memberAnalysis: {
            name: string;
            specialty: string | null;
            contributions: Record<string, number>;
        }[];
    }>;
}
