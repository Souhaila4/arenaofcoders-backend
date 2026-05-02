import { Agent } from './base.agent';
import { CodeSamplingResult, Evidence, RepoActivity, RepoMetadata, StructureAnalysis } from './agents.types';
export interface EvidenceBuilderInput {
    repo: RepoMetadata;
    activity: RepoActivity;
    structure: StructureAnalysis;
    samples: CodeSamplingResult;
    competitionTopic?: string;
}
export declare class EvidenceBuilderAgent implements Agent<EvidenceBuilderInput, Evidence> {
    execute(input: EvidenceBuilderInput): Promise<Evidence>;
    private summarizeReadme;
    private detectStack;
    private detectDependencies;
}
