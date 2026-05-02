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
const rxjs_1 = require("rxjs");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
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
    async createCompetition(createCompetitionDto, user) {
        return this.competitionService.createCompetition(createCompetitionDto, user);
    }
    async updateCompetition(competitionId, updateCompetitionDto, user) {
        return this.competitionService.updateCompetition(competitionId, updateCompetitionDto, user);
    }
    async changeCompetitionStatus(competitionId, changeStatusDto, user) {
        return this.competitionService.changeCompetitionStatus(competitionId, changeStatusDto, user);
    }
    async archiveCompetition(competitionId, user) {
        return this.competitionService.archiveCompetition(competitionId, user);
    }
    async findAllCompetitions(queryDto, user) {
        let creatorId;
        if (user && user.role === 'COMPANY') {
            creatorId = user.id;
        }
        return this.competitionService.findAllCompetitions(queryDto, creatorId);
    }
    async findCompetitionsForMe(queryDto, userId) {
        return this.competitionService.findCompetitionsForUser(userId, queryDto);
    }
    async getMyWins(userId) {
        return this.competitionService.getCompetitionsWonByUser(userId);
    }
    async getGlobalLeaderboard(limit) {
        const limitNum = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
        return this.competitionService.getGlobalLeaderboard(limitNum);
    }
    leaderboardLive() {
        return (0, rxjs_1.interval)(5000).pipe((0, rxjs_1.startWith)(0), (0, rxjs_1.switchMap)(() => this.competitionService.getGlobalLeaderboardWithMovements(50)), (0, rxjs_1.map)((data) => ({ data })));
    }
    async getHackathonIdeas() {
        return this.competitionService.getHackathonIdeas();
    }
    async findCompetition(competitionId, user) {
        return this.competitionService.findCompetitionById(competitionId, user);
    }
    async getCompetitionParticipants(competitionId) {
        return this.competitionService.getCompetitionParticipants(competitionId);
    }
    async getCompetitionLeaderboard(competitionId) {
        return this.competitionService.getLeaderboard(competitionId);
    }
    async getTopParticipants(competitionId, limit) {
        const limitNum = limit
            ? Math.min(Math.max(1, parseInt(limit, 10) || 5), 50)
            : undefined;
        return this.competitionService.getTopParticipants(competitionId, limitNum);
    }
    async getAllParticipantsForAdmin(competitionId) {
        return this.competitionService.getAllParticipantsForAdmin(competitionId);
    }
    async selectWinner(competitionId, participantId, userId) {
        return this.competitionService.selectWinner(competitionId, participantId, userId);
    }
    async joinCompetition(competitionId, userId, file) {
        return this.competitionService.joinCompetition(competitionId, userId, file);
    }
    async getMyParticipation(competitionId, userId) {
        return this.competitionService.getMyParticipation(competitionId, userId);
    }
    async getCompetitionCheckpoints(competitionId) {
        return this.competitionService.getCompetitionCheckpoints(competitionId);
    }
    async getMyCheckpointSubmissions(competitionId, userId) {
        return this.competitionService.getMyCheckpointSubmissions(competitionId, userId);
    }
    async submitCheckpoint(competitionId, checkpointId, userId, dto) {
        return this.competitionService.submitCheckpoint(competitionId, userId, checkpointId, dto);
    }
    async getCheckpointSubmissionsForReview(competitionId, user) {
        return this.competitionService.getCheckpointSubmissionsForReview(competitionId, user);
    }
    async reviewCheckpointSubmission(competitionId, submissionId, user, dto) {
        return this.competitionService.reviewCheckpointSubmission(competitionId, submissionId, user, dto);
    }
    async submitWork(competitionId, userId, dto) {
        return this.competitionService.submitWork(competitionId, userId, dto.githubUrl);
    }
};
exports.CompetitionController = CompetitionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new hackathon' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.CreateCompetitionDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Competition created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CreateCompetitionDto, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "createCompetition", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Update competition details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.UpdateCompetitionDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition updated' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Cannot update a running/completed competition',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.UpdateCompetitionDto, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "updateCompetition", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually advance competition lifecycle',
        description: `Allowed: SCHEDULED → OPEN_FOR_ENTRY → RUNNING → SUBMISSION_CLOSED → EVALUATING → COMPLETED → ARCHIVED`,
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.ChangeCompetitionStatusDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid status transition' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, competition_dto_1.ChangeCompetitionStatusDto, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "changeCompetitionStatus", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a completed competition' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition archived' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Competition is not COMPLETED yet' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "archiveCompetition", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'List all competitions' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: [
            'SCHEDULED',
            'OPEN_FOR_ENTRY',
            'RUNNING',
            'SUBMISSION_CLOSED',
            'EVALUATING',
            'COMPLETED',
            'ARCHIVED',
        ],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'difficulty',
        required: false,
        enum: ['EASY', 'MEDIUM', 'HARD'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'specialty',
        required: false,
        enum: [
            'FRONTEND',
            'BACKEND',
            'FULLSTACK',
            'MOBILE',
            'DATA',
            'BI',
            'CYBERSECURITY',
            'DESIGN',
            'DEVOPS',
        ],
    }),
    (0, swagger_1.ApiQuery)({ name: 'onlyActive', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of competitions' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CompetitionQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findAllCompetitions", null);
__decorate([
    (0, common_1.Get)('for-me'),
    (0, swagger_1.ApiOperation)({
        summary: 'List hackathons for the current user',
        description: 'Returns competitions relevant to the logged-in user based on their mainSpecialty.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of competitions for the user',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [competition_dto_1.CompetitionQueryDto, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findCompetitionsForMe", null);
__decorate([
    (0, common_1.Get)('my-wins'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get hackathons won by the current user',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getMyWins", null);
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
    (0, common_1.Sse)('leaderboard/live'),
    (0, swagger_1.ApiOperation)({
        summary: 'Live leaderboard via SSE — streams rank changes every 5s',
        description: 'Server-Sent Events endpoint. Returns a continuous stream of leaderboard snapshots with movement metadata (up/down/same/new).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SSE stream of leaderboard updates' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], CompetitionController.prototype, "leaderboardLive", null);
__decorate([
    (0, common_1.Get)('hackathon-ideas'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Get AI-generated hackathon ideas (Admin only)',
        description: 'Calls the n8n webhook to generate hackathon ideas. Use when creating a new hackathon.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of ideas with title, score, description, target_market, feasibility',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Webhook unavailable or returned invalid data',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — Admin role required' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getHackathonIdeas", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single competition by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Competition details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "findCompetition", null);
__decorate([
    (0, common_1.Get)(':id/participants'),
    (0, swagger_1.ApiOperation)({ summary: 'Get participant list for a competition' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of participants with user profiles',
    }),
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
    (0, common_1.Get)(':id/top-participants'),
    (0, swagger_1.ApiOperation)({
        summary: 'Top participants by score (preselected)',
        description: 'Returns the top N submitted participants for this hackathon, ordered by pipeline score. Uses competition topN config.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 5 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Top participants with scores and AI reports',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getTopParticipants", null);
__decorate([
    (0, common_1.Get)(':id/participants/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'All participants (admin/company)',
        description: 'Returns ALL participants including disqualified ones with their status, scores, and AI reports.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All participants with detailed info',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getAllParticipantsForAdmin", null);
__decorate([
    (0, common_1.Post)(':id/winner/:participantId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({
        summary: 'Select a winner',
        description: 'Admin or Company selects a winner from the hackathon participants. The winner receives a notification with company contact info.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiParam)({
        name: 'participantId',
        description: 'MongoDB ObjectId of the participant to select as winner',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Winner selected successfully' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Competition or participant not found',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not authorized to select winner' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('participantId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "selectWinner", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.USER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('hackathonFaceImage', {
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
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Join a competition and provide face image (Anti-Cheat)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['hackathonFaceImage'],
            properties: {
                hackathonFaceImage: {
                    type: 'string',
                    format: 'binary',
                    description: 'Personal Image for Facial Verification',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Successfully joined the competition',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Competition not OPEN / Missing image',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already joined this competition' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "joinCompetition", null);
__decorate([
    (0, common_1.Get)(':id/my-participation'),
    (0, swagger_1.ApiOperation)({
        summary: 'Check your own participation status in a competition',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Your participation record' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'You are not registered in this competition',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getMyParticipation", null);
__decorate([
    (0, common_1.Get)(':id/checkpoints'),
    (0, swagger_1.ApiOperation)({ summary: 'List checkpoints for a competition' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of checkpoints ordered by execution order',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getCompetitionCheckpoints", null);
__decorate([
    (0, common_1.Get)(':id/my-checkpoint-submissions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get your checkpoint submissions for a competition',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Your checkpoint submissions with checkpoint details',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Competition not found or not registered',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getMyCheckpointSubmissions", null);
__decorate([
    (0, common_1.Patch)(':id/checkpoints/:checkpointId/submit'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ checkpoint: {} }),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit a checkpoint (proof URL and optional notes)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiParam)({
        name: 'checkpointId',
        description: 'MongoDB ObjectId of the checkpoint',
    }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.SubmitCheckpointDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Checkpoint submitted' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Already submitted / disqualified / due date passed',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not a participant or checkpoint not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('checkpointId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, competition_dto_1.SubmitCheckpointDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "submitCheckpoint", null);
__decorate([
    (0, common_1.Get)(':id/checkpoint-submissions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'List all checkpoint submissions for review' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All submissions with participant and checkpoint info',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Competition not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "getCheckpointSubmissionsForReview", null);
__decorate([
    (0, common_1.Patch)(':id/checkpoint-submissions/:submissionId/review'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a checkpoint submission' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiParam)({
        name: 'submissionId',
        description: 'MongoDB ObjectId of the submission',
    }),
    (0, swagger_1.ApiBody)({ type: competition_dto_1.ReviewCheckpointSubmissionDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Submission reviewed' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Only SUBMITTED checkpoints can be reviewed',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Submission not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('submissionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, competition_dto_1.ReviewCheckpointSubmissionDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "reviewCheckpointSubmission", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ submit: {} }),
    (0, swagger_1.ApiOperation)({ summary: 'Submit your GitHub repo link for a competition' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MongoDB ObjectId of the competition' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Submission result (accepted or disqualified)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Already submitted / disqualified / competition not running',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not a participant' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many submissions (rate limit)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, competition_dto_1.SubmitWorkDto]),
    __metadata("design:returntype", Promise)
], CompetitionController.prototype, "submitWork", null);
exports.CompetitionController = CompetitionController = __decorate([
    (0, swagger_1.ApiTags)('🏆 Competitions'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('competitions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [competition_service_1.CompetitionService])
], CompetitionController);
//# sourceMappingURL=competition.controller.js.map