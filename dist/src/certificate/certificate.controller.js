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
exports.CertificateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const certificate_service_1 = require("./certificate.service");
const certificate_dto_1 = require("./certificate.dto");
let CertificateController = class CertificateController {
    certificateService;
    constructor(certificateService) {
        this.certificateService = certificateService;
    }
    async generate(dto, userId) {
        return this.certificateService.generateCertificateNFT(userId, dto.hackathonName);
    }
};
exports.CertificateController = CertificateController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate a certificate NFT',
        description: 'Generates a personalized certificate image, uploads it to IPFS via Pinata, and mints an NFT on Hedera.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'NFT minted successfully',
        schema: {
            example: {
                certificateId: '6612abc...',
                user: { firstName: 'Alice', lastName: 'Martin' },
                imageIpfsUrl: 'ipfs://QmXxx...',
                metadataIpfsUrl: 'ipfs://QmYyy...',
                tokenId: '0.0.123456',
                serial: 1,
                transferredToWallet: true,
                recipientAccountId: '0.0.789012',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [certificate_dto_1.GenerateCertificateDto, String]),
    __metadata("design:returntype", Promise)
], CertificateController.prototype, "generate", null);
exports.CertificateController = CertificateController = __decorate([
    (0, swagger_1.ApiTags)('certificate'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('certificate'),
    __metadata("design:paramtypes", [certificate_service_1.CertificateService])
], CertificateController);
//# sourceMappingURL=certificate.controller.js.map