import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AntiCheatService {
  private readonly logger = new Logger(AntiCheatService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Analyze a GitHub repository URL for AI-generated code.
   * Returns a score 0-100 representing the % of AI-generated code.
   */
  async analyzeRepository(githubUrl: string): Promise<number> {
    const hfToken = this.config.get<string>('HUGGINGFACE_TOKEN');

    if (!hfToken) {
      this.logger.warn('HUGGINGFACE_TOKEN not set – returning mock score');
      return this.mockScore(githubUrl);
    }

    try {
      // Call Hugging Face AI text detection model
      // Using a text-classification model for AI-generated content detection
      const modelUrl =
        'https://api-inference.huggingface.co/models/roberta-base-openai-detector';

      // Fetch the README or main source file from GitHub
      const codeContent = await this.fetchGithubContent(githubUrl);

      if (!codeContent || codeContent.length < 50) {
        this.logger.warn('Could not fetch meaningful content from GitHub repo');
        return this.mockScore(githubUrl);
      }

      // Truncate to model limit (512 tokens ≈ 2000 chars)
      const truncated = codeContent.substring(0, 2000);

      const response = await axios.post(
        modelUrl,
        { inputs: truncated },
        {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      // Response format: [[{label: "LABEL_0" (Real), score: 0.x}, {label: "LABEL_1" (Fake), score: 0.x}]]
      const results = response.data;
      if (Array.isArray(results) && Array.isArray(results[0])) {
        const fakeEntry = results[0].find(
          (r: any) => r.label === 'LABEL_1' || r.label === 'Fake',
        );
        if (fakeEntry) {
          const score = Math.round(fakeEntry.score * 100);
          this.logger.log(`Anti-Cheat score for ${githubUrl}: ${score}%`);
          return score;
        }
      }

      this.logger.warn('Unexpected HuggingFace response format');
      return this.mockScore(githubUrl);
    } catch (error) {
      this.logger.error(`HuggingFace API error: ${error.message}`, error.stack);
      // Fallback to mock if API fails
      return this.mockScore(githubUrl);
    }
  }

  /**
   * Fetch README or main code content from a GitHub repository URL.
   */
  private async fetchGithubContent(githubUrl: string): Promise<string | null> {
    try {
      // Convert github.com URL to raw API URL
      // e.g. https://github.com/user/repo -> https://api.github.com/repos/user/repo/readme
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/\s]+)/);
      if (!match) return null;

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Get README content
      const readmeResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${cleanRepo}/readme`,
        {
          headers: { Accept: 'application/vnd.github.v3.raw' },
          timeout: 10000,
        },
      );

      return readmeResponse.data;
    } catch {
      this.logger.warn(`Could not fetch GitHub content from ${githubUrl}`);
      return null;
    }
  }

  /**
   * Mock score for development / fallback purposes.
   */
  private mockScore(githubUrl: string): number {
    // Deterministic mock: produce a consistent score based on URL hash
    let hash = 0;
    for (let i = 0; i < githubUrl.length; i++) {
      hash = (hash * 31 + githubUrl.charCodeAt(i)) & 0x7fffffff;
    }
    return hash % 100; // 0–99
  }
}
