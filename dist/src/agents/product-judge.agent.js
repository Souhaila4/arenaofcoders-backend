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
exports.ProductJudgeAgent = void 0;
const common_1 = require("@nestjs/common");
const groq_ai_service_1 = require("./groq-ai.service");
let ProductJudgeAgent = class ProductJudgeAgent {
    groq;
    constructor(groq) {
        this.groq = groq;
    }
    async execute(evidence) {
        if (!this.groq.hasApiKey()) {
            return this.fallbackScore(evidence);
        }
        try {
            const result = await this.groq.askForJson('You are a strict product judge. Evaluate only factual evidence. Return JSON only.', `Evaluate the product quality from this evidence:\n${JSON.stringify(evidence)}\n\n` +
                (evidence.competitionTopic
                    ? `IMPORTANT HACKATHON TOPIC: "${evidence.competitionTopic}".\nYou MUST severely penalize the innovation and impact scores (give 0 or 1) if the product is off-topic or does not solve the hackathon's subject. Mention this in your reasoning.\n\n`
                    : '') +
                `Return JSON with: innovation (0-10), impact (0-10), usability (0-10), reasoning (string).`);
            return {
                innovation: this.clamp(result.innovation),
                impact: this.clamp(result.impact),
                usability: this.clamp(result.usability),
                reasoning: (result.reasoning ?? 'No reasoning provided').slice(0, 1200),
            };
        }
        catch {
            return this.fallbackScore(evidence);
        }
    }
    fallbackScore(evidence) {
        const innovation = evidence.readmeSummary === 'README not found' ? 3 : 6;
        const impact = evidence.structure.hasFrontend || evidence.structure.hasBackend ? 6 : 4;
        const usability = evidence.structure.hasFrontend ? 6 : 4;
        return {
            innovation,
            impact,
            usability,
            reasoning: 'Fallback heuristic scoring used because AI provider is unavailable.',
        };
    }
    clamp(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            return 0;
        }
        return Math.max(0, Math.min(10, Math.round(value)));
    }
};
exports.ProductJudgeAgent = ProductJudgeAgent;
exports.ProductJudgeAgent = ProductJudgeAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_ai_service_1.GroqAiService])
], ProductJudgeAgent);
//# sourceMappingURL=product-judge.agent.js.map