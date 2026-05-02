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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const sign_up_dto_1 = require("./dto/sign-up.dto");
const sign_in_dto_1 = require("./dto/sign-in.dto");
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
    async signUp(dto, files) {
        const resumeFile = files.resume?.[0];
        const avatarFile = files.avatar?.[0];
        if (!avatarFile?.buffer) {
            throw new common_1.BadRequestException('Avatar image file is required for identity verification');
        }
        return this.authService.signUp(dto, resumeFile?.buffer, avatarFile);
    }
    getAvatar(filename, res) {
        const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.BadRequestException('Avatar not found');
        }
        return res.sendFile(filePath);
    }
    async signIn(dto) {
        return this.authService.signIn(dto);
    }
    async forgotPassword(dto) {
        await this.authService.requestPasswordReset(dto.email);
        return {
            message: 'If an account exists for this email, a reset code has been sent.',
        };
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
    async uploadAvatar(userId, file) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException('Avatar file is required');
        }
        return this.authService.uploadAvatarAndUpdateProfile(userId, file);
    }
    async registerFcmToken(userId, fcmToken) {
        await this.authService.updateFcmToken(userId, fcmToken);
        return { message: 'FCM token registered' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'resume', maxCount: 1 },
        { name: 'avatar', maxCount: 1 },
    ], {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.fieldname === 'resume' &&
                !file?.originalname?.toLowerCase().endsWith('.docx')) {
                return cb(new common_1.BadRequestException('Resume must be a .docx file'), false);
            }
            if (file.fieldname === 'avatar') {
                const isImageMime = file.mimetype?.startsWith('image/');
                const isImageExt = file.originalname?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                if (!isImageMime && !isImageExt) {
                    return cb(new common_1.BadRequestException('Avatar must be an image file'), false);
                }
            }
            cb(null, true);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register a new user with resume',
        description: 'Sign up with email, password, name, and a required avatar. Optional .docx resume enables CV extraction (mainSpecialty, skillTags).',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'password', 'firstName', 'lastName', 'avatar'],
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'secret1234', minLength: 8 },
                firstName: { type: 'string', example: 'Jane' },
                lastName: { type: 'string', example: 'Doe' },
                resume: {
                    type: 'string',
                    format: 'binary',
                    description: 'Resume .docx (optional, max 5MB)',
                },
                avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Avatar Image for Facial Verification (required)',
                },
                githubUrl: {
                    type: 'string',
                    example: 'https://github.com/username',
                    description: 'Optional',
                },
                linkedinUrl: {
                    type: 'string',
                    example: 'https://www.linkedin.com/in/username/',
                    description: 'Optional, used to enrich skills via Apify',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User created and logged in. Returns user data and access tokens.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or missing/invalid avatar (or invalid resume)',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sign_up_dto_1.SignUpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signUp", null);
__decorate([
    (0, common_1.Get)('avatar/:filename'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user avatar image' }),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getAvatar", null);
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
    (0, swagger_1.ApiBody)({
        type: update_profile_dto_1.UpdateProfileDto,
        description: 'Fields to update (all optional)',
    }),
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
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile updated with extracted specialty and skills',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid file (e.g. not .docx or extraction failed)',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadCv", null);
__decorate([
    (0, common_1.Post)('profile/avatar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const isImageMime = file.mimetype?.startsWith('image/');
            const isImageExt = file.originalname?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            if (!isImageMime && !isImageExt) {
                return cb(new common_1.BadRequestException('Face Image must be an image file'), false);
            }
            cb(null, true);
        },
    })),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user avatar' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Avatar Image (max 5MB)',
                },
            },
            required: ['avatar'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated with new avatar' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('fcm-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Register FCM token for push notifications' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                fcmToken: {
                    type: 'string',
                    description: 'Firebase Cloud Messaging token',
                },
            },
            required: ['fcmToken'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'FCM token registered' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)('fcmToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerFcmToken", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map