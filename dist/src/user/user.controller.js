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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("./user.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const company_request_dto_1 = require("./dto/company-request.dto");
const update_wallet_dto_1 = require("./dto/update-wallet.dto");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async getLeaderboard() {
        return this.userService.getLeaderboard();
    }
    async getPublicProfile(id) {
        return this.userService.findById(id);
    }
    async requestCompanyRole(userId, dto) {
        return this.userService.requestCompanyRole(userId, dto);
    }
    async updateWallet(userId, dto) {
        return this.userService.updateWallet(userId, dto.hederaAccountId);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Classement public des utilisateurs par XP' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des utilisateurs classés par XP',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtenir un profil utilisateur public' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Le profil utilisateur' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getPublicProfile", null);
__decorate([
    (0, common_1.Post)('request-company-role'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Demander le rôle entreprise (Company)' }),
    (0, swagger_1.ApiBody)({ type: company_request_dto_1.RequestCompanyRoleDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Demande envoyée' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Vous avez déjà une demande en cours',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, company_request_dto_1.RequestCompanyRoleDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "requestCompanyRole", null);
__decorate([
    (0, common_1.Patch)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Register your Hedera wallet',
        description: 'Save your Hedera account ID so that minted certificate NFTs are automatically transferred to your wallet.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Wallet registered',
        schema: { example: { id: '...', hederaAccountId: '0.0.123456' } },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid Hedera account ID format' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_wallet_dto_1.UpdateWalletDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateWallet", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('user'),
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map