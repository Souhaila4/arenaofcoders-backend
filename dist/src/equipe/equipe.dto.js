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
exports.SearchUsersDto = exports.InviteToEquipeDto = exports.CreateEquipeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateEquipeDto {
    name;
    competitionId;
}
exports.CreateEquipeDto = CreateEquipeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Team name',
        example: 'Les Hackers',
        minLength: 2,
        maxLength: 60,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateEquipeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Competition ID to create the team for',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEquipeDto.prototype, "competitionId", void 0);
class InviteToEquipeDto {
    email;
}
exports.InviteToEquipeDto = InviteToEquipeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email of the user to invite',
        example: 'teammate@example.com',
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InviteToEquipeDto.prototype, "email", void 0);
class SearchUsersDto {
    query;
    competitionId;
}
exports.SearchUsersDto = SearchUsersDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search query (name or email)',
        example: 'john',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Competition ID to exclude already-teamed users',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "competitionId", void 0);
//# sourceMappingURL=equipe.dto.js.map