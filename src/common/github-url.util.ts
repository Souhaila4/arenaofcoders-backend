/**
 * Extracts the base GitHub repository URL (https://github.com/owner/repo)
 * from any GitHub URL variant.
 *
 * Strips:
 *  - /tree/branch, /blob/branch, /commit/sha, /pull/N, /issues/N, etc.
 *  - Trailing .git
 *  - Query parameters and fragments
 *  - Trailing slashes
 *
 * @example
 *   normalizeGithubUrl('https://github.com/user/repo/tree/main/src')
 *   // → 'https://github.com/user/repo'
 *
 *   normalizeGithubUrl('https://github.com/user/repo.git')
 *   // → 'https://github.com/user/repo'
 *
 *   normalizeGithubUrl('https://github.com/user/repo/commit/abc123')
 *   // → 'https://github.com/user/repo'
 */
export function normalizeGithubUrl(url: string): string {
  // Remove query params and fragments
  let cleaned = url.split('?')[0].split('#')[0].trim();

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // Remove trailing .git
  cleaned = cleaned.replace(/\.git$/, '');

  // Match github.com/owner/repo (ignore everything after)
  const match = cleaned.match(
    /^(https?:\/\/(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+)/i,
  );

  if (!match) {
    // Return cleaned URL as-is if it doesn't match GitHub pattern
    return cleaned.toLowerCase();
  }

  // Normalize to lowercase for consistent comparison
  return match[1].toLowerCase();
}

/**
 * Checks if a URL is structurally a valid GitHub repository URL
 * (i.e. matches https://github.com/owner/repo).
 */
export function isValidGithubUrl(url: string): boolean {
  const cleaned = url.split('?')[0].split('#')[0].trim().replace(/\/+$/, '').replace(/\.git$/, '');
  return /^https?:\/\/(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+/i.test(cleaned);
}

/**
 * Validates that a GitHub repository URL points to a real, public repository.
 *
 * 1. Checks the URL is structurally a valid GitHub URL.
 * 2. Makes an HTTP HEAD request to the normalized repo URL.
 * 3. Returns `{ valid: true }` if 200 OK, or `{ valid: false, reason }` otherwise.
 *
 * Uses a 5-second timeout to avoid blocking.
 */
export async function validateGithubRepoExists(
  url: string,
): Promise<{ valid: true } | { valid: false; reason: string }> {
  // Step 1: Structural check
  if (!isValidGithubUrl(url)) {
    return {
      valid: false,
      reason:
        'Lien GitHub invalide. Le format attendu est https://github.com/owner/repo',
    };
  }

  // Step 2: HTTP check against the normalized base URL
  const baseUrl = normalizeGithubUrl(url);

  try {
    // Dynamic import to avoid issues if axios is not available at module load
    const axios = await import('axios');
    const response = await axios.default.head(baseUrl, {
      timeout: 5000,
      // Follow redirects (GitHub sometimes redirects renamed repos)
      maxRedirects: 5,
      // Accept any 2xx status
      validateStatus: (status: number) => status >= 200 && status < 400,
    });

    return { valid: true };
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      return {
        valid: false,
        reason:
          'Lien GitHub invalide, privé ou introuvable. Veuillez fournir un lien public valide.',
      };
    }
    if (status === 403) {
      return {
        valid: false,
        reason:
          'Accès refusé au repository GitHub. Veuillez vérifier que le repository est public.',
      };
    }
    // Network error, timeout, etc.
    return {
      valid: false,
      reason:
        'Impossible de vérifier le repository GitHub. Veuillez vérifier le lien et réessayer.',
    };
  }
}
