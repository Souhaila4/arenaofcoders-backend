import { EquipeService } from './equipe.service';
import { CreateEquipeDto, InviteToEquipeDto } from './equipe.dto';
export declare class EquipeController {
    private readonly equipeService;
    constructor(equipeService: EquipeService);
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
    searchUsers(query: string, competitionId?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        mainSpecialty: import(".prisma/client").$Enums.Specialty | null;
    }[]>;
    getEquipe(equipeId: string): Promise<{
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
    removeMember(equipeId: string, memberUserId: string, requesterId: string): Promise<{
        message: string;
    }>;
    inviteToEquipe(equipeId: string, dto: InviteToEquipeDto, userId: string): Promise<{
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
    autoAssign(competitionId: string): Promise<{
        message: string;
        teamsCreated: number;
        teamIds?: undefined;
    } | {
        message: string;
        teamsCreated: number;
        teamIds: string[];
    }>;
}
