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
exports.GroqAiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http_resilience_1 = require("../common/http-resilience");
let GroqAiService = class GroqAiService {
    configService;
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    constructor(configService) {
        this.configService = configService;
    }
    hasApiKey() {
        return Boolean(this.configService.get('GROQ_API_KEY'));
    }
    async askForJson(systemPrompt, userPrompt) {
        const apiKey = this.configService.get('GROQ_API_KEY');
        if (!apiKey) {
            throw new common_1.InternalServerErrorException('GROQ_API_KEY is not configured');
        }
        const model = this.configService.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
        const timeoutMs = Number(this.configService.get('GROQ_HTTP_TIMEOUT_MS', 90_000));
        const response = await (0, http_resilience_1.fetchWithTimeout)(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            }),
        }, timeoutMs);
        if (!response.ok) {
            const body = await response.text();
            throw new common_1.InternalServerErrorException(`Groq API failed (${response.status}): ${body.slice(0, 500)}`);
        }
        const payload = (await response.json());
        const content = payload.choices?.[0]?.message?.content?.trim();
        if (!content) {
            throw new common_1.InternalServerErrorException('Groq returned empty content');
        }
        try {
            return JSON.parse(content);
        }
        catch {
            throw new common_1.InternalServerErrorException(`Groq did not return valid JSON: ${content.slice(0, 500)}`);
        }
    }
};
exports.GroqAiService = GroqAiService;
exports.GroqAiService = GroqAiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GroqAiService);
//# sourceMappingURL=groq-ai.service.js.map