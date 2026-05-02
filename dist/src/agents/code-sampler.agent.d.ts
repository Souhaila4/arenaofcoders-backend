import { Agent } from './base.agent';
import { CodeSamplingResult, RepoMetadata } from './agents.types';
import { GitHubApiService } from './github-api.service';
export declare class CodeSamplerAgent implements Agent<RepoMetadata, CodeSamplingResult> {
    private readonly githubApi;
    constructor(githubApi: GitHubApiService);
    execute(repo: RepoMetadata): Promise<CodeSamplingResult>;
    private selectRepresentativeFiles;
    private toSnippet;
}
