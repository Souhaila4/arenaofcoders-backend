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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AntiCheatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiCheatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
let AntiCheatService = AntiCheatService_1 = class AntiCheatService {
    config;
    logger = new common_1.Logger(AntiCheatService_1.name);
    hfInferenceBreaker;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const timeoutMs = Number(this.config.get('HUGGINGFACE_HTTP_TIMEOUT_MS', 30_000));
        this.hfInferenceBreaker = new opossum_1.default((args) => axios_1.default.post(args.modelUrl, { inputs: args.truncated }, {
            headers: {
                Authorization: `Bearer ${args.token}`,
                'Content-Type': 'application/json',
            },
            timeout: timeoutMs,
        }), {
            timeout: Number(this.config.get('HUGGINGFACE_CB_HARD_TIMEOUT_MS', 35_000)),
            errorThresholdPercentage: Number(this.config.get('HUGGINGFACE_CB_ERROR_THRESHOLD', 50)),
            resetTimeout: Number(this.config.get('HUGGINGFACE_CB_RESET_MS', 45_000)),
            volumeThreshold: Number(this.config.get('HUGGINGFACE_CB_VOLUME', 4)),
        });
        this.hfInferenceBreaker.on('open', () => this.logger.warn('HuggingFace inference circuit OPEN — using fallback'));
        this.hfInferenceBreaker.on('halfOpen', () => this.logger.log('HuggingFace inference circuit half-open (trial)'));
    }
    async analyzeRepository(githubUrl) {
        const hfToken = this.config.get('HUGGINGFACE_TOKEN');
        if (!hfToken) {
            this.logger.warn('HUGGINGFACE_TOKEN not set – returning mock score');
            return this.mockScore(githubUrl);
        }
        try {
            const modelUrl = 'https://api-inference.huggingface.co/models/roberta-base-openai-detector';
            const codeContent = await this.fetchGithubContent(githubUrl);
            if (!codeContent || codeContent.length < 50) {
                this.logger.warn('Could not fetch meaningful content from GitHub repo');
                return this.mockScore(githubUrl);
            }
            const truncated = codeContent.substring(0, 2000);
            const response = await this.hfInferenceBreaker.fire({
                modelUrl,
                truncated,
                token: hfToken,
            });
            const results = response.data;
            if (Array.isArray(results) && Array.isArray(results[0])) {
                const fakeEntry = results[0].find((r) => r.label === 'LABEL_1' || r.label === 'Fake');
                if (fakeEntry) {
                    const score = Math.round(fakeEntry.score * 100);
                    this.logger.log(`Anti-Cheat score for ${githubUrl}: ${score}%`);
                    return score;
                }
            }
            this.logger.warn('Unexpected HuggingFace response format');
            return this.mockScore(githubUrl);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`HuggingFace API / circuit: ${msg}`, stack);
            return this.mockScore(githubUrl);
        }
    }
    async fetchGithubContent(githubUrl) {
        try {
            const match = githubUrl.match(/github\.com\/([^/]+)\/([^/\s]+)/);
            if (!match)
                return null;
            const [, owner, repo] = match;
            const cleanRepo = repo.replace(/\.git$/, '');
            const readmeResponse = await axios_1.default.get(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
                headers: { Accept: 'application/vnd.github.v3.raw' },
                timeout: Number(this.config.get('GITHUB_README_TIMEOUT_MS', 12_000)),
            });
            return readmeResponse.data;
        }
        catch {
            this.logger.warn(`Could not fetch GitHub content from ${githubUrl}`);
            return null;
        }
    }
    mockScore(githubUrl) {
        let hash = 0;
        for (let i = 0; i < githubUrl.length; i++) {
            hash = (hash * 31 + githubUrl.charCodeAt(i)) & 0x7fffffff;
        }
        return hash % 100;
    }
};
exports.AntiCheatService = AntiCheatService;
exports.AntiCheatService = AntiCheatService = AntiCheatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AntiCheatService);
//# sourceMappingURL=anti-cheat.service.js.map