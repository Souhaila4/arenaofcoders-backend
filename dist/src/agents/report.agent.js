"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportAgent = void 0;
const common_1 = require("@nestjs/common");
let ReportAgent = class ReportAgent {
    async execute(input) {
        const highlights = [];
        const warnings = [];
        if (input.evidence.structure.hasBackend)
            highlights.push('Backend layer detected');
        if (input.evidence.structure.hasFrontend)
            highlights.push('Frontend layer detected');
        if (input.evidence.activity.contributors > 1) {
            highlights.push('Multiple contributors detected');
        }
        if (input.evidence.structure.hasTests) {
            highlights.push('Automated tests detected');
        }
        else {
            warnings.push('No test coverage detected');
        }
        if (input.evidence.activity.commits < 3) {
            warnings.push('Limited commit history');
        }
        warnings.push(...input.antiCheatFlags);
        return {
            title: `${input.teamName} - Score ${input.finalScore.toFixed(2)}`,
            summary: `Repository ${input.evidence.repo.owner}/${input.evidence.repo.repo} evaluated with evidence-based scoring.`,
            highlights: [...new Set(highlights)],
            warnings: [...new Set(warnings)],
            score: input.finalScore,
        };
    }
};
exports.ReportAgent = ReportAgent;
exports.ReportAgent = ReportAgent = __decorate([
    (0, common_1.Injectable)()
], ReportAgent);
//# sourceMappingURL=report.agent.js.map