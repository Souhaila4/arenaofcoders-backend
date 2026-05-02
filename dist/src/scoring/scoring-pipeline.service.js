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
var ScoringPipelineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringPipelineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const orchestrator_agent_1 = require("../agents/orchestrator.agent");
let ScoringPipelineService = ScoringPipelineService_1 = class ScoringPipelineService {
    prisma;
    orchestratorAgent;
    logger = new common_1.Logger(ScoringPipelineService_1.name);
    constructor(prisma, orchestratorAgent) {
        this.prisma = prisma;
        this.orchestratorAgent = orchestratorAgent;
    }
    async run(participantId, githubUrl) {
        try {
            const participant = await this.prisma.competitionParticipant.findUnique({
                where: { id: participantId },
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    competition: { select: { description: true } },
                },
            });
            if (!participant?.user) {
                this.logger.warn(`Participant ${participantId} or user not found; skipping pipeline`);
                return;
            }
            const teamName = [participant.user.firstName, participant.user.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() || 'Unknown';
            const result = await this.orchestratorAgent.evaluateRepo(githubUrl, {
                submissionId: participantId,
                teamName,
                competitionTopic: participant.competition?.description ?? undefined,
            });
            await this.prisma.competitionParticipant.update({
                where: { id: participantId },
                data: {
                    score: result.finalScore,
                    scoringReport: JSON.parse(JSON.stringify({
                        finalScore: result.finalScore,
                        codeJudge: {
                            complexity: result.codeScore.complexity,
                            codeQuality: result.codeScore.codeQuality,
                            architecture: result.codeScore.architecture,
                            reasoning: result.codeScore.reasoning,
                        },
                        productJudge: {
                            innovation: result.productScore.innovation,
                            impact: result.productScore.impact,
                            usability: result.productScore.usability,
                            reasoning: result.productScore.reasoning,
                        },
                        antiCheat: result.antiCheat,
                        report: {
                            title: result.report.title,
                            summary: result.report.summary,
                            highlights: result.report.highlights,
                            warnings: result.report.warnings,
                        },
                        breakdown: result.scoring.breakdown,
                    })),
                },
            });
            this.logger.log(`Pipeline score for participant ${participantId}: ${result.finalScore}`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Scoring pipeline failed for participant ${participantId}: ${message}`, err instanceof Error ? err.stack : undefined);
        }
    }
};
exports.ScoringPipelineService = ScoringPipelineService;
exports.ScoringPipelineService = ScoringPipelineService = ScoringPipelineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        orchestrator_agent_1.OrchestratorAgent])
], ScoringPipelineService);
//# sourceMappingURL=scoring-pipeline.service.js.map