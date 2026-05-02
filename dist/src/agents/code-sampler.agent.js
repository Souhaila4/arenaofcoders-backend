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
exports.CodeSamplerAgent = void 0;
const common_1 = require("@nestjs/common");
const github_api_service_1 = require("./github-api.service");
let CodeSamplerAgent = class CodeSamplerAgent {
    githubApi;
    constructor(githubApi) {
        this.githubApi = githubApi;
    }
    async execute(repo) {
        const selected = this.selectRepresentativeFiles(repo.treeWithSize).slice(0, 8);
        const codeSamples = [];
        for (const selectedFile of selected) {
            const raw = await this.githubApi.requestRawFromGithub(repo.owner, repo.repo, repo.defaultBranch, selectedFile.path);
            if (!raw) {
                continue;
            }
            codeSamples.push({
                path: selectedFile.path,
                reason: selectedFile.reason,
                snippet: this.toSnippet(raw),
            });
        }
        return {
            codeSamples,
            sampledFiles: selected.map((item) => item.path),
        };
    }
    selectRepresentativeFiles(files) {
        const source = files.filter((item) => /\.(ts|tsx|js|jsx|py|go|java|cs|rb|php)$/i.test(item.path));
        const entry = source.find((item) => /(main|index|app|server)\.(ts|tsx|js|jsx|py|go|java|cs|rb|php)$/i.test(item.path.split('/').pop() ?? ''));
        const api = source.find((item) => /(controller|route|router|endpoint|api)/i.test(item.path));
        const component = source.find((item) => /(component|screen|page|view)/i.test(item.path));
        const largest = [...source]
            .sort((a, b) => b.size - a.size)
            .slice(0, 5)
            .map((item) => ({ path: item.path, reason: 'largest' }));
        const candidates = [];
        if (entry)
            candidates.push({ path: entry.path, reason: 'entry' });
        if (api)
            candidates.push({ path: api.path, reason: 'api' });
        if (component)
            candidates.push({ path: component.path, reason: 'component' });
        candidates.push(...largest);
        const unique = new Map();
        for (const item of candidates) {
            if (!unique.has(item.path)) {
                unique.set(item.path, item);
            }
        }
        return [...unique.values()];
    }
    toSnippet(content) {
        const maxChars = 4000;
        const lines = content.split('\n').slice(0, 120).join('\n');
        if (lines.length <= maxChars) {
            return lines;
        }
        return `${lines.slice(0, maxChars)}\n// ... truncated ...`;
    }
};
exports.CodeSamplerAgent = CodeSamplerAgent;
exports.CodeSamplerAgent = CodeSamplerAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [github_api_service_1.GitHubApiService])
], CodeSamplerAgent);
//# sourceMappingURL=code-sampler.agent.js.map