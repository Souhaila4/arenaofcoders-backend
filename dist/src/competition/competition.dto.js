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
exports.CompetitionQueryDto = exports.JoinCompetitionDto = exports.ChangeCompetitionStatusDto = exports.UpdateCompetitionDto = exports.CreateCompetitionDto = void 0;
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateCompetitionDto {
    title;
    description;
    difficulty;
    specialty;
    startDate;
    endDate;
    rewardPool;
    maxParticipants;
}
exports.CreateCompetitionDto = CreateCompetitionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Title of the hackathon',
        example: 'AI Challenge 2026',
        minLength: 3,
        maxLength: 120,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full description / challenge brief for participants',
        example: 'Build an AI-powered application that solves a real-world problem. Your solution will be judged on creativity, technical execution, and impact.',
        minLength: 10,
        maxLength: 5000,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Difficulty level of the competition',
        enum: client_1.CompetitionDifficulty,
        example: client_1.CompetitionDifficulty.MEDIUM,
    }),
    (0, class_validator_1.IsEnum)(client_1.CompetitionDifficulty, {
        message: 'difficulty must be one of: EASY, MEDIUM, HARD',
    }),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Specialty targeted by this hackathon (users with matching mainSpecialty get notified)',
        enum: client_1.Specialty,
        example: client_1.Specialty.FRONTEND,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Specialty, {
        message: 'specialty must be one of: FRONTEND, BACKEND, FULLSTACK, MOBILE, DATA, BI, CYBERSECURITY, DESIGN, DEVOPS',
    }),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "specialty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO 8601 date-time when registration opens / competition starts (must be in future)',
        example: '2026-03-01T09:00:00.000Z',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'startDate must be a valid ISO date string' }),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO 8601 date-time when submissions close (must be after startDate)',
        example: '2026-03-03T18:00:00.000Z',
    }),
    (0, class_validator_1.IsDateString)({}, { message: 'endDate must be a valid ISO date string' }),
    __metadata("design:type", String)
], CreateCompetitionDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Total prize pool (in your platform currency)',
        example: 5000,
        default: 0,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCompetitionDto.prototype, "rewardPool", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Maximum number of participants allowed (leave empty for unlimited)',
        example: 100,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateCompetitionDto.prototype, "maxParticipants", void 0);
class UpdateCompetitionDto extends (0, mapped_types_1.PartialType)(CreateCompetitionDto) {
}
exports.UpdateCompetitionDto = UpdateCompetitionDto;
class ChangeCompetitionStatusDto {
    status;
}
exports.ChangeCompetitionStatusDto = ChangeCompetitionStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New lifecycle status — must follow the allowed transition chain',
        enum: client_1.CompetitionStatus,
        example: client_1.CompetitionStatus.OPEN_FOR_ENTRY,
    }),
    (0, class_validator_1.IsEnum)(client_1.CompetitionStatus, {
        message: 'status must be one of: SCHEDULED, OPEN_FOR_ENTRY, RUNNING, SUBMISSION_CLOSED, EVALUATING, COMPLETED, ARCHIVED',
    }),
    __metadata("design:type", String)
], ChangeCompetitionStatusDto.prototype, "status", void 0);
class JoinCompetitionDto {
}
exports.JoinCompetitionDto = JoinCompetitionDto;
class CompetitionQueryDto {
    status;
    difficulty;
    specialty;
    onlyActive;
    page = 1;
    limit = 10;
}
exports.CompetitionQueryDto = CompetitionQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by competition status',
        enum: client_1.CompetitionStatus,
        example: client_1.CompetitionStatus.OPEN_FOR_ENTRY,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CompetitionStatus),
    __metadata("design:type", String)
], CompetitionQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by difficulty',
        enum: client_1.CompetitionDifficulty,
        example: client_1.CompetitionDifficulty.HARD,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CompetitionDifficulty),
    __metadata("design:type", String)
], CompetitionQueryDto.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by specialty (e.g. FRONTEND, BACKEND)',
        enum: client_1.Specialty,
        example: client_1.Specialty.FRONTEND,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Specialty),
    __metadata("design:type", String)
], CompetitionQueryDto.prototype, "specialty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Return only active competitions',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], CompetitionQueryDto.prototype, "onlyActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number (1-based)',
        example: 1,
        default: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CompetitionQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Results per page',
        example: 10,
        default: 10,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CompetitionQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=competition.dto.js.map