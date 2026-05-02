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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_guard_1 = require("../auth/guards/admin.guard");
const admin_service_1 = require("./admin.service");
const review_company_request_dto_1 = require("./dto/review-company-request.dto");
const send_preselected_email_dto_1 = require("./dto/send-preselected-email.dto");
const competition_service_1 = require("../competition/competition.service");
let AdminController = class AdminController {
    adminService;
    competitionService;
    constructor(adminService, competitionService) {
        this.adminService = adminService;
        this.competitionService = competitionService;
    }
    async updateUserRole(userId, role) {
        return this.adminService.updateUserRole(userId, role);
    }
    async getCompanyRequests(status) {
        return this.adminService.getCompanyRequests(status);
    }
    async reviewCompanyRequest(requestId, dto) {
        return this.adminService.reviewCompanyRequest(requestId, dto.status);
    }
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }
    async getRecentUsers(limit) {
        const n = limit ? Math.min(parseInt(limit, 10) || 10, 50) : 10;
        return this.adminService.getRecentUsers(n);
    }
    async getUsers(limit, offset, search, role) {
        return this.adminService.getUsers({
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
            search,
            role,
        });
    }
    async sendPreselectedEmail(competitionId, dto) {
        return this.competitionService.sendEmailToPreselectedParticipants(competitionId, dto.subject, dto.htmlBody, dto.limit);
    }
    async triggerN8nWebhookTest() {
        return this.adminService.triggerN8nWebhookTest();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, swagger_1.ApiOperation)({ summary: "Changer le rôle d'un utilisateur (Admin only)" }),
    (0, swagger_1.ApiParam)({ name: 'id', description: "ID de l'utilisateur" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                role: { type: 'string', enum: ['USER', 'ADMIN', 'COMPANY'] },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Rôle de l'utilisateur mis à jour" }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Get)('company-requests'),
    (0, swagger_1.ApiOperation)({
        summary: 'Liste les demandes du rôle entreprise (Admin only)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
    }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCompanyRequests", null);
__decorate([
    (0, common_1.Patch)('company-requests/:id/review'),
    (0, swagger_1.ApiOperation)({
        summary: 'Accepter ou refuser une demande de rôle entreprise',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID de la demande' }),
    (0, swagger_1.ApiBody)({ type: review_company_request_dto_1.ReviewCompanyRequestDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_company_request_dto_1.ReviewCompanyRequestDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reviewCompanyRequest", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Statistiques plateforme (réservé admin)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Stats utilisateurs, spécialités, etc.',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin only' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('users/recent'),
    (0, swagger_1.ApiOperation)({ summary: 'Derniers utilisateurs inscrits' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Max 50',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Liste des derniers utilisateurs' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRecentUsers", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Liste utilisateurs avec recherche et pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Email, prénom ou nom',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'role',
        required: false,
        enum: client_1.UserRole,
        description: 'Filtrer par rôle',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'users, total, limit, offset' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('competitions/:competitionId/preselected/send-email'),
    (0, swagger_1.ApiOperation)({
        summary: 'Envoyer un e-mail aux participants présélectionnés (top score) d’un hackathon',
        description: 'Cible les N meilleurs participants ayant soumis et un score (comme GET /competitions/:id/top-participants). Variables dans le sujet et le corps HTML : {{firstName}}, {{competitionTitle}}.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'competitionId',
        description: 'ID MongoDB de la compétition',
    }),
    (0, swagger_1.ApiBody)({ type: send_preselected_email_dto_1.SendPreselectedEmailDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'sent, total, failedEmails',
    }),
    __param(0, (0, common_1.Param)('competitionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_preselected_email_dto_1.SendPreselectedEmailDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendPreselectedEmail", null);
__decorate([
    (0, common_1.Post)('n8n/webhook-test'),
    (0, swagger_1.ApiOperation)({
        summary: 'Déclencher le webhook n8n (test) — proxy pour éviter CORS',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'success: true si le workflow a répondu',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'success: false + message en cas d’erreur ou timeout',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "triggerN8nWebhookTest", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        competition_service_1.CompetitionService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map