"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApifyService = void 0;
const common_1 = require("@nestjs/common");
const LINKEDIN_PROFILE_ACTOR_ID = 'vulnv/linkedin-profile-scraper';
const LINKEDIN_POSTS_ACTOR_ID = 'curious_coder/linkedin-post-search-scraper';
const GITHUB_SCRAPER_ACTOR_ID = 'fresh_cliff/github-scraper';
const APIFY_API_BASE = 'https://api.apify.com/v2';
const RUN_SYNC_TIMEOUT_MS = 60_000;
let ApifyService = class ApifyService {
    async getLinkedInSkills(linkedinUrl) {
        const token = process.env.APIFY_API_TOKEN;
        if (!token?.trim()) {
            return [];
        }
        const url = `${APIFY_API_BASE}/acts/${LINKEDIN_PROFILE_ACTOR_ID.replace('/', '~')}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RUN_SYNC_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: [linkedinUrl.trim()] }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok) {
                return [];
            }
            const items = (await res.json());
            return this.extractSkillsFromDatasetItems(items);
        }
        catch {
            clearTimeout(timeoutId);
            return [];
        }
    }
    extractSkillsFromDatasetItems(items) {
        const skillsSet = new Set();
        for (const item of items) {
            if (!item || typeof item !== 'object')
                continue;
            const obj = item;
            if (Array.isArray(obj.skills)) {
                for (const s of obj.skills) {
                    const name = typeof s === 'string' ? s : s?.name;
                    if (typeof name === 'string' &&
                        name.trim().length > 0 &&
                        name.length <= 50) {
                        skillsSet.add(name.trim().toLowerCase());
                    }
                }
            }
            if (Array.isArray(obj.courses)) {
                for (const c of obj.courses) {
                    const title = typeof c === 'string' ? c : c?.title;
                    if (typeof title === 'string' &&
                        title.trim().length > 0 &&
                        title.length <= 50) {
                        skillsSet.add(title.trim().toLowerCase());
                    }
                }
            }
        }
        return Array.from(skillsSet).slice(0, 30);
    }
    async getLinkedInPosts(linkedinUrl) {
        const token = process.env.APIFY_API_TOKEN;
        if (!token?.trim()) {
            console.log('[APIFY] No APIFY_API_TOKEN found in environment');
            return [];
        }
        const url = `${APIFY_API_BASE}/acts/${LINKEDIN_POSTS_ACTOR_ID.replace('/', '~')}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
        console.log('[APIFY] Fetching LinkedIn posts from:', linkedinUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RUN_SYNC_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profileUrls: [linkedinUrl.trim()],
                    resultsLimit: 3,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            console.log('[APIFY] LinkedIn posts response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('[APIFY] LinkedIn posts API error:', res.status, errorText);
                return [];
            }
            const items = (await res.json());
            console.log('[APIFY] LinkedIn posts raw data items count:', items.length);
            const posts = this.extractPostsFromDatasetItems(items);
            console.log('[APIFY] LinkedIn posts extracted:', posts.length);
            return posts;
        }
        catch (err) {
            clearTimeout(timeoutId);
            console.error('[APIFY] LinkedIn posts fetch error:', err);
            return [];
        }
    }
    extractPostsFromDatasetItems(items) {
        const posts = [];
        for (const item of items) {
            if (!item || typeof item !== 'object')
                continue;
            const obj = item;
            if (typeof obj.text === 'string' && obj.text.trim()) {
                posts.push({
                    text: obj.text.trim().substring(0, 500),
                    publishedAt: typeof obj.publishedAt === 'string'
                        ? obj.publishedAt
                        : new Date().toISOString(),
                    url: typeof obj.url === 'string' ? obj.url : undefined,
                    likes: typeof obj.likes === 'number' ? obj.likes : undefined,
                    comments: typeof obj.comments === 'number' ? obj.comments : undefined,
                });
            }
        }
        return posts.slice(0, 3);
    }
    async getGitHubRepos(githubUrl) {
        const token = process.env.APIFY_API_TOKEN;
        if (!token?.trim()) {
            console.log('[APIFY] No APIFY_API_TOKEN found in environment');
            return [];
        }
        const username = this.extractGitHubUsername(githubUrl);
        console.log('[APIFY] Extracted GitHub username:', username, 'from URL:', githubUrl);
        if (!username) {
            console.log('[APIFY] Could not extract GitHub username');
            return [];
        }
        const url = `${APIFY_API_BASE}/acts/${GITHUB_SCRAPER_ACTOR_ID.replace('/', '~')}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
        console.log('[APIFY] Fetching GitHub repos for user:', username);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RUN_SYNC_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: username,
                    maxRepos: 3,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            console.log('[APIFY] GitHub repos response status:', res.status);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('[APIFY] GitHub repos API error:', res.status, errorText);
                return [];
            }
            const items = (await res.json());
            console.log('[APIFY] GitHub repos raw data items count:', items.length);
            const repos = this.extractReposFromDatasetItems(items);
            console.log('[APIFY] GitHub repos extracted:', repos.length);
            return repos;
        }
        catch (err) {
            clearTimeout(timeoutId);
            console.error('[APIFY] GitHub repos fetch error:', err);
            return [];
        }
    }
    extractGitHubUsername(url) {
        try {
            const match = url.match(/github\.com\/([^/?#]+)/);
            return match ? match[1] : null;
        }
        catch {
            return null;
        }
    }
    extractReposFromDatasetItems(items) {
        const repos = [];
        for (const item of items) {
            if (!item || typeof item !== 'object')
                continue;
            const obj = item;
            if (typeof obj.name === 'string' && obj.name.trim()) {
                repos.push({
                    name: obj.name.trim(),
                    description: typeof obj.description === 'string'
                        ? obj.description.substring(0, 200)
                        : undefined,
                    url: typeof obj.url === 'string'
                        ? obj.url
                        : `https://github.com/${obj.name}`,
                    stars: typeof obj.stars === 'number' ? obj.stars : undefined,
                    readme: typeof obj.readme === 'string'
                        ? obj.readme.substring(0, 2000)
                        : undefined,
                    language: typeof obj.language === 'string' ? obj.language : undefined,
                    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
                });
            }
        }
        return repos.slice(0, 3);
    }
};
exports.ApifyService = ApifyService;
exports.ApifyService = ApifyService = __decorate([
    (0, common_1.Injectable)()
], ApifyService);
//# sourceMappingURL=apify.service.js.map