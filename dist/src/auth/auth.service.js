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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const user_service_1 = require("../user/user.service");
const email_verification_service_1 = require("../email-verification/email-verification.service");
const cv_extraction_service_1 = require("../cv-extraction/cv-extraction.service");
const password_reset_service_1 = require("../password-reset/password-reset.service");
const apify_service_1 = require("../apify/apify.service");
const scraper_service_1 = require("../scraper/scraper.service");
const client_1 = require("@prisma/client");
const SALT_ROUNDS = 12;
let AuthService = class AuthService {
    userService;
    jwtService;
    config;
    emailVerificationService;
    cvExtractionService;
    apifyService;
    scraperService;
    passwordResetService;
    jwtExpiresIn;
    constructor(userService, jwtService, config, emailVerificationService, cvExtractionService, apifyService, scraperService, passwordResetService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.config = config;
        this.emailVerificationService = emailVerificationService;
        this.cvExtractionService = cvExtractionService;
        this.apifyService = apifyService;
        this.scraperService = scraperService;
        this.passwordResetService = passwordResetService;
        this.jwtExpiresIn =
            this.config.get('JWT_EXPIRES_IN', '7d');
    }
    async signUp(dto, resumeBuffer) {
        try {
            const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
            const user = await this.userService.create({
                email: dto.email,
                passwordHash,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                role: client_1.UserRole.USER,
                ...(dto.githubUrl && { githubUrl: dto.githubUrl.trim() }),
                ...(dto.linkedinUrl && { linkedinUrl: dto.linkedinUrl.trim() }),
            });
            if (resumeBuffer?.length) {
                try {
                    const extraction = await this.cvExtractionService.extractFromBuffer(resumeBuffer);
                    const updateDto = {};
                    if (extraction.mainSpecialty != null)
                        updateDto.mainSpecialty = extraction.mainSpecialty;
                    if (extraction.skillTags.length > 0)
                        updateDto.skillTags = extraction.skillTags;
                    if (Object.keys(updateDto).length > 0) {
                        await this.userService.updateProfile(user.id, updateDto);
                    }
                }
                catch {
                }
            }
            if (dto.linkedinUrl?.trim()) {
                console.log('[SIGNUP] LinkedIn URL detected:', dto.linkedinUrl);
                try {
                    const linkedInSkills = await this.apifyService.getLinkedInSkills(dto.linkedinUrl.trim());
                    console.log('[SIGNUP] LinkedIn skills scraped:', linkedInSkills.length, 'skills');
                    if (linkedInSkills.length > 0) {
                        const current = await this.userService.findById(user.id);
                        const existingTags = current?.skillTags ?? [];
                        const merged = Array.from(new Set([...existingTags.map((s) => s.toLowerCase()), ...linkedInSkills])).slice(0, 30);
                        await this.userService.updateProfile(user.id, { skillTags: merged });
                    }
                }
                catch (err) {
                    console.error('[SIGNUP] LinkedIn skills scraping failed:', err);
                }
            }
            if (dto.githubUrl?.trim()) {
                console.log('[SIGNUP] GitHub URL detected:', dto.githubUrl);
                try {
                    console.log('[SIGNUP] Scraping GitHub repos via free REST API...');
                    const githubRepos = await this.scraperService.getGitHubRepos(dto.githubUrl.trim());
                    console.log('[SIGNUP] GitHub repos scraped:', githubRepos.length, 'repos');
                    if (githubRepos.length > 0) {
                        await this.userService.updateProfile(user.id, {
                            githubRepos: githubRepos,
                            socialDataLastUpdate: new Date()
                        });
                        console.log('[SIGNUP] GitHub repos saved to database');
                    }
                }
                catch (err) {
                    console.error('[SIGNUP] GitHub repos scraping failed:', err);
                }
            }
            try {
                await this.emailVerificationService.sendVerificationCode(user.email, user.firstName);
            }
            catch (emailErr) {
                throw new common_1.InternalServerErrorException('Failed to send verification email. Please check your email address or try again later.');
            }
            return {
                email: user.email,
                message: 'Verification code sent to your email. Please verify to complete registration.',
            };
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            const msg = err instanceof Error ? err.message : 'Signup failed';
            throw new common_1.InternalServerErrorException(msg);
        }
    }
    async signIn(dto) {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.isBanned) {
            throw new common_1.BadRequestException('Account is banned');
        }
        if (!user.isEmailVerified) {
            throw new common_1.BadRequestException('Please verify your email before signing in. Check your inbox for the verification code.');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const tokens = this.issueTokens(payload);
        return {
            user: this.toAuthUser(user),
            tokens,
        };
    }
    async validateUserById(id) {
        return this.userService.findById(id);
    }
    issueTokens(payload) {
        const expiresInSeconds = this.parseExpiresInToSeconds(this.jwtExpiresIn);
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: expiresInSeconds,
        });
        return { accessToken, expiresIn: expiresInSeconds };
    }
    toAuthUser(user) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
    parseExpiresInToSeconds(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 7 * 24 * 60 * 60;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
        };
        return value * (multipliers[unit] ?? 86400);
    }
    async verifyEmail(email, code) {
        await this.emailVerificationService.verifyCode(email, code);
        const user = await this.userService.findByEmail(email);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const payload = { sub: user.id, email: user.email, role: user.role };
        const tokens = this.issueTokens(payload);
        return { user: this.toAuthUser(user), tokens };
    }
    async resendVerificationCode(email) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Email is already verified');
        }
        await this.emailVerificationService.sendVerificationCode(user.email, user.firstName);
    }
    async requestPasswordReset(email) {
        await this.passwordResetService.requestReset(email);
    }
    async resetPassword(email, code, newPassword) {
        await this.passwordResetService.verifyAndConsume(email, code);
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await this.userService.updatePasswordByEmail(email, passwordHash);
    }
    async updateProfile(userId, dto) {
        return this.userService.updateProfile(userId, dto);
    }
    async uploadCvAndUpdateProfile(userId, buffer) {
        const extraction = await this.cvExtractionService.extractFromBuffer(buffer);
        const dto = {};
        if (extraction.mainSpecialty != null)
            dto.mainSpecialty = extraction.mainSpecialty;
        if (extraction.skillTags.length > 0)
            dto.skillTags = extraction.skillTags;
        return this.userService.updateProfile(userId, dto);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_verification_service_1.EmailVerificationService,
        cv_extraction_service_1.CvExtractionService,
        apify_service_1.ApifyService,
        scraper_service_1.ScraperService,
        password_reset_service_1.PasswordResetService])
], AuthService);
//# sourceMappingURL=auth.service.js.map