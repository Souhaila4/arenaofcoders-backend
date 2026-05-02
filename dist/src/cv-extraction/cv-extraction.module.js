"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvExtractionModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cv_extraction_service_1 = require("./cv-extraction.service");
let CvExtractionModule = class CvExtractionModule {
};
exports.CvExtractionModule = CvExtractionModule;
exports.CvExtractionModule = CvExtractionModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [cv_extraction_service_1.CvExtractionService],
        exports: [cv_extraction_service_1.CvExtractionService],
    })
], CvExtractionModule);
//# sourceMappingURL=cv-extraction.module.js.map