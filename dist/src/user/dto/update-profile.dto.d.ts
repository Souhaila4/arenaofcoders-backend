import { Specialty } from '@prisma/client';
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    mainSpecialty?: Specialty;
    skillTags?: string[];
    githubUrl?: string;
    linkedinUrl?: string;
    linkedinPosts?: any;
    githubRepos?: any;
    socialDataLastUpdate?: Date;
}
