"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const user_module_1 = require("../user/user.module");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const email_verification_module_1 = require("../email-verification/email-verification.module");
const cv_extraction_module_1 = require("../cv-extraction/cv-extraction.module");
const password_reset_module_1 = require("../password-reset/password-reset.module");
const apify_module_1 = require("../apify/apify.module");
const scraper_module_1 = require("../scraper/scraper.module");
function parseExpiresInToSeconds(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match)
        return 7 * 24 * 60 * 60;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    return value * (multipliers[unit] ?? 86400);
}
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule,
            email_verification_module_1.EmailVerificationModule,
            cv_extraction_module_1.CvExtractionModule,
            apify_module_1.ApifyModule,
            scraper_module_1.ScraperModule,
            password_reset_module_1.PasswordResetModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => {
                    const secret = config.getOrThrow('JWT_SECRET');
                    const expiresInStr = config.get('JWT_EXPIRES_IN', '7d');
                    const expiresInSeconds = parseExpiresInToSeconds(expiresInStr);
                    return {
                        secret,
                        signOptions: { expiresIn: expiresInSeconds },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map