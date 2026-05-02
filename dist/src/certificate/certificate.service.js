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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CertificateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const sdk_1 = require("@hashgraph/sdk");
const sharp = require('sharp');
const FormData = require('form-data');
let CertificateService = CertificateService_1 = class CertificateService {
    prisma;
    config;
    logger = new common_1.Logger(CertificateService_1.name);
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async generateCertificateNFT(userId, hackathonName) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, hederaAccountId: true },
        });
        if (!user)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        const { firstName, lastName, hederaAccountId } = user;
        this.logger.log(`Generating certificate image for ${firstName} ${lastName}`);
        const imageBuffer = await this.generateImage(firstName, lastName, hackathonName);
        this.logger.log('Uploading certificate image to Pinata/IPFS...');
        const imageFilename = `certificate-${userId}-${Date.now()}.jpg`;
        const imageIpfsUrl = await this.uploadFileToPinata(imageBuffer, imageFilename);
        this.logger.log(`Image uploaded: ${imageIpfsUrl}`);
        const date = new Date().toISOString().split('T')[0];
        const metadata = {
            name: `${hackathonName} Certificate — ${firstName} ${lastName}`,
            description: `Certificate of achievement awarded to ${firstName} ${lastName} for participating in ${hackathonName} on ${date}.`,
            image: imageIpfsUrl,
            attributes: [
                { trait_type: 'First Name', value: firstName },
                { trait_type: 'Last Name', value: lastName },
                { trait_type: 'Hackathon', value: hackathonName },
                { trait_type: 'Date', value: date },
            ],
        };
        this.logger.log('Uploading metadata JSON to Pinata/IPFS...');
        const metadataIpfsUrl = await this.uploadJsonToPinata(metadata, `metadata-${userId}-${Date.now()}.json`);
        this.logger.log(`Metadata uploaded: ${metadataIpfsUrl}`);
        this.logger.log('Minting NFT on Hedera...');
        const { tokenId, serial } = await this.mintHederaNFT(metadataIpfsUrl, `${firstName} ${lastName} — ${hackathonName}`);
        this.logger.log(`NFT minted: tokenId=${tokenId}, serial=${serial}`);
        let transferredToWallet = false;
        let transferNote;
        if (hederaAccountId) {
            this.logger.log(`Transferring NFT to user wallet: ${hederaAccountId}`);
            const transferResult = await this.transferNFT(tokenId, serial, hederaAccountId);
            transferredToWallet = transferResult.success;
            transferNote = transferResult.note;
            if (transferredToWallet) {
                this.logger.log(`NFT transferred to ${hederaAccountId}`);
            }
            else {
                this.logger.warn(`NFT transfer skipped: ${transferNote}`);
            }
        }
        else {
            transferNote =
                'User has no Hedera wallet registered. Use PATCH /user/wallet to add one.';
            this.logger.warn(transferNote);
        }
        const certificate = await this.prisma.certificate.create({
            data: {
                userId,
                hackathonName,
                tokenId,
                serial,
                imageIpfsUrl,
                metadataUrl: metadataIpfsUrl,
                transferredToWallet,
                recipientAccountId: transferredToWallet ? hederaAccountId : null,
            },
        });
        return {
            certificateId: certificate.id,
            user: { firstName, lastName },
            imageIpfsUrl,
            metadataIpfsUrl,
            tokenId,
            serial,
            transferredToWallet,
            recipientAccountId: hederaAccountId ?? null,
            ...(transferNote && { note: transferNote }),
        };
    }
    async generateImage(firstName, lastName, hackathonName) {
        const templatePath = path.join(process.cwd(), 'cretif', 'arena_Certificate.jpg');
        if (!fs.existsSync(templatePath)) {
            throw new common_1.InternalServerErrorException(`Certificate template not found at ${templatePath}`);
        }
        const meta = await sharp(templatePath).metadata();
        const W = meta.width ?? 1360;
        const H = meta.height ?? 960;
        const fullName = `${firstName} ${lastName}`;
        const date = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
        const escapeXml = (s) => s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        const textSvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <!-- Full name -->
        <text
          x="${W / 2}"
          y="${Math.round(H * 0.5)}"
          text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="${Math.round(W * 0.055)}"
          font-weight="bold"
          fill="#1a1a4e"
        >${escapeXml(fullName)}</text>

        <!-- Hackathon name -->
        <text
          x="${W / 2}"
          y="${Math.round(H * 0.6)}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="${Math.round(W * 0.026)}"
          fill="#c8a84b"
          letter-spacing="3"
        >${escapeXml(hackathonName)}</text>

        <!-- Date -->
        <text
          x="${W / 2}"
          y="${Math.round(H * 0.68)}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="${Math.round(W * 0.018)}"
          fill="#555555"
        >${escapeXml(date)}</text>
      </svg>
    `;
        const result = await sharp(templatePath)
            .composite([
            {
                input: Buffer.from(textSvg),
                top: 0,
                left: 0,
            },
        ])
            .jpeg({ quality: 92 })
            .toBuffer();
        return result;
    }
    async uploadFileToPinata(buffer, filename) {
        const apiKey = this.config.get('PINATA_API_KEY');
        const apiSecret = this.config.get('PINATA_SECRET_API_KEY');
        const form = new FormData();
        form.append('file', buffer, { filename, contentType: 'image/jpeg' });
        form.append('pinataMetadata', JSON.stringify({ name: filename }));
        try {
            const res = await axios_1.default.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
                maxBodyLength: Infinity,
                headers: {
                    ...form.getHeaders(),
                    pinata_api_key: apiKey,
                    pinata_secret_api_key: apiSecret,
                },
            });
            return `ipfs://${res.data.IpfsHash}`;
        }
        catch (err) {
            this.logger.error('Pinata file upload failed', err?.response?.data ?? err.message);
            throw new common_1.InternalServerErrorException('Failed to upload image to IPFS');
        }
    }
    async uploadJsonToPinata(metadata, name) {
        const apiKey = this.config.get('PINATA_API_KEY');
        const apiSecret = this.config.get('PINATA_SECRET_API_KEY');
        try {
            const res = await axios_1.default.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                pinataMetadata: { name },
                pinataContent: metadata,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    pinata_api_key: apiKey,
                    pinata_secret_api_key: apiSecret,
                },
            });
            return `ipfs://${res.data.IpfsHash}`;
        }
        catch (err) {
            this.logger.error('Pinata JSON upload failed', err?.response?.data ?? err.message);
            throw new common_1.InternalServerErrorException('Failed to upload metadata to IPFS');
        }
    }
    async mintHederaNFT(metadataUri, tokenName) {
        const accountIdStr = this.config.get('HEDERA_ACCOUNT_ID');
        const privateKeyStr = this.config.get('HEDERA_PRIVATE_KEY');
        const operatorId = sdk_1.AccountId.fromString(accountIdStr);
        const operatorKey = sdk_1.PrivateKey.fromStringECDSA(privateKeyStr);
        const client = sdk_1.Client.forTestnet();
        client.setOperator(operatorId, operatorKey);
        try {
            const tokenCreateTx = await new sdk_1.TokenCreateTransaction()
                .setTokenName(tokenName)
                .setTokenSymbol('ARENA-CERT')
                .setTokenType(sdk_1.TokenType.NonFungibleUnique)
                .setDecimals(0)
                .setInitialSupply(0)
                .setTreasuryAccountId(operatorId)
                .setSupplyKey(operatorKey.publicKey)
                .freezeWith(client)
                .sign(operatorKey);
            const tokenCreateSubmit = await tokenCreateTx.execute(client);
            const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
            const tokenId = tokenCreateReceipt.tokenId;
            const mintTx = await new sdk_1.TokenMintTransaction()
                .setTokenId(tokenId)
                .addMetadata(Buffer.from(metadataUri))
                .freezeWith(client)
                .sign(operatorKey);
            const mintSubmit = await mintTx.execute(client);
            const mintReceipt = await mintSubmit.getReceipt(client);
            const serial = mintReceipt.serials[0].toNumber();
            client.close();
            return { tokenId: tokenId.toString(), serial };
        }
        catch (err) {
            client.close();
            this.logger.error('Hedera NFT mint failed', err?.message ?? err);
            throw new common_1.InternalServerErrorException('Failed to mint NFT on Hedera');
        }
    }
    async transferNFT(tokenIdStr, serial, recipientAccountIdStr) {
        const accountIdStr = this.config.get('HEDERA_ACCOUNT_ID');
        const privateKeyStr = this.config.get('HEDERA_PRIVATE_KEY');
        const operatorId = sdk_1.AccountId.fromString(accountIdStr);
        const operatorKey = sdk_1.PrivateKey.fromStringECDSA(privateKeyStr);
        const recipientId = sdk_1.AccountId.fromString(recipientAccountIdStr);
        const tokenId = sdk_1.TokenId.fromString(tokenIdStr);
        const client = sdk_1.Client.forTestnet();
        client.setOperator(operatorId, operatorKey);
        try {
            const transferTx = await new sdk_1.TransferTransaction()
                .addNftTransfer(tokenId, serial, operatorId, recipientId)
                .freezeWith(client)
                .sign(operatorKey);
            const transferSubmit = await transferTx.execute(client);
            await transferSubmit.getReceipt(client);
            client.close();
            return { success: true };
        }
        catch (err) {
            client.close();
            const message = err?.message ?? String(err);
            if (message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
                return {
                    success: false,
                    note: `The NFT was minted but NOT transferred because account ${recipientAccountIdStr} has not associated token ${tokenIdStr} yet. Open HashPack (or any Hedera wallet), associate the token, then contact support to retry the transfer.`,
                };
            }
            this.logger.error('Hedera NFT transfer failed', message);
            return {
                success: false,
                note: `Transfer failed: ${message}`,
            };
        }
    }
};
exports.CertificateService = CertificateService;
exports.CertificateService = CertificateService = CertificateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], CertificateService);
//# sourceMappingURL=certificate.service.js.map