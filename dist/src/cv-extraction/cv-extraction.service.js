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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvExtractionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const RESUME_FILENAME = 'resume.docx';
const GRADIO_SPACE = 'kaaboura/cv-extraction-prediction';
const PREDICT_ENDPOINT = '/predict_cv';
const MAX_SKILL_TAGS = 30;
const MAX_SKILL_LENGTH = 50;
const PREDICTION_TO_SPECIALTY = {
    backend: 'BACKEND',
    frontend: 'FRONTEND',
    full_stack: 'FULLSTACK',
    qa: null,
    cybersecurity: 'CYBERSECURITY',
    bi: 'BI',
    data_engineer: 'DATA',
    business_analyst: 'BI',
    project_manager: null,
    mobile: 'MOBILE',
};
let CvExtractionService = class CvExtractionService {
    config;
    constructor(config) {
        this.config = config;
    }
    async extractFromBuffer(buffer) {
        if (!buffer?.length) {
            throw new common_1.BadRequestException('Resume file is empty');
        }
        const { Client, FileData } = await Promise.resolve().then(() => __importStar(require('@gradio/client')));
        const hfToken = this.config.get('HUGGINGFACE_TOKEN');
        const connectOptions = hfToken?.trim()
            ? { token: hfToken.trim() }
            : undefined;
        const apiKey = this.config.get('CV_EXTRACTION_API_KEY')?.trim() ?? 'null';
        const file = new File([new Uint8Array(buffer)], RESUME_FILENAME, {
            type: DOCX_MIME,
        });
        let result;
        try {
            const client = await Client.connect(GRADIO_SPACE, connectOptions);
            const root = client.config?.root ?? client.config?.root_url;
            if (!root)
                throw new Error('Missing Gradio root URL');
            const uploadRes = await client.upload_files(root, [file]);
            if (!uploadRes.files?.length) {
                throw new Error(uploadRes.error ?? 'Upload failed');
            }
            const fileData = new FileData({
                path: uploadRes.files[0],
                orig_name: RESUME_FILENAME,
            });
            result = await client.predict(PREDICT_ENDPOINT, {
                resume_file: fileData,
                api_key: apiKey,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            if (message.includes('Space metadata could not be loaded') ||
                message.includes('could not be loaded')) {
                throw new common_1.BadRequestException('CV extraction service is temporarily unavailable (Hugging Face space may be sleeping). Please try again in a minute.');
            }
            throw new common_1.BadRequestException(`CV extraction failed: ${message}`);
        }
        const data = this.normalizeResult(result);
        if (data?.error) {
            throw new common_1.BadRequestException(`CV extraction failed: ${data.error}`);
        }
        const mainSpecialty = this.mapPredictionToSpecialty(data?.prediction);
        const skillTags = this.normalizeSkills(data?.skills ?? []);
        return {
            mainSpecialty,
            skillTags,
            rawPrediction: data?.prediction,
            confidenceScores: data?.confidence_scores,
        };
    }
    normalizeResult(result) {
        if (result == null)
            return null;
        const raw = result?.data ?? result;
        if (Array.isArray(raw) && raw.length > 0)
            return raw[0];
        if (typeof raw === 'object' && raw !== null)
            return raw;
        return null;
    }
    mapPredictionToSpecialty(prediction) {
        if (!prediction || typeof prediction !== 'string')
            return null;
        const key = prediction.toLowerCase().replace(/-/g, '_');
        return PREDICTION_TO_SPECIALTY[key] ?? null;
    }
    normalizeSkills(skills) {
        const seen = new Set();
        const out = [];
        for (const s of skills) {
            const t = typeof s === 'string' ? s.trim() : '';
            if (!t || t.length > MAX_SKILL_LENGTH)
                continue;
            if (seen.has(t.toLowerCase()))
                continue;
            seen.add(t.toLowerCase());
            out.push(t);
            if (out.length >= MAX_SKILL_TAGS)
                break;
        }
        return out;
    }
};
exports.CvExtractionService = CvExtractionService;
exports.CvExtractionService = CvExtractionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CvExtractionService);
//# sourceMappingURL=cv-extraction.service.js.map