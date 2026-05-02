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
exports.CodeJudgeAgent = void 0;
const common_1 = require("@nestjs/common");
const groq_ai_service_1 = require("./groq-ai.service");
let CodeJudgeAgent = class CodeJudgeAgent {
    groq;
    constructor(groq) {
        this.groq = groq;
    }
    async execute(evidence) {
        if (!this.groq.hasApiKey()) {
            return this.fallbackScore(evidence);
        }
        try {
            const result = await this.groq.askForJson('You are a strict senior software judge. Evaluate only proven evidence from the actual CODE SAMPLES, not just the README. Return JSON only.', `Evaluate the technical quality from this evidence:\n${JSON.stringify(evidence)}\n\n` +
                (evidence.competitionTopic
                    ? `CRITICAL HACKATHON TOPIC: "${evidence.competitionTopic}".\nYou MUST analyze the actual CODE SAMPLES (not the README) to verify the code genuinely implements this topic. If the code does NOT actually implement the hackathon topic (e.g. README says "AI Chatbot" but code is a simple calculator), give complexity 0, codeQuality 0, and explain the mismatch in reasoning.\n\n`
                    : '') +
                `Return JSON with: complexity (0-10), codeQuality (0-10), architecture (0-10), reasoning (string).`);
            return {
                complexity: this.clamp(result.complexity),
                codeQuality: this.clamp(result.codeQuality),
                architecture: this.clamp(result.architecture),
                reasoning: (result.reasoning ?? 'No reasoning provided').slice(0, 1200),
            };
        }
        catch {
            return this.fallbackScore(evidence);
        }
    }
    fallbackScore(evidence) {
        const complexity = Math.min(10, Math.max(2, Math.floor(evidence.structure.fileCount / 40)));
        const codeQuality = evidence.structure.hasTests ? 7 : 5;
        const architecture = evidence.structure.architectureQuality * 2;
        return {
            complexity,
            codeQuality,
            architecture,
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
exports.CodeJudgeAgent = CodeJudgeAgent;
exports.CodeJudgeAgent = CodeJudgeAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_ai_service_1.GroqAiService])
], CodeJudgeAgent);
//# sourceMappingURL=code-judge.agent.js.map