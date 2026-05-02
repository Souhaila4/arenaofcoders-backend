import { Agent } from './base.agent';
import { RepoMetadata } from './agents.types';
import { GitHubApiService } from './github-api.service';
export declare class RepoExtractorAgent implements Agent<string, RepoMetadata> {
    private readonly githubApi;
    constructor(githubApi: GitHubApiService);
    execute(repoUrl: string): Promise<RepoMetadata>;
    private safeParse;
}
