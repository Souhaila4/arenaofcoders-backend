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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const PROFILE_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    role: true,
    isEmailVerified: true,
    mainSpecialty: true,
    skillTags: true,
    githubUrl: true,
    linkedinUrl: true,
    linkedinPosts: true,
    githubRepos: true,
    socialDataLastUpdate: true,
    totalChallenges: true,
    totalWins: true,
    walletBalance: true,
    hederaAccountId: true,
    isBanned: true,
    createdAt: true,
    updatedAt: true,
};
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: PROFILE_SELECT,
        });
    }
    async updateProfile(userId, dto) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        const data = {
            ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
            ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
            ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
            ...(dto.mainSpecialty !== undefined && { mainSpecialty: dto.mainSpecialty }),
            ...(dto.skillTags !== undefined && { skillTags: dto.skillTags }),
            ...(dto.githubUrl !== undefined && { githubUrl: dto.githubUrl === '' ? null : dto.githubUrl }),
            ...(dto.linkedinUrl !== undefined && { linkedinUrl: dto.linkedinUrl === '' ? null : dto.linkedinUrl }),
            ...(dto.linkedinPosts !== undefined && { linkedinPosts: dto.linkedinPosts }),
            ...(dto.githubRepos !== undefined && { githubRepos: dto.githubRepos }),
            ...(dto.socialDataLastUpdate !== undefined && { socialDataLastUpdate: dto.socialDataLastUpdate }),
        };
        if (Object.keys(data).length === 0) {
            return this.findById(userId);
        }
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: PROFILE_SELECT,
        });
    }
    async updatePasswordByEmail(email, passwordHash) {
        await this.prisma.user.update({
            where: { email: email.toLowerCase() },
            data: { passwordHash },
        });
    }
    async updateWallet(userId, hederaAccountId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: { hederaAccountId },
            select: { id: true, hederaAccountId: true },
        });
    }
    async create(data) {
        const email = data.email.toLowerCase();
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        return this.prisma.user.create({
            data: {
                email,
                passwordHash: data.passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role ?? client_1.UserRole.USER,
                ...(data.githubUrl != null && data.githubUrl !== '' && { githubUrl: data.githubUrl.trim() }),
                ...(data.linkedinUrl != null && data.linkedinUrl !== '' && { linkedinUrl: data.linkedinUrl.trim() }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
    }
    async getLeaderboard() {
        const users = await this.prisma.user.findMany({
            where: {
                isEmailVerified: true,
                isBanned: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                mainSpecialty: true,
                skillTags: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const usersWithXP = users.map((user) => {
            const daysSinceCreation = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const baseXP = Math.min(500 + daysSinceCreation * 5, 2000);
            const skillsXP = (user.skillTags?.length || 0) * 150;
            const seed = user.id.charCodeAt(0) + user.id.charCodeAt(user.id.length - 1);
            const randomVariation = (seed % 201);
            const totalXP = Math.floor(baseXP + skillsXP + randomVariation);
            return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                mainSpecialty: user.mainSpecialty || 'Non spécifié',
                xp: totalXP,
                skillTags: user.skillTags || [],
            };
        });
        usersWithXP.sort((a, b) => b.xp - a.xp);
        const leaderboard = usersWithXP.map((user, index) => ({
            ...user,
            rank: index + 1,
        }));
        return {
            total: leaderboard.length,
            users: leaderboard,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map