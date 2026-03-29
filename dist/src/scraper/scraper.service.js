"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let ScraperService = ScraperService_1 = class ScraperService {
    logger = new common_1.Logger(ScraperService_1.name);
    GITHUB_API = 'https://api.github.com';
    GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    MAX_RETRIES = 3;
    RETRY_DELAY = 1000;
    async getGitHubRepos(githubUrl) {
        try {
            const username = this.extractGitHubUsername(githubUrl);
            if (!username) {
                this.logger.warn(`Could not extract username from: ${githubUrl}`);
                return [];
            }
            this.logger.log(`Fetching GitHub repos for user: ${username}`);
            const reposResponse = await this.githubApiCall(`${this.GITHUB_API}/users/${username}/repos`, {
                params: {
                    sort: 'updated',
                    direction: 'desc',
                    per_page: 3,
                    type: 'owner',
                },
                timeout: 10000,
            });
            const repos = reposResponse.data;
            if (!Array.isArray(repos)) {
                this.logger.error('GitHub API returned non-array response');
                return [];
            }
            this.logger.log(`Found ${repos.length} repos for ${username}`);
            if (repos.length === 0) {
                return [];
            }
            const enrichedRepos = await Promise.all(repos.map(async (repo) => {
                let readme;
                let languages;
                let lastCommit;
                try {
                    const readmeResponse = await this.githubApiCall(`${this.GITHUB_API}/repos/${username}/${repo.name}/readme`, {
                        headers: {
                            'Accept': 'application/vnd.github.v3.raw',
                        },
                        timeout: 5000,
                    });
                    if (typeof readmeResponse.data === 'string') {
                        readme = readmeResponse.data.substring(0, 2000);
                    }
                }
                catch (readmeError) {
                    this.logger.debug(`No README found for ${repo.name}`);
                }
                try {
                    const languagesResponse = await this.githubApiCall(`${this.GITHUB_API}/repos/${username}/${repo.name}/languages`, { timeout: 5000 });
                    if (languagesResponse.data && typeof languagesResponse.data === 'object') {
                        const total = Object.values(languagesResponse.data).reduce((sum, bytes) => sum + bytes, 0);
                        languages = Object.entries(languagesResponse.data).reduce((acc, [lang, bytes]) => {
                            acc[lang] = Math.round((bytes / total) * 100);
                            return acc;
                        }, {});
                    }
                }
                catch (langError) {
                    this.logger.debug(`Could not fetch languages for ${repo.name}`);
                }
                try {
                    const commitsResponse = await this.githubApiCall(`${this.GITHUB_API}/repos/${username}/${repo.name}/commits`, {
                        params: { per_page: 1 },
                        timeout: 5000,
                    });
                    if (Array.isArray(commitsResponse.data) && commitsResponse.data.length > 0) {
                        const commit = commitsResponse.data[0];
                        lastCommit = {
                            date: commit.commit?.author?.date || new Date().toISOString(),
                            message: commit.commit?.message?.split('\n')[0]?.substring(0, 100) || 'No message',
                            author: commit.commit?.author?.name || 'Unknown',
                        };
                    }
                }
                catch (commitError) {
                    this.logger.debug(`Could not fetch commits for ${repo.name}`);
                }
                return {
                    name: repo.name || 'Unknown',
                    description: repo.description || undefined,
                    url: repo.html_url || `https://github.com/${username}/${repo.name}`,
                    stars: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
                    forks: typeof repo.forks_count === 'number' ? repo.forks_count : 0,
                    watchers: typeof repo.watchers_count === 'number' ? repo.watchers_count : 0,
                    openIssues: typeof repo.open_issues_count === 'number' ? repo.open_issues_count : 0,
                    size: typeof repo.size === 'number' ? repo.size : 0,
                    language: repo.language || undefined,
                    languages,
                    topics: Array.isArray(repo.topics) ? repo.topics : undefined,
                    license: repo.license?.name || undefined,
                    defaultBranch: repo.default_branch || undefined,
                    createdAt: repo.created_at || new Date().toISOString(),
                    updatedAt: repo.updated_at || new Date().toISOString(),
                    lastCommit,
                    readme,
                };
            }));
            this.logger.log(`Successfully scraped ${enrichedRepos.length} GitHub repos`);
            return enrichedRepos;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    this.logger.warn(`GitHub user not found: ${githubUrl}`);
                }
                else if (error.response?.status === 403) {
                    this.logger.error('GitHub API rate limit exceeded');
                }
                else {
                    this.logger.error(`GitHub API error: ${error.message}`);
                }
            }
            else {
                this.logger.error(`GitHub scraping error: ${error}`);
            }
            return [];
        }
    }
    async getLinkedInPosts(linkedinUrl) {
        this.logger.warn('LinkedIn posts scraping is not available without authentication. ' +
            'LinkedIn requires login to view posts. Consider using Apify or asking users ' +
            'to provide their LinkedIn session cookies.');
        return [];
    }
    extractGitHubUsername(url) {
        try {
            const match = url.match(/github\.com\/([^\/\?#]+)/);
            return match ? match[1] : null;
        }
        catch {
            return null;
        }
    }
    async githubApiCall(url, config = {}) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ArenaOfCoders-Backend',
            ...config.headers,
        };
        if (this.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${this.GITHUB_TOKEN}`;
        }
        const requestConfig = {
            ...config,
            headers,
        };
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const response = await axios_1.default.get(url, requestConfig);
                return response;
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    if (error.response?.status === 404 || error.response?.status === 403) {
                        throw error;
                    }
                    if (attempt === this.MAX_RETRIES) {
                        throw error;
                    }
                    const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
                    this.logger.debug(`Retry ${attempt}/${this.MAX_RETRIES} after ${delay}ms for ${url}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                else {
                    throw error;
                }
            }
        }
        throw new Error('Max retries exceeded');
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)()
], ScraperService);
//# sourceMappingURL=scraper.service.js.map