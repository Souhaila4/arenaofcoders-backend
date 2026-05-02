import { Agent } from './base.agent';
import { Evidence, ReportResult } from './agents.types';
export interface ReportInput {
    teamName: string;
    finalScore: number;
    evidence: Evidence;
    antiCheatFlags: string[];
}
export declare class ReportAgent implements Agent<ReportInput, ReportResult> {
    execute(input: ReportInput): Promise<ReportResult>;
}
