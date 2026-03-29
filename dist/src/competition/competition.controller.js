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
exports.CompetitionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const competition_service_1 = require("./competition.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const competition_dto_1 = require("./competition.dto");
let CompetitionController = class CompetitionController {
    competitionService;
    constructor(competitionService) {
        this.competitionService = competitionService;
    }
    async createCompetition(createCompetitionDto, adminUserId) {
        return this.competitionService.createCompetition(createCompetitionDto, adminUserId);
    }
    async updateCompetition(competitionId, updateCompetitionDto, adminUserId) {
        return this.competitionService.updateCompetition(competitionId, updateCompetitionDto, adminUserId);
    }
    async changeCompetitionStatus(competitionId, changeStatusDto, adminUserId) {
        return this.competitionService.changeCompetitionStatus(competitionId, changeStatusDto, adminUserId);
    }
    async archiveCompetition(competitionId) {
        return this.competitionService.archiveCompetition(competitionId);
    }
    async findAllCompetitions(queryDto) {
        return this.competitionService.findAllCompetitions(queryDto);
    }
    async findCompetitionsForMe(queryDto, userId) {
        return this.competitionService.findCompetitionsForUser(userId, queryDto);
    }
    async getGlobalLeaderboard(limit) {
        const limitNum = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
        return this.competitionService.getGlobalLeaderboard(limitNum);
    }
    async findCompetition(competitionId) {
        return this.competitionService.findCompetitionById(competitionId);
    }
    async getCompetitionParticipants(competitionId) {
        return this.competitionService.getCompetitionParticipants(competitionId);
    }
    async getCompetitionLeaderboard(competitionId) {
        return this.competitionService.getLeaderboard(competitionId);
    }
    async joinCompetition(competitionId, userId, _dto) {
        return this.competitionService.joinCompetition(competitionId, userId);
    }
    async getMyParticipation(competitionId, userId) {
        return this.competitionService.getMyParticipation(competitionId, userId);
    }
};
exports.CompetitionController = CompetitionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new hackathon (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.CreateCompetitionDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Competition created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — Admin role required' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CreateCompetitionDto, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "createCompetition", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update competition details (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.UpdateCompetitionDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot update a running/completed competition' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.UpdateCompetitionDto, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "updateCompetition", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually advance competition lifecycle (Admin only)',
        description: `Allowed: SCHEDULED → OPEN_FOR_ENTRY → RUNNING → SUBMISSION_CLOSED → EVALUATING → COMPLETED → ARCHIVED`,
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.ChangeCompetitionStatusDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid status transition' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.ChangeCompetitionStatusDto, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "changeCompetitionStatus", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a completed competition (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition archived' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Competition is not COMPLETED yet' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "archiveCompetition", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all competitions' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['SCHEDULED', 'OPEN_FOR_ENTRY', 'RUNNING', 'SUBMISSION_CLOSED', 'EVALUATING', 'COMPLETED', 'ARCHIVED'] }),
    (0, swagger_1.ApiQuery)({ name: 'difficulty', required: false, enum: ['EASY', 'MEDIUM', 'HARD'] }),
    (0, swagger_1.ApiQuery)({ name: 'specialty', required: false, enum: ['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'DATA', 'BI', 'CYBERSECURITY', 'DESIGN', 'DEVOPS'] }),
    (0, swagger_1.ApiQuery)({ name: 'onlyActive', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of competitions' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CompetitionQueryDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findAllCompetitions", null);
__decorate([
    (0, common_1.Get)('for-me'),
    (0, swagger_1.ApiOperation)({
        summary: 'List hackathons for the current user',
        description: "Returns competitions relevant to the logged-in user based on their mainSpecialty.",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of competitions for the user' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CompetitionQueryDto, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findCompetitionsForMe", null);
__decorate([
    (0, common_1.Get)('leaderboard/global'),
    (0, swagger_1.ApiOperation)({
        summary: 'Global leaderboard — top users by wins',
        description: 'Returns the top users ranked by totalWins then totalChallenges.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Global leaderboard' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getGlobalLeaderboard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single competition by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findCompetition", null);
__decorate([
    (0, common_1.Get)(':id/participants'),
    (0, swagger_1.ApiOperation)({ summary: 'Get participant list for a competition' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of participants with user profiles' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getCompetitionParticipants", null);
__decorate([
    (0, common_1.Get)(':id/leaderboard'),
    (0, swagger_1.ApiOperation)({
        summary: 'Leaderboard for a specific competition',
        description: 'Returns ranked participants ordered by status (SUBMITTED first) then join date.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition leaderboard' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getCompetitionLeaderboard", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Join a competition (Talent / USER role)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.JoinCompetitionDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Successfully joined the competition' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Competition not OPEN_FOR_ENTRY or capacity reached' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already joined this competition' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, competition_dto_1.JoinCompetitionDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "joinCompetition", null);
__decorate([
    (0, common_1.Get)(':id/my-participation'),
    (0, swagger_1.ApiOperation)({ summary: 'Check your own participation status in a competition' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Your participation record' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'You are not registered in this competition' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getMyParticipation", null);
exports.CompetitionController = CompetitionController = __decorate([
    (0, swagger_1.ApiTags)('🏆 Competitions'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('competitions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [competition_service_1.CompetitionService])
], CompetitionController);
//# sourceMappingURL=competition.controller.js.map