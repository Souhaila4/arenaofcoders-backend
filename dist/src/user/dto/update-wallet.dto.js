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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWalletDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateWalletDto {
    hederaAccountId;
}
exports.UpdateWalletDto = UpdateWalletDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '0.0.123456',
        description: 'Your Hedera account ID (e.g. from HashPack or portal.hedera.com)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^0\.0\.\d+$/, {
        message: 'hederaAccountId must be a valid Hedera account ID, e.g. 0.0.123456',
    }),
    __metadata("design:type", String)
], UpdateWalletDto.prototype, "hederaAccountId", void 0);
//# sourceMappingURL=update-wallet.dto.js.map