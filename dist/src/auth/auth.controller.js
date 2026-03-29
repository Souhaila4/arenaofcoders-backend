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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const sign_up_dto_1 = require("./dto/sign-up.dto");
const sign_in_dto_1 = require("./dto/sign-in.dto");
const verify_email_dto_1 = require("./dto/verify-email.dto");
const resend_verification_dto_1 = require("./dto/resend-verification.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const update_profile_dto_1 = require("../user/dto/update-profile.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async signUp(dto, file) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException('Resume file (.docx) is required');
        }
        return this.authService.signUp(dto, file.buffer);
    }
    async signIn(dto) {
        return this.authService.signIn(dto);
    }
    async verifyEmail(dto) {
        return this.authService.verifyEmail(dto.email, dto.code);
    }
    async resendVerification(dto) {
        await this.authService.resendVerificationCode(dto.email);
        return { message: 'Verification code sent successfully' };
    }
    async forgotPassword(dto) {
        await this.authService.requestPasswordReset(dto.email);
        return { message: 'If an account exists for this email, a reset code has been sent.' };
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
        return { message: 'Password reset successfully' };
    }
    me(user) {
        return user;
    }
    updateProfile(userId, dto) {
        return this.authService.updateProfile(userId, dto);
    }
    async uploadCv(userId, file) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException('Resume file is required');
        }
        return this.authService.uploadCvAndUpdateProfile(userId, file.buffer);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('resume', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file?.originalname?.toLowerCase().endsWith('.docx')) {
                return cb(new common_1.BadRequestException('Resume must be a .docx file'), false);
            }
            cb(null, true);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register a new user with resume',
        description: 'Sign up with email, password, name, and a .docx resume. CV extraction sets mainSpecialty and skillTags from the resume.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'password', 'firstName', 'lastName', 'resume'],
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'secret1234', minLength: 8 },
                firstName: { type: 'string', example: 'Jane' },
                lastName: { type: 'string', example: 'Doe' },
                resume: { type: 'string', format: 'binary', description: 'Resume .docx (required, max 5MB)' },
                githubUrl: { type: 'string', example: 'https://github.com/username', description: 'Optional' },
                linkedinUrl: { type: 'string', example: 'https://www.linkedin.com/in/username/', description: 'Optional, used to enrich skills via Apify' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created, verification code sent to email. No tokens until email is verified.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or missing/invalid resume' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sign_up_dto_1.SignUpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signUp", null);
__decorate([
    (0, common_1.Post)('signin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sign in and get JWT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user and access token' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid email or password' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sign_in_dto_1.SignInDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signIn", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email with 6-digit code and get JWT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified, returns user and tokens' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_email_dto_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resend verification code to email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification code sent' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'User not found or already verified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resend_verification_dto_1.ResendVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset code by email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reset code sent to email' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password with code from email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user (requires JWT)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiBody)({ type: update_profile_dto_1.UpdateProfileDto, description: 'Fields to update (all optional)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated profile' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('profile/cv'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('resume', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file?.originalname?.toLowerCase().endsWith('.docx')) {
                return cb(new common_1.BadRequestException('Only .docx resume files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload resume (.docx)',
        description: 'Upload a .docx resume. Uses Hugging Face (kaaboura/cv-extraction-prediction) to predict specialty and extract skills, then updates your profile mainSpecialty and skillTags.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                resume: {
                    type: 'string',
                    format: 'binary',
                    description: 'Resume file (.docx only, max 5MB)',
                },
            },
            required: ['resume'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated with extracted specialty and skills' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file (e.g. not .docx or extraction failed)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadCv", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map