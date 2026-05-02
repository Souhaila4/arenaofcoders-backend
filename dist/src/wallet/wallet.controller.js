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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_guard_1 = require("../auth/guards/admin.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const wallet_service_1 = require("./wallet.service");
const mint_coins_dto_1 = require("./dto/mint-coins.dto");
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getMyWallet(userId) {
        return this.walletService.getWalletInfo(userId);
    }
    async mintCoins(dto) {
        return this.walletService.adminMintToCompany(dto.userId, dto.amount);
    }
    async getCompetitionTransactions(competitionId) {
        return this.walletService.getTransactionHistory(competitionId);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my Arena Coin wallet info',
        description: 'Returns current off-chain balance, Hedera account ID, and last 50 transactions.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: {
            example: {
                userId: '...',
                walletBalance: 500,
                hederaAccountId: '0.0.123456',
                tokenId: '0.0.987654',
                hashScanUrl: 'https://hashscan.io/testnet/account/0.0.123456',
                transactions: [],
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Post)('admin/mint'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Admin: Mint Arena Coins to a company wallet',
        description: "Mints new Arena Coin tokens and transfers them to the company's Hedera wallet. " +
            'The company must have already registered their hederaAccountId via PATCH /user/wallet.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        schema: {
            example: {
                success: true,
                userId: '...',
                recipientAccountId: '0.0.123456',
                amount: 500,
                newBalance: 1000,
                transactionLogId: '...',
                hederaTransactionId: '0.0.7359554@1743295200.123456789',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Company has no Hedera wallet registered or bad request',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mint_coins_dto_1.MintCoinsDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "mintCoins", null);
__decorate([
    (0, common_1.Get)('competition/:competitionId/transactions'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Admin: Get Arena Coin transactions for a hackathon',
        description: 'Lists all escrow, reward, and refund transactions linked to a competition.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'competitionId',
        description: 'MongoDB ObjectId of the competition',
    }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('competitionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getCompetitionTransactions", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('wallet'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map