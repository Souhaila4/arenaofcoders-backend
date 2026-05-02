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
exports.EquipeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const equipe_service_1 = require("./equipe.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const equipe_dto_1 = require("./equipe.dto");
let EquipeController = class EquipeController {
    equipeService;
    constructor(equipeService) {
        this.equipeService = equipeService;
    }
    async createEquipe(dto, userId) {
        return this.equipeService.createEquipe(dto, userId);
    }
    async getMyEquipe(competitionId, userId) {
        return this.equipeService.getMyEquipe(competitionId, userId);
    }
    async getCompetitionEquipes(competitionId) {
        return this.equipeService.getCompetitionEquipes(competitionId);
    }
    async searchUsers(query, competitionId) {
        return this.equipeService.searchUsers(query, competitionId);
    }
    async getEquipe(equipeId) {
        return this.equipeService.getEquipeById(equipeId);
    }
    async getTeamSynergy(equipeId) {
        return this.equipeService.getTeamSynergy(equipeId);
    }
    async markGroupReady(equipeId, userId) {
        return this.equipeService.markGroupReady(equipeId, userId);
    }
    async removeMember(equipeId, memberUserId, requesterId) {
        return this.equipeService.removeMember(equipeId, memberUserId, requesterId);
    }
    async inviteToEquipe(equipeId, dto, userId) {
        return this.equipeService.inviteToEquipe(equipeId, dto, userId);
    }
    async getMyInvitations(userId) {
        return this.equipeService.getMyInvitations(userId);
    }
    async acceptInvitation(invitationId, userId) {
        return this.equipeService.acceptInvitation(invitationId, userId);
    }
    async declineInvitation(invitationId, userId) {
        return this.equipeService.declineInvitation(invitationId, userId);
    }
    async joinSolo(competitionId, userId) {
        return this.equipeService.joinSolo(competitionId, userId);
    }
    async autoAssign(competitionId) {
        return this.equipeService.autoAssignSoloUsers(competitionId);
    }
};
exports.EquipeController = EquipeController;
__decorate([
    (0, common_1.Post)('equipes'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new equipe for a competition' }),
    (0, swagger_1.ApiBody)({ type: equipe_dto_1.CreateEquipeDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Equipe created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already in a team' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [equipe_dto_1.CreateEquipeDto, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "createEquipe", null);
__decorate([
    (0, common_1.Get)('equipes/my-equipe/:competitionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my equipe for a competition' }),
    (0, swagger_1.ApiParam)({ name: 'competitionId', description: 'Competition ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipe details or null' }),
    __param(0, (0, common_1.Param)('competitionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "getMyEquipe", null);
__decorate([
    (0, common_1.Get)('equipes/competition/:competitionId'),
    (0, swagger_1.ApiOperation)({ summary: 'List all equipes for a competition' }),
    (0, swagger_1.ApiParam)({ name: 'competitionId', description: 'Competition ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of equipes' }),
    __param(0, (0, common_1.Param)('competitionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "getCompetitionEquipes", null);
__decorate([
    (0, common_1.Get)('equipes/search-users'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users to invite to a team' }),
    (0, swagger_1.ApiQuery)({ name: 'query', description: 'Search by name or email' }),
    (0, swagger_1.ApiQuery)({ name: 'competitionId', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of matching users' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('competitionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('equipes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get equipe details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Equipe ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Equipe details with members' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Equipe not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "getEquipe", null);
__decorate([
    (0, common_1.Get)('equipes/:id/synergy'),
    (0, swagger_1.ApiOperation)({
        summary: 'AI Team Synergy Predictor — analyse team skill balance',
        description: 'Analyses team members\' specialties, skill tags, and GitHub repos to compute a radar chart of strengths/weaknesses across 6 axes (Frontend, Backend, AI/Data, Mobile, DevOps, Design). Returns a synergy score and strategic French advice.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Equipe ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Synergy analysis with radar data and advice' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Equipe not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "getTeamSynergy", null);
__decorate([
    (0, common_1.Post)('equipes/:id/mark-ready'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark team as ready (leader only, 4–6 members including leader)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Equipe ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team marked READY' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid member count or competition closed',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not the team leader' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "markGroupReady", null);
__decorate([
    (0, common_1.Delete)('equipes/:id/members/:userId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a member from the equipe (leader only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Equipe ID' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID of the member to remove' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member removed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not the team leader' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Equipe or Member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)('equipes/:id/invite'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a user to your equipe (leader only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Equipe ID' }),
    (0, swagger_1.ApiBody)({ type: equipe_dto_1.InviteToEquipeDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Invitation sent' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not the team leader' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, equipe_dto_1.InviteToEquipeDto, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "inviteToEquipe", null);
__decorate([
    (0, common_1.Get)('equipe-invitations/my-invitations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my pending team invitations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of pending invitations' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "getMyInvitations", null);
__decorate([
    (0, common_1.Post)('equipe-invitations/:id/accept'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Accept a team invitation' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invitation ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invitation accepted' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already in a team' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Post)('equipe-invitations/:id/decline'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Decline a team invitation' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invitation ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invitation declined' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "declineInvitation", null);
__decorate([
    (0, common_1.Post)('competitions/:id/join-solo'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Join competition without a team (solo queue)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Competition ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Added to solo waiting pool' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already registered' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "joinSolo", null);
__decorate([
    (0, common_1.Post)('equipes/auto-assign/:competitionId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Auto-assign solo users to random teams (Admin only)',
    }),
    (0, swagger_1.ApiParam)({ name: 'competitionId', description: 'Competition ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Solo users assigned to teams' }),
    __param(0, (0, common_1.Param)('competitionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EquipeController.prototype, "autoAssign", null);
exports.EquipeController = EquipeController = __decorate([
    (0, swagger_1.ApiTags)('Equipes'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [equipe_service_1.EquipeService])
], EquipeController);
//# sourceMappingURL=equipe.controller.js.map