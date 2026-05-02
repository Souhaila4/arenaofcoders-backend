"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGithubUrl = normalizeGithubUrl;
exports.isValidGithubUrl = isValidGithubUrl;
exports.validateGithubRepoExists = validateGithubRepoExists;
function normalizeGithubUrl(url) {
    let cleaned = url.split('?')[0].split('#')[0].trim();
    cleaned = cleaned.replace(/\/+$/, '');
    cleaned = cleaned.replace(/\.git$/, '');
    const match = cleaned.match(/^(https?:\/\/(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+)/i);
    if (!match) {
        return cleaned.toLowerCase();
    }
    return match[1].toLowerCase();
}
function isValidGithubUrl(url) {
    const cleaned = url.split('?')[0].split('#')[0].trim().replace(/\/+$/, '').replace(/\.git$/, '');
    return /^https?:\/\/(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+/i.test(cleaned);
}
async function validateGithubRepoExists(url) {
    if (!isValidGithubUrl(url)) {
        return {
            valid: false,
            reason: 'Lien GitHub invalide. Le format attendu est https://github.com/owner/repo',
        };
    }
    const baseUrl = normalizeGithubUrl(url);
    try {
        const axios = await Promise.resolve().then(() => __importStar(require('axios')));
        const response = await axios.default.head(baseUrl, {
            timeout: 5000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400,
        });
        return { valid: true };
    }
    catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
            return {
                valid: false,
                reason: 'Lien GitHub invalide, privé ou introuvable. Veuillez fournir un lien public valide.',
            };
        }
        if (status === 403) {
            return {
                valid: false,
                reason: 'Accès refusé au repository GitHub. Veuillez vérifier que le repository est public.',
            };
        }
        return {
            valid: false,
            reason: 'Impossible de vérifier le repository GitHub. Veuillez vérifier le lien et réessayer.',
        };
    }
}
//# sourceMappingURL=github-url.util.js.map