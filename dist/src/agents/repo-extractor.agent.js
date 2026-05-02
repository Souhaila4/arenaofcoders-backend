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
exports.RepoExtractorAgent = void 0;
const common_1 = require("@nestjs/common");
const github_api_service_1 = require("./github-api.service");
let RepoExtractorAgent = class RepoExtractorAgent {
    githubApi;
    constructor(githubApi) {
        this.githubApi = githubApi;
    }
    async execute(repoUrl) {
        const normalizedUrl = repoUrl.trim();
        const parsed = this.safeParse(normalizedUrl);
        const repo = await this.githubApi.request(`/repos/${parsed.owner}/${parsed.repo}`);
        const targetBranch = parsed.branch || repo.default_branch;
        const readme = await this.githubApi.requestText(`/repos/${parsed.owner}/${parsed.repo}/readme?ref=${targetBranch}`);
        const treeResponse = await this.githubApi.request(`/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(targetBranch)}?recursive=1`);
        const languagesResponse = await this.githubApi.request(`/repos/${parsed.owner}/${parsed.repo}/languages`);
        const files = treeResponse.tree.filter((item) => item.type === 'blob');
        const paths = files.map((item) => item.path);
        const treeWithSize = files.map((item) => ({
            path: item.path,
            size: item.size ?? 0,
        }));
        return {
            owner: repo.owner.login,
            repo: repo.name,
            defaultBranch: targetBranch,
            readme,
            tree: paths,
            treeWithSize,
            fileCount: paths.length,
            languages: Object.keys(languagesResponse),
            createdAt: repo.created_at,
            lastPushedAt: repo.pushed_at,
            htmlUrl: repo.html_url,
        };
    }
    safeParse(url) {
        try {
            return this.githubApi.parseRepoUrl(url);
        }
        catch {
            throw new common_1.BadRequestException('githubUrl must be a valid GitHub repo URL');
        }
    }
};
exports.RepoExtractorAgent = RepoExtractorAgent;
exports.RepoExtractorAgent = RepoExtractorAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [github_api_service_1.GitHubApiService])
], RepoExtractorAgent);
//# sourceMappingURL=repo-extractor.agent.js.map