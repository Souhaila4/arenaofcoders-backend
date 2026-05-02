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
exports.OrchestratorAgent = void 0;
const common_1 = require("@nestjs/common");
const anti_cheat_agent_1 = require("./anti-cheat.agent");
const code_judge_agent_1 = require("./code-judge.agent");
const code_sampler_agent_1 = require("./code-sampler.agent");
const evidence_builder_agent_1 = require("./evidence-builder.agent");
const product_judge_agent_1 = require("./product-judge.agent");
const repo_activity_agent_1 = require("./repo-activity.agent");
const repo_extractor_agent_1 = require("./repo-extractor.agent");
const report_agent_1 = require("./report.agent");
const scoring_agent_1 = require("./scoring.agent");
const structure_analysis_agent_1 = require("./structure-analysis.agent");
let OrchestratorAgent = class OrchestratorAgent {
    extractor;
    activity;
    structure;
    sampler;
    evidence;
    antiCheat;
    codeJudge;
    productJudge;
    scoring;
    report;
    constructor(extractor, activity, structure, sampler, evidence, antiCheat, codeJudge, productJudge, scoring, report) {
        this.extractor = extractor;
        this.activity = activity;
        this.structure = structure;
        this.sampler = sampler;
        this.evidence = evidence;
        this.antiCheat = antiCheat;
        this.codeJudge = codeJudge;
        this.productJudge = productJudge;
        this.scoring = scoring;
        this.report = report;
    }
    async evaluateRepo(url, context) {
        return this.execute({
            submissionId: context?.submissionId ?? 'n/a',
            teamName: context?.teamName ?? 'Unknown Team',
            githubUrl: url,
            competitionTopic: context?.competitionTopic,
            onProgress: context?.onProgress,
        });
    }
    async execute(input) {
        const repo = await this.extractor.execute(input.githubUrl);
        await this.emitProgress(input.onProgress, 10);
        const activity = await this.activity.execute(repo);
        await this.emitProgress(input.onProgress, 20);
        const structure = await this.structure.execute(repo);
        await this.emitProgress(input.onProgress, 30);
        const samples = await this.sampler.execute(repo);
        await this.emitProgress(input.onProgress, 40);
        const evidenceInput = {
            repo,
            activity,
            structure,
            samples,
            competitionTopic: input.competitionTopic,
        };
        const evidence = await this.evidence.execute(evidenceInput);
        await this.emitProgress(input.onProgress, 50);
        const antiCheat = await this.antiCheat.execute(evidence);
        await this.emitProgress(input.onProgress, 60);
        const codeScore = await this.codeJudge.execute(evidence);
        await this.emitProgress(input.onProgress, 70);
        const productScore = await this.productJudge.execute(evidence);
        await this.emitProgress(input.onProgress, 80);
        const scoringInput = {
            codeScore,
            productScore,
            antiCheat,
        };
        const scoring = await this.scoring.execute(scoringInput);
        await this.emitProgress(input.onProgress, 90);
        const reportInput = {
            teamName: input.teamName,
            finalScore: scoring.finalScore,
            evidence,
            antiCheatFlags: antiCheat.flags,
        };
        const report = await this.report.execute(reportInput);
        await this.emitProgress(input.onProgress, 100);
        return {
            finalScore: scoring.finalScore,
            evidence,
            antiCheat,
            codeScore,
            productScore,
            scoring,
            report,
        };
    }
    async emitProgress(onProgress, value) {
        if (onProgress) {
            await onProgress(value);
        }
    }
};
exports.OrchestratorAgent = OrchestratorAgent;
exports.OrchestratorAgent = OrchestratorAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [repo_extractor_agent_1.RepoExtractorAgent,
        repo_activity_agent_1.RepoActivityAgent,
        structure_analysis_agent_1.StructureAnalysisAgent,
        code_sampler_agent_1.CodeSamplerAgent,
        evidence_builder_agent_1.EvidenceBuilderAgent,
        anti_cheat_agent_1.AntiCheatAgent,
        code_judge_agent_1.CodeJudgeAgent,
        product_judge_agent_1.ProductJudgeAgent,
        scoring_agent_1.ScoringAgent,
        report_agent_1.ReportAgent])
], OrchestratorAgent);
//# sourceMappingURL=orchestrator.agent.js.map