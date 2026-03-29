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
exports.StreamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stream_service_1 = require("./stream.service");
const stream_token_dto_1 = require("./dto/stream-token.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const room_specialty_config_1 = require("./room-specialty.config");
let StreamController = class StreamController {
    streamService;
    constructor(streamService) {
        this.streamService = streamService;
    }
    async getToken(dto, user) {
        const userId = (dto?.userId?.trim() || user?.id);
        const token = this.streamService.createUserToken(userId);
        const apiKey = this.streamService.getApiKey();
        return { token, apiKey };
    }
    async arenaJoin(user) {
        await this.streamService.ensureArenaMember(user.id);
        return { ok: true };
    }
    getRooms(user) {
        const rooms = (0, room_specialty_config_1.getAllRoomsWithAccess)(user.mainSpecialty ?? null);
        return { rooms };
    }
    async roomJoin(roomId, user) {
        if (!(0, room_specialty_config_1.canAccessRoom)(roomId, user.mainSpecialty ?? null)) {
            throw new common_1.ForbiddenException('Vous ne pouvez accéder qu\'à la salle correspondant à votre spécialité. Définissez votre spécialité dans Paramètres si besoin.');
        }
        await this.streamService.ensureRoomMember(user.id, roomId);
        return { ok: true };
    }
};
exports.StreamController = StreamController;
__decorate([
    (0, common_1.Post)('token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Stream user token for Chat and Video' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns Stream user token' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing userId or Stream not configured' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stream_token_dto_1.StreamTokenDto, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "getToken", null);
__decorate([
    (0, common_1.Post)('arena/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Rejoindre le canal Arena Live (nécessaire pour envoyer des messages)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Utilisateur ajouté au canal' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Stream not configured' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "arenaJoin", null);
__decorate([
    (0, common_1.Get)('rooms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Toutes les salles hackathon avec indicateur canParticipate selon la spécialité' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des salles (toutes affichées, canParticipate=true uniquement pour la spécialité)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StreamController.prototype, "getRooms", null);
__decorate([
    (0, common_1.Post)('room/:roomId/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Rejoindre une salle (hackathon) : chat + visio + partage d\'écran' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Utilisateur ajouté à la salle' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Stream not configured' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Accès refusé : salle non autorisée pour votre spécialité' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "roomJoin", null);
exports.StreamController = StreamController = __decorate([
    (0, swagger_1.ApiTags)('stream'),
    (0, common_1.Controller)('stream'),
    __metadata("design:paramtypes", [stream_service_1.StreamService])
], StreamController);
//# sourceMappingURL=stream.controller.js.map