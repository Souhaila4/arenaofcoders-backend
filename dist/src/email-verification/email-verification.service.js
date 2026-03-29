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
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let EmailVerificationService = class EmailVerificationService {
    prisma;
    emailService;
    CODE_EXPIRY_MINUTES = 10;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendVerificationCode(email, firstName) {
        const code = this.generateCode();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);
        await this.prisma.emailVerification.deleteMany({
            where: { email: email.toLowerCase() },
        });
        await this.prisma.emailVerification.create({
            data: {
                email: email.toLowerCase(),
                code,
                expiresAt,
            },
        });
        await this.emailService.sendVerificationCode(email, code, firstName);
    }
    async verifyCode(email, code) {
        const verification = await this.prisma.emailVerification.findFirst({
            where: {
                email: email.toLowerCase(),
                code,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!verification) {
            throw new common_1.BadRequestException('Invalid or expired verification code');
        }
        await this.prisma.user.update({
            where: { email: email.toLowerCase() },
            data: { isEmailVerified: true },
        });
        await this.prisma.emailVerification.delete({
            where: { id: verification.id },
        });
    }
    async isEmailVerified(email) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { isEmailVerified: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user.isEmailVerified;
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map