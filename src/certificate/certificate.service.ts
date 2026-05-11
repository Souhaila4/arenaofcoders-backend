/* eslint-disable @typescript-eslint/no-require-imports */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenMintTransaction,
  TransferTransaction,
  AccountId,
  TokenId,
} from '@hashgraph/sdk';

// CommonJS-compatible imports for modules that ship as CJS defaults

const sharp: (input: string | Buffer) => import('sharp').Sharp =
  require('sharp');

const FormData = require('form-data');

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  //  PUBLIC ENTRY POINT
  // ─────────────────────────────────────────────────────────────────
  async generateCertificateNFT(userId: string, hackathonName: string) {
    // 1. Fetch user (name + Hedera wallet)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, hederaAccountId: true },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const { firstName, lastName, hederaAccountId } = user;

    // 2. Generate image
    this.logger.log(
      `Generating certificate image for ${firstName} ${lastName}`,
    );
    const imageBuffer = await this.generateImage(
      firstName,
      lastName,
      hackathonName,
    );

    // 3. Upload image to Pinata
    this.logger.log('Uploading certificate image to Pinata/IPFS...');
    const imageFilename = `certificate-${userId}-${Date.now()}.jpg`;
    const imageIpfsUrl = await this.uploadFileToPinata(
      imageBuffer,
      imageFilename,
    );
    this.logger.log(`Image uploaded: ${imageIpfsUrl}`);

    // 4. Build & upload metadata JSON
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
    const metadataIpfsUrl = await this.uploadJsonToPinata(
      metadata,
      `metadata-${userId}-${Date.now()}.json`,
    );
    this.logger.log(`Metadata uploaded: ${metadataIpfsUrl}`);

    // 5. Mint NFT on Hedera
    this.logger.log('Minting NFT on Hedera...');
    const { tokenId, serial } = await this.mintHederaNFT(
      metadataIpfsUrl,
      `${firstName} ${lastName} — ${hackathonName}`,
    );
    this.logger.log(`NFT minted: tokenId=${tokenId}, serial=${serial}`);

    // 6. Transfer NFT to user's wallet (if registered)
    let transferredToWallet = false;
    let transferNote: string | undefined;

    if (hederaAccountId) {
      this.logger.log(`Transferring NFT to user wallet: ${hederaAccountId}`);
      const transferResult = await this.transferNFT(
        tokenId,
        serial,
        hederaAccountId,
      );
      transferredToWallet = transferResult.success;
      transferNote = transferResult.note;
      if (transferredToWallet) {
        this.logger.log(`NFT transferred to ${hederaAccountId}`);
      } else {
        this.logger.warn(`NFT transfer skipped: ${transferNote}`);
      }
    } else {
      transferNote =
        'User has no Hedera wallet registered. Use PATCH /user/wallet to add one.';
      this.logger.warn(transferNote);
    }

    // 7. Persist certificate record to DB
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

  // ─────────────────────────────────────────────────────────────────
  //  STEP 1 — Certificate image (Sharp rasterizes SVG — no JPG required)
  //  Design: landscape, navy + gold, border & corners (template-style).
  //  Optional: if cretif/arena_Certificate.jpg exists, text is overlaid on it.
  // ─────────────────────────────────────────────────────────────────
  private async generateImage(
    firstName: string,
    lastName: string,
    hackathonName: string,
  ): Promise<Buffer> {
    const templatePath = path.join(
      process.cwd(),
      'cretif',
      'arena_Certificate.jpg',
    );

    const fullName = `${firstName} ${lastName}`.trim();
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    if (fs.existsSync(templatePath)) {
      return this.compositeTextOnTemplate(
        templatePath,
        fullName,
        hackathonName,
        date,
      );
    }

    const svg = this.buildCertificateVectorSvg(
      fullName,
      hackathonName,
      date,
    );
    return sharp(Buffer.from(svg, 'utf-8'))
      .resize(1360, 960, { fit: 'fill' })
      .jpeg({ quality: 92 })
      .toBuffer();
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Full certificate as SVG (navy / gold professional layout). */
  private buildCertificateVectorSvg(
    fullName: string,
    hackathonName: string,
    dateStr: string,
  ): string {
    const W = 1360;
    const H = 960;
    const navy = '#1A237E';
    const gold = '#D4AF37';
    const goldLight = '#E8D48B';

    const name = this.escapeXml(fullName);
    const hack = this.escapeXml(hackathonName);
    const date = this.escapeXml(dateStr);

    const nameFont = fullName.length > 28 ? 42 : fullName.length > 20 ? 48 : 56;
    const hackFont = hackathonName.length > 42 ? 20 : 24;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${goldLight}"/>
      <stop offset="100%" style="stop-color:${gold}"/>
    </linearGradient>
    <linearGradient id="gWave" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${navy}"/>
      <stop offset="100%" style="stop-color:#283593"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <!-- Top corner accents -->
  <polygon points="0,0 220,0 0,160" fill="${navy}"/>
  <polygon points="0,0 200,0 0,140" fill="url(#gGold)" opacity="0.92"/>
  <polygon points="${W},0 ${W - 220},0 ${W},160" fill="${navy}"/>
  <polygon points="${W},0 ${W - 200},0 ${W},130" fill="url(#gGold)" opacity="0.88"/>
  <!-- Bottom decorative waves -->
  <path d="M0 ${H} L0 ${H - 200} C 120 ${H - 240} 240 ${H - 180} 360 ${H - 200} C 480 ${H - 220} 520 ${H - 160} 600 ${H - 190} L 600 ${H} Z" fill="url(#gWave)"/>
  <path d="M0 ${H} L0 ${H - 120} C 140 ${H - 100} 200 ${H - 160} 320 ${H - 130} L 400 ${H} Z" fill="${gold}" opacity="0.35"/>
  <path d="M${W} ${H} L${W} ${H - 200} C ${W - 120} ${H - 240} ${W - 240} ${H - 180} ${W - 360} ${H - 200} C ${W - 480} ${H - 220} ${W - 520} ${H - 160} ${W - 600} ${H - 190} L ${W - 600} ${H} Z" fill="url(#gWave)"/>
  <path d="M${W} ${H} L${W} ${H - 120} C ${W - 140} ${H - 100} ${W - 200} ${H - 160} ${W - 320} ${H - 130} L ${W - 400} ${H} Z" fill="${gold}" opacity="0.35"/>
  <!-- Double gold frame -->
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${gold}" stroke-width="5" rx="2"/>
  <rect x="52" y="52" width="${W - 104}" height="${H - 104}" fill="none" stroke="${navy}" stroke-width="1.5" opacity="0.35" rx="1"/>
  <!-- Typography -->
  <text x="${W / 2}" y="168" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="800" fill="${navy}" letter-spacing="10">CERTIFICATE</text>
  <text x="${W / 2}" y="228" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700" fill="${navy}">Of Achievement</text>
  <text x="${W / 2}" y="302" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="${navy}" opacity="0.9">This Certificate is Proudly Presented To</text>
  <text x="${W / 2}" y="392" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${nameFont}" font-weight="700" fill="${navy}">${name}</text>
  <line x1="${W / 2 - 380}" y1="408" x2="${W / 2 + 380}" y2="408" stroke="${navy}" stroke-width="4" stroke-linecap="square"/>
  <text x="${W / 2}" y="478" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="${hackFont}" font-weight="600" fill="${gold}" letter-spacing="2">${hack}</text>
  <text x="${W / 2}" y="532" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="17" fill="#555555">${date}</text>
  <!-- Seal -->
  <g transform="translate(${W / 2}, ${H - 88})">
    <circle r="52" fill="none" stroke="${gold}" stroke-width="5"/>
    <circle r="44" fill="none" stroke="${navy}" stroke-width="1.5" opacity="0.5"/>
    <path d="M -38 38 Q -48 72 -28 88 L -18 78 Q -28 58 -22 38 Z" fill="${gold}"/>
    <path d="M 38 38 Q 48 72 28 88 L 18 78 Q 28 58 22 38 Z" fill="${gold}"/>
    <text y="8" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="${navy}" font-weight="700">ARENA</text>
  </g>
</svg>`;
  }

  private async compositeTextOnTemplate(
    templatePath: string,
    fullName: string,
    hackathonName: string,
    dateStr: string,
  ): Promise<Buffer> {
    const meta = await sharp(templatePath).metadata();
    const W = meta.width ?? 1360;
    const H = meta.height ?? 960;

    const textSvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <text
          x="${W / 2}"
          y="${Math.round(H * 0.5)}"
          text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="${Math.round(W * 0.055)}"
          font-weight="bold"
          fill="#1A237E"
        >${this.escapeXml(fullName)}</text>
        <text
          x="${W / 2}"
          y="${Math.round(H * 0.6)}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="${Math.round(W * 0.026)}"
          fill="#D4AF37"
          letter-spacing="3"
        >${this.escapeXml(hackathonName)}</text>
        <text
          x="${W / 2}"
          y="${Math.round(H * 0.68)}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="${Math.round(W * 0.018)}"
          fill="#555555"
        >${this.escapeXml(dateStr)}</text>
      </svg>
    `;

    return sharp(templatePath)
      .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toBuffer();
  }

  // ─────────────────────────────────────────────────────────────────
  //  STEP 2 — Upload file buffer to Pinata
  // ─────────────────────────────────────────────────────────────────
  private async uploadFileToPinata(
    buffer: Buffer,
    filename: string,
  ): Promise<string> {
    const apiKey = this.config.get<string>('PINATA_API_KEY');
    const apiSecret = this.config.get<string>('PINATA_SECRET_API_KEY');

    const form = new FormData();
    form.append('file', buffer, { filename, contentType: 'image/jpeg' });
    form.append('pinataMetadata', JSON.stringify({ name: filename }));

    try {
      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        form,
        {
          maxBodyLength: Infinity,
          headers: {
            ...form.getHeaders(),
            pinata_api_key: apiKey!,
            pinata_secret_api_key: apiSecret!,
          },
        },
      );
      return `ipfs://${res.data.IpfsHash}`;
    } catch (err: any) {
      this.logger.error(
        'Pinata file upload failed',
        err?.response?.data ?? err.message,
      );
      throw new InternalServerErrorException('Failed to upload image to IPFS');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  STEP 3 — Upload JSON metadata to Pinata
  // ─────────────────────────────────────────────────────────────────
  private async uploadJsonToPinata(
    metadata: object,
    name: string,
  ): Promise<string> {
    const apiKey = this.config.get<string>('PINATA_API_KEY');
    const apiSecret = this.config.get<string>('PINATA_SECRET_API_KEY');

    try {
      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataMetadata: { name },
          pinataContent: metadata,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: apiKey!,
            pinata_secret_api_key: apiSecret!,
          },
        },
      );
      return `ipfs://${res.data.IpfsHash}`;
    } catch (err: any) {
      this.logger.error(
        'Pinata JSON upload failed',
        err?.response?.data ?? err.message,
      );
      throw new InternalServerErrorException(
        'Failed to upload metadata to IPFS',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  STEP 4 — Mint NFT on Hedera
  // ─────────────────────────────────────────────────────────────────
  private async mintHederaNFT(
    metadataUri: string,
    tokenName: string,
  ): Promise<{ tokenId: string; serial: number }> {
    const accountIdStr = this.config.get<string>('HEDERA_ACCOUNT_ID')!;
    const privateKeyStr = this.config.get<string>('HEDERA_PRIVATE_KEY')!;

    const operatorId = AccountId.fromString(accountIdStr);
    const operatorKey = PrivateKey.fromStringECDSA(privateKeyStr);

    // Use testnet; switch to mainnet when ready
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    try {
      // 1. Create a new NFT token for this certificate
      const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol('ARENA-CERT')
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(operatorId)
        .setSupplyKey(operatorKey.publicKey)
        .freezeWith(client)
        .sign(operatorKey);

      const tokenCreateSubmit = await tokenCreateTx.execute(client);
      const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
      const tokenId = tokenCreateReceipt.tokenId!;

      // 2. Mint 1 serial with metadata = IPFS URI
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(Buffer.from(metadataUri))
        .freezeWith(client)
        .sign(operatorKey);

      const mintSubmit = await mintTx.execute(client);
      const mintReceipt = await mintSubmit.getReceipt(client);
      const serial = mintReceipt.serials[0].toNumber();

      client.close();
      return { tokenId: tokenId.toString(), serial };
    } catch (err: any) {
      client.close();
      this.logger.error('Hedera NFT mint failed', err?.message ?? err);
      throw new InternalServerErrorException('Failed to mint NFT on Hedera');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  //  STEP 5 — Transfer NFT from treasury to user's Hedera wallet
  // ─────────────────────────────────────────────────────────────────
  private async transferNFT(
    tokenIdStr: string,
    serial: number,
    recipientAccountIdStr: string,
  ): Promise<{ success: boolean; note?: string }> {
    const accountIdStr = this.config.get<string>('HEDERA_ACCOUNT_ID')!;
    const privateKeyStr = this.config.get<string>('HEDERA_PRIVATE_KEY')!;

    const operatorId = AccountId.fromString(accountIdStr);
    const operatorKey = PrivateKey.fromStringECDSA(privateKeyStr);
    const recipientId = AccountId.fromString(recipientAccountIdStr);
    const tokenId = TokenId.fromString(tokenIdStr);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    try {
      const transferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, serial, operatorId, recipientId)
        .freezeWith(client)
        .sign(operatorKey);

      const transferSubmit = await transferTx.execute(client);
      await transferSubmit.getReceipt(client); // throws if failed

      client.close();
      return { success: true };
    } catch (err: any) {
      client.close();
      const message: string = err?.message ?? String(err);

      // TOKEN_NOT_ASSOCIATED_TO_ACCOUNT means user hasn't associated this token
      // in their wallet yet — this is expected and not a fatal error.
      if (message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
        return {
          success: false,
          note: `The NFT was minted but NOT transferred because account ${recipientAccountIdStr} has not associated token ${tokenIdStr} yet. Open HashPack (or any Hedera wallet), associate the token, then contact support to retry the transfer.`,
        };
      }

      // Any other Hedera error — log it but don't crash the whole request
      this.logger.error('Hedera NFT transfer failed', message);
      return {
        success: false,
        note: `Transfer failed: ${message}`,
      };
    }
  }
}
