import { CompetitionStatus, CompetitionDifficulty, Specialty } from '@prisma/client';
export declare class CreateCompetitionDto {
    title: string;
    description: string;
    difficulty: CompetitionDifficulty;
    specialty?: Specialty;
    startDate: string;
    endDate: string;
    rewardPool?: number;
    maxParticipants?: number;
    antiCheatEnabled?: boolean;
    antiCheatThreshold?: number;
    topN?: number;
}
declare const UpdateCompetitionDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateCompetitionDto>>;
export declare class UpdateCompetitionDto extends UpdateCompetitionDto_base {
}
export declare class ChangeCompetitionStatusDto {
    status: CompetitionStatus;
}
export declare class JoinCompetitionDto {
}
export declare class CompetitionQueryDto {
    status?: CompetitionStatus;
    difficulty?: CompetitionDifficulty;
    specialty?: Specialty;
    onlyActive?: boolean;
    page?: number;
    limit?: number;
}
export declare class SubmitWorkDto {
    githubUrl: string;
}
export declare class SubmitCheckpointDto {
    proofUrl: string;
    notes?: string;
}
export declare class ReviewCheckpointSubmissionDto {
    status: 'APPROVED' | 'REJECTED';
}
export {};
