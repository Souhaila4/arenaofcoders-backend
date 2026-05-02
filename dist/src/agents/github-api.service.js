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
exports.GitHubApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http_resilience_1 = require("../common/http-resilience");
let GitHubApiService = class GitHubApiService {
    configService;
    baseUrl = 'https://api.github.com';
    constructor(configService) {
        this.configService = configService;
    }
    get githubTimeoutMs() {
        return Number(this.configService.get('GITHUB_HTTP_TIMEOUT_MS', 15_000));
    }
    parseRepoUrl(repoUrl) {
        const normalized = repoUrl.trim().replace(/\/+$/, '');
        const match = normalized.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/]+))?(?:\/.*)?(?:\.git)?$/i);
        if (!match) {
            throw new common_1.InternalServerErrorException('Invalid GitHub URL format');
        }
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, ''),
            branch: match[3],
        };
    }
    async request(path, accept) {
        const response = await this.requestWithResponse(path, accept);
        return (await response.json());
    }
    async requestWithResponse(path, accept) {
        const token = this.configService.get('GITHUB_TOKEN');
        const response = await (0, http_resilience_1.fetchWithTimeout)(`${this.baseUrl}${path}`, {
            method: 'GET',
            headers: {
                Accept: accept ?? 'application/vnd.github+json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }, this.githubTimeoutMs);
        if (!response.ok) {
            const body = await response.text();
            throw new common_1.InternalServerErrorException(`GitHub API failed (${response.status}): ${body.slice(0, 500)}`);
        }
        return response;
    }
    async requestText(path) {
        const token = this.configService.get('GITHUB_TOKEN');
        const response = await (0, http_resilience_1.fetchWithTimeout)(`${this.baseUrl}${path}`, {
            method: 'GET',
            headers: {
                Accept: 'application/vnd.github.raw',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }, this.githubTimeoutMs);
        if (!response.ok) {
            return '';
        }
        return response.text();
    }
    async requestRawFromGithub(owner, repo, branch, path) {
        const token = this.configService.get('GITHUB_TOKEN');
        const encodedPath = path
            .split('/')
            .map((part) => encodeURIComponent(part))
            .join('/');
        const response = await (0, http_resilience_1.fetchWithTimeout)(`https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${encodedPath}`, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }, this.githubTimeoutMs);
        if (!response.ok) {
            return '';
        }
        return response.text();
    }
};
exports.GitHubApiService = GitHubApiService;
exports.GitHubApiService = GitHubApiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GitHubApiService);
//# sourceMappingURL=github-api.service.js.map