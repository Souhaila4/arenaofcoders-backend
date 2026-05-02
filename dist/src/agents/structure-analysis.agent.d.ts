import { Agent } from './base.agent';
import { RepoMetadata, StructureAnalysis } from './agents.types';
export declare class StructureAnalysisAgent implements Agent<RepoMetadata, StructureAnalysis> {
    execute(repo: RepoMetadata): Promise<StructureAnalysis>;
    private computeArchitectureQuality;
}
