export interface LinkedInPost {
    text: string;
    publishedAt: string;
    url?: string;
    likes?: number;
    comments?: number;
    author?: string;
}
export interface GitHubRepo {
    name: string;
    description?: string;
    url: string;
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    size: number;
    language?: string;
    languages?: {
        [key: string]: number;
    };
    topics?: string[];
    license?: string;
    defaultBranch?: string;
    createdAt: string;
    updatedAt: string;
    lastCommit?: {
        date: string;
        message: string;
        author: string;
    };
    readme?: string;
}
export declare class ScraperService {
    private readonly logger;
    private readonly GITHUB_API;
    private readonly GITHUB_TOKEN;
    private readonly MAX_RETRIES;
    private readonly RETRY_DELAY;
    getGitHubRepos(githubUrl: string): Promise<GitHubRepo[]>;
    getLinkedInPosts(linkedinUrl: string): Promise<LinkedInPost[]>;
    private extractGitHubUsername;
    private githubApiCall;
}
