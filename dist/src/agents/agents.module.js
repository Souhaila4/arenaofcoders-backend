"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsModule = void 0;
const common_1 = require("@nestjs/common");
const anti_cheat_agent_1 = require("./anti-cheat.agent");
const code_judge_agent_1 = require("./code-judge.agent");
const code_sampler_agent_1 = require("./code-sampler.agent");
const evidence_builder_agent_1 = require("./evidence-builder.agent");
const github_api_service_1 = require("./github-api.service");
const groq_ai_service_1 = require("./groq-ai.service");
const orchestrator_agent_1 = require("./orchestrator.agent");
const product_judge_agent_1 = require("./product-judge.agent");
const repo_activity_agent_1 = require("./repo-activity.agent");
const repo_extractor_agent_1 = require("./repo-extractor.agent");
const report_agent_1 = require("./report.agent");
const scoring_agent_1 = require("./scoring.agent");
const structure_analysis_agent_1 = require("./structure-analysis.agent");
let AgentsModule = class AgentsModule {
};
exports.AgentsModule = AgentsModule;
exports.AgentsModule = AgentsModule = __decorate([
    (0, common_1.Module)({
        providers: [
            orchestrator_agent_1.OrchestratorAgent,
            repo_extractor_agent_1.RepoExtractorAgent,
            repo_activity_agent_1.RepoActivityAgent,
            structure_analysis_agent_1.StructureAnalysisAgent,
            code_sampler_agent_1.CodeSamplerAgent,
            evidence_builder_agent_1.EvidenceBuilderAgent,
            github_api_service_1.GitHubApiService,
            groq_ai_service_1.GroqAiService,
            code_judge_agent_1.CodeJudgeAgent,
            product_judge_agent_1.ProductJudgeAgent,
            anti_cheat_agent_1.AntiCheatAgent,
            scoring_agent_1.ScoringAgent,
            report_agent_1.ReportAgent,
        ],
        exports: [orchestrator_agent_1.OrchestratorAgent, groq_ai_service_1.GroqAiService],
    })
], AgentsModule);
//# sourceMappingURL=agents.module.js.map