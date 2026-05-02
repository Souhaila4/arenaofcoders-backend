"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringAgent = void 0;
const common_1 = require("@nestjs/common");
let ScoringAgent = class ScoringAgent {
    async execute(input) {
        const complexityWeighted = input.codeScore.complexity * 0.3;
        const innovationWeighted = input.productScore.innovation * 0.25;
        const impactWeighted = input.productScore.impact * 0.2;
        const qualityWeighted = input.codeScore.codeQuality * 0.25;
        const rawBeforePenalty = complexityWeighted +
            innovationWeighted +
            impactWeighted +
            qualityWeighted;
        const final = Math.max(0, Math.min(100, Number((rawBeforePenalty * 10).toFixed(2))));
        return {
            finalScore: final,
            breakdown: {
                complexityWeighted,
                innovationWeighted,
                impactWeighted,
                qualityWeighted,
                rawBeforePenalty,
                penalty: input.antiCheat.penalty,
                final,
            },
        };
    }
};
exports.ScoringAgent = ScoringAgent;
exports.ScoringAgent = ScoringAgent = __decorate([
    (0, common_1.Injectable)()
], ScoringAgent);
//# sourceMappingURL=scoring.agent.js.map