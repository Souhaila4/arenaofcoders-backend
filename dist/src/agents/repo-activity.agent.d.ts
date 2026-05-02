import { Agent } from './base.agent';
import { RepoActivity, RepoMetadata } from './agents.types';
import { GitHubApiService } from './github-api.service';
export declare class RepoActivityAgent implements Agent<RepoMetadata, RepoActivity> {
    private readonly githubApi;
    constructor(githubApi: GitHubApiService);
    execute(repo: RepoMetadata): Promise<RepoActivity>;
    private extractTotalFromLinkHeader;
}
