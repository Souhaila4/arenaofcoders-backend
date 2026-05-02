import { ConfigService } from '@nestjs/config';
export declare class GitHubApiService {
    private readonly configService;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    private get githubTimeoutMs();
    parseRepoUrl(repoUrl: string): {
        owner: string;
        repo: string;
        branch: string;
    };
    request<T>(path: string, accept?: string): Promise<T>;
    requestWithResponse(path: string, accept?: string): Promise<Response>;
    requestText(path: string): Promise<string>;
    requestRawFromGithub(owner: string, repo: string, branch: string, path: string): Promise<string>;
}
