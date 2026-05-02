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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = class EmailService {
    config;
    transporter;
    logger = new common_1.Logger('EmailService');
    constructor(config) {
        this.config = config;
        const smtpUser = this.config.get('SMTP_USER') || 'arenaofcoders@gmail.com';
        const smtpPass = this.config.get('SMTP_PASSWORD') || 'tuil omlu fawc jido';
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            family: 4,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            connectionTimeout: 10000,
            socketTimeout: 10000,
            logger: false,
            debug: false,
        });
        this.logger.log(`Email service initialized with user: ${smtpUser} (port 587 STARTTLS, IPv4 only)`);
    }
    async sendVerificationCode(email, code, firstName) {
        const mailOptions = {
            from: 'arenaofcoders@gmail.com',
            to: email,
            subject: 'Verify Your Email - Arena of Coders',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Arena of Coders!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for signing up! Please use the verification code below to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account with Arena of Coders, please ignore this email.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">Best regards,<br>The Arena of Coders Team</p>
        </div>
      `,
        };
        try {
            this.logger.log(`Sending verification email to ${email}`);
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Verification email sent successfully to ${email}`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to send verification email to ${email}: ${errorMsg}`, error);
            throw new Error(`Email sending failed: ${errorMsg}`);
        }
    }
    async sendPasswordResetCode(email, code, firstName) {
        const mailOptions = {
            from: 'arenaofcoders@gmail.com',
            to: email,
            subject: 'Reset Your Password - Arena of Coders',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Hi ${firstName},</p>
          <p>Use the code below to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">Best regards,<br>The Arena of Coders Team</p>
        </div>
      `,
        };
        try {
            this.logger.log(`Sending password reset email to ${email}`);
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent successfully to ${email}`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to send password reset email to ${email}: ${errorMsg}`, error);
            throw new Error(`Email sending failed: ${errorMsg}`);
        }
    }
    async sendHackathonNotification(email, firstName, competitionTitle, specialty) {
        const mailOptions = {
            from: 'arenaofcoders@gmail.com',
            to: email,
            subject: `New ${specialty} hackathon: ${competitionTitle} – Arena of Coders`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">A hackathon for your specialty is here!</h2>
          <p>Hi ${firstName},</p>
          <p>A new <strong>${specialty}</strong> hackathon has been created and might be perfect for you:</p>
          <div style="background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%); padding: 24px; border-radius: 12px; margin: 20px 0;">
            <h3 style="color: #e94560; margin-top: 0;">${competitionTitle}</h3>
            <p style="color: #eee; margin-bottom: 0;">Log in to Arena of Coders to view details and join the competition.</p>
          </div>
          <p>Don't miss out – check the app for full details and deadlines.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">Best regards,<br>The Arena of Coders Team</p>
        </div>
      `,
        };
        try {
            this.logger.log(`Sending hackathon notification email to ${email}`);
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Hackathon notification email sent successfully to ${email}`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to send hackathon notification email to ${email}: ${errorMsg}`, error);
        }
    }
    async sendCustomHtmlEmail(to, subject, html) {
        try {
            this.logger.log(`Sending custom email to ${to}`);
            await this.transporter.sendMail({
                from: 'arenaofcoders@gmail.com',
                to,
                subject,
                html,
            });
            this.logger.log(`Custom email sent successfully to ${to}`);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to send custom email to ${to}: ${errorMsg}`, error);
            throw new Error(`Email sending failed: ${errorMsg}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map