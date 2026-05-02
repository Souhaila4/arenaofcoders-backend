import { ScraperService } from './scraper.service';
export declare class ScraperController {
    private readonly scraperService;
    constructor(scraperService: ScraperService);
    testGitHub(url: string): Promise<{
        error: string;
        success?: undefined;
        count?: undefined;
        repos?: undefined;
    } | {
        success: boolean;
        count: number;
        repos: import("./scraper.service").GitHubRepo[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        count?: undefined;
        repos?: undefined;
    }>;
}
