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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiCheatController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const axios_1 = __importDefault(require("axios"));
const FormData = require("form-data");
let AntiCheatController = class AntiCheatController {
    config;
    hfToken;
    imageSpaceUrl = 'https://negzaoui-antiimagesenvirement.hf.space/scan';
    audioSpaceUrl = 'https://negzaoui-modelevocal.hf.space/scan-audio';
    constructor(config) {
        this.config = config;
        this.hfToken = this.config.get('HUGGINGFACE_TOKEN') ?? '';
    }
    async validateImage(files) {
        const imageFile = files?.image?.[0];
        if (!imageFile?.buffer) {
            throw new common_1.BadRequestException('Image file is required');
        }
        const form = new FormData();
        form.append('image', imageFile.buffer, {
            filename: imageFile.originalname,
            contentType: imageFile.mimetype,
        });
        const avatarFile = files?.avatar?.[0];
        if (avatarFile?.buffer) {
            form.append('avatar', avatarFile.buffer, {
                filename: avatarFile.originalname,
                contentType: avatarFile.mimetype,
            });
        }
        const response = await axios_1.default.post(this.imageSpaceUrl, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${this.hfToken}`,
            },
            timeout: 90_000,
        });
        return response.data;
    }
    async validateAudio(files) {
        const audioFile = files?.audio?.[0];
        if (!audioFile?.buffer) {
            throw new common_1.BadRequestException('Audio file is required');
        }
        const form = new FormData();
        form.append('audio', audioFile.buffer, {
            filename: audioFile.originalname,
            contentType: audioFile.mimetype,
        });
        const response = await axios_1.default.post(this.audioSpaceUrl, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${this.hfToken}`,
            },
            timeout: 90_000,
        });
        return response.data;
    }
};
exports.AntiCheatController = AntiCheatController;
__decorate([
    (0, common_1.Post)('validate-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'image', maxCount: 1 },
        { name: 'avatar', maxCount: 1 },
    ], { limits: { fileSize: 10 * 1024 * 1024 } })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Proxy — Workspace image anti-cheat validation via HuggingFace Space',
    }),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AntiCheatController.prototype, "validateImage", null);
__decorate([
    (0, common_1.Post)('validate-audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'audio', maxCount: 1 }], {
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Proxy — Vocal audio anti-cheat validation via HuggingFace Space',
    }),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AntiCheatController.prototype, "validateAudio", null);
exports.AntiCheatController = AntiCheatController = __decorate([
    (0, swagger_1.ApiTags)('anti-cheat'),
    (0, common_1.Controller)('anti-cheat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AntiCheatController);
//# sourceMappingURL=anti-cheat.controller.js.map