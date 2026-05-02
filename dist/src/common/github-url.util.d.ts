export declare function normalizeGithubUrl(url: string): string;
export declare function isValidGithubUrl(url: string): boolean;
export declare function validateGithubRepoExists(url: string): Promise<{
    valid: true;
} | {
    valid: false;
    reason: string;
}>;
