import { Agent } from './base.agent';
import { AntiCheatResult, CodeJudgeScore, ProductJudgeScore, ScoringResult } from './agents.types';
export interface ScoringInput {
    codeScore: CodeJudgeScore;
    productScore: ProductJudgeScore;
    antiCheat: AntiCheatResult;
}
export declare class ScoringAgent implements Agent<ScoringInput, ScoringResult> {
    execute(input: ScoringInput): Promise<ScoringResult>;
}
