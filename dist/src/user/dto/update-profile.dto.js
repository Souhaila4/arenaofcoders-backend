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
exports.UpdateProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class UpdateProfileDto {
    firstName;
    lastName;
    avatarUrl;
    mainSpecialty;
    skillTags;
    githubUrl;
    linkedinUrl;
    linkedinPosts;
    githubRepos;
    socialDataLastUpdate;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Jane', description: 'First name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'First name must not be empty' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Doe', description: 'Last name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: 'Last name must not be empty' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'https://example.com/avatar.png',
        description: 'Profile picture URL',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.Specialty,
        description: 'Primary specialty (e.g. FRONTEND, BACKEND)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Specialty),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "mainSpecialty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: ['nestjs', 'react', 'typescript'],
        description: 'Skill tags',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(50, { each: true }),
    (0, class_validator_1.ArrayMaxSize)(30),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "skillTags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://github.com/username', description: 'Lien profil GitHub' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "githubUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://www.linkedin.com/in/username/', description: 'Lien profil LinkedIn' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "linkedinUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '3 derniers posts LinkedIn (scraped via Apify)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "linkedinPosts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '3 derniers repos GitHub avec README (scraped via Apify)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "githubRepos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dernière mise à jour des données sociales' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateProfileDto.prototype, "socialDataLastUpdate", void 0);
//# sourceMappingURL=update-profile.dto.js.map