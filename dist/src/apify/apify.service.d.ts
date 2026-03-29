export interface LinkedInPost {
    text: string;
    publishedAt: string;
    url?: string;
    likes?: number;
    comments?: number;
}
export interface GitHubRepo {
    name: string;
    description?: string;
    url: string;
    stars?: number;
    readme?: string;
    language?: string;
    updatedAt?: string;
}
export declare class ApifyService {
    getLinkedInSkills(linkedinUrl: string): Promise<string[]>;
    private extractSkillsFromDatasetItems;
    getLinkedInPosts(linkedinUrl: string): Promise<LinkedInPost[]>;
    private extractPostsFromDatasetItems;
    getGitHubRepos(githubUrl: string): Promise<GitHubRepo[]>;
    private extractGitHubUsername;
    private extractReposFromDatasetItems;
}
