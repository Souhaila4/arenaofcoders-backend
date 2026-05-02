import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDevelopers(specialty?: string, skill?: string, minWins?: string): Promise<{
        tier: string;
        developers: import("./analytics.service").DeveloperDto[];
        total: number;
        _source: string;
    }>;
}
