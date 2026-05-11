import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import type { Express } from 'express-serve-static-core';
import { PrismaService } from '../prisma/prisma.service';
import { hederaAccountIdLookupVariants } from '../common/hedera-account.util';
import {
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  TransferTransaction,
  TokenMintTransaction,
} from '@hashgraph/sdk';
import {
  TransactionType,
  TransactionStatus,
} from '@prisma/client';

/** Même instance que `PrismaService` ; `walletAdminFunding` vient du client Prisma généré (`prisma generate`). */
type PrismaForWalletFunding = PrismaService & {
  readonly walletAdminFunding: any;
};

interface MirrorTokenTransfer {
  token_id?: string;
  account?: string;
  amount?: string | number;
}

interface MirrorTransaction {
  consensus_timestamp?: string;
  transaction_id?: string;
  name?: string;
  result?: string;
  token_transfers?: MirrorTokenTransfer[];
}

interface MirrorTransactionsResponse {
  transactions?: MirrorTransaction[];
  _links?: { next?: { href?: string } };
}

function consensusTimestampToIso(ts: string): string {
  if (!ts || !ts.includes('.')) return '';
  const [sec, frac = '0'] = ts.split('.');
  const s = Number.parseInt(sec, 10);
  if (Number.isNaN(s)) return '';
  const nanoStr = frac.padEnd(9, '0').slice(0, 9);
  const nano = Number.parseInt(nanoStr, 10) || 0;
  return new Date(s * 1000 + nano / 1_000_000).toISOString();
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private prismaFunding(): PrismaForWalletFunding {
    return this.prisma as PrismaForWalletFunding;
  }

  // ─────────────────────────────────────────────────────────────────
  //  HELPERS — Hedera client setup
  // ─────────────────────────────────────────────────────────────────

  private buildClient(): {
    client: Client;
    operatorId: AccountId;
    operatorKey: PrivateKey;
  } {
    const accountIdStr = this.config.get<string>('HEDERA_ACCOUNT_ID')!;
    const privateKeyStr = this.config.get<string>('HEDERA_PRIVATE_KEY')!;
    const operatorId = AccountId.fromString(accountIdStr);
    const operatorKey = PrivateKey.fromStringECDSA(privateKeyStr);
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    return { client, operatorId, operatorKey };
  }

  private get arenaTokenId(): TokenId {
    const id = this.config.get<string>('ARENA_COIN_TOKEN_ID');
    if (!id)
      throw new InternalServerErrorException(
        'ARENA_COIN_TOKEN_ID is not configured in .env',
      );
    return TokenId.fromString(id);
  }

  /** Convert human Arena Coins to Hedera atomic units (decimals=2) */
  private toAtomicUnits(amount: number): number {
    return Math.round(amount * 100);
  }

  /** Convert Hedera atomic units back to human-readable amount */
  private fromAtomicUnits(atomic: number): number {
    return atomic / 100;
  }

  // ─────────────────────────────────────────────────────────────────
  //  1. ADMIN MINT COINS → Company wallet
  //     Called by admin to credit coins into a company's Hedera wallet.
  //     This mints new tokens from the supply key and transfers them.
  // ─────────────────────────────────────────────────────────────────

  async adminMintToCompany(userId: string, amount: number) {
    // 1. Fetch company user + check they have a Hedera wallet
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        hederaAccountId: true,
        walletBalance: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.hederaAccountId) {
      throw new BadRequestException(
        'This user has not registered a Hedera wallet. Ask them to use PATCH /user/wallet first.',
      );
    }

    const tokenIdStr = this.config.get<string>('ARENA_COIN_TOKEN_ID')!;
    if (!tokenIdStr) {
      throw new InternalServerErrorException(
        'ARENA_COIN_TOKEN_ID is not configured in .env',
      );
    }

    const { client, operatorId, operatorKey } = this.buildClient();
    const tokenId = this.arenaTokenId;
    const recipientId = AccountId.fromString(user.hederaAccountId);
    const atomicAmount = this.toAtomicUnits(amount);

    let hederaTxId: string | null = null;
    let txStatus: TransactionStatus = TransactionStatus.SUCCESS;
    let errorNote: string | null = null;

    try {
      // Mint new tokens into the treasury first
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(atomicAmount)
        .freezeWith(client)
        .sign(operatorKey);
      const mintSubmit = await mintTx.execute(client);
      await mintSubmit.getReceipt(client);
      this.logger.log(`Minted ${amount} ARENA to treasury`);

      // Transfer from treasury to the company's wallet
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -atomicAmount)
        .addTokenTransfer(tokenId, recipientId, atomicAmount)
        .freezeWith(client)
        .sign(operatorKey);

      const transferSubmit = await transferTx.execute(client);
      const receipt = await transferSubmit.getReceipt(client);
      hederaTxId = transferSubmit.transactionId.toString();

      this.logger.log(
        `Transferred ${amount} ARENA → ${user.hederaAccountId} (${String(receipt.status)})`,
      );
    } catch (err: unknown) {
      client.close();
      const msg: string = err instanceof Error ? err.message : String(err);

      if (msg.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
        txStatus = TransactionStatus.PENDING_ASSOCIATION;
        errorNote = `The company has not associated Arena Coin (${tokenIdStr}) with their wallet yet. Ask them to associate it in HashPack.`;
        this.logger.warn(
          `[MINT] Token not associated: ${user.hederaAccountId}`,
        );
      } else {
        txStatus = TransactionStatus.FAILED;
        errorNote = msg;
        this.logger.error('[MINT] Transfer failed', msg);
        // Log the failure then throw
        await this.logTransaction({
          senderAccountId: 'TREASURY',
          receiverAccountId: user.hederaAccountId,
          amount,
          type: TransactionType.ADMIN_MINT,
          status: txStatus,
          errorNote,
          hederaTransactionId: hederaTxId ?? undefined,
        });
        throw new InternalServerErrorException(`Failed to mint coins: ${msg}`);
      }
    }
    client.close();

    // 2. Update walletBalance in DB (our off-chain mirror)
    const isSuccess = txStatus === TransactionStatus.SUCCESS;
    if (isSuccess) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });
    }

    // 3. Log the transaction
    const log = await this.logTransaction({
      senderAccountId: 'TREASURY',
      receiverAccountId: user.hederaAccountId,
      amount,
      type: TransactionType.ADMIN_MINT,
      status: txStatus,
      errorNote: errorNote ?? undefined,
      hederaTransactionId: hederaTxId ?? undefined,
    });

    return {
      success: isSuccess,
      userId,
      recipientAccountId: user.hederaAccountId,
      amount,
      newBalance: isSuccess ? user.walletBalance + amount : user.walletBalance,
      transactionLogId: log.id,
      hederaTransactionId: hederaTxId,
      ...(errorNote && { note: errorNote }),
    };
  }

  /** Admin: résoudre un destinataire par ID Hedera (aperçu avant mint). */
  async getWalletRecipientPreviewForAdmin(hederaAccountId: string) {
    const variants = hederaAccountIdLookupVariants(hederaAccountId);
    const user = await this.prisma.user.findFirst({
      where: { hederaAccountId: { in: variants } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        hederaAccountId: true,
        email: true,
      },
    });
    if (!user) {
      throw new NotFoundException(
        'No user registered with this Hedera wallet ID',
      );
    }
    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      hederaAccountId: user.hederaAccountId,
      email: user.email,
    };
  }

  /**
   * Mint admin vers un utilisateur identifié par Mongo `userId` ou par `hederaAccountId` enregistré.
   * (App mobile admin — même logique que adminMintToCompany après résolution.)
   */
  async adminMintDirect(opts: {
    amount: number;
    userId?: string;
    hederaAccountId?: string;
  }) {
    const uid = opts.userId?.trim();
    const hid = opts.hederaAccountId?.trim();
    if ((!uid || uid.length === 0) && (!hid || hid.length === 0)) {
      throw new BadRequestException(
        'Provide exactly one of userId or hederaAccountId',
      );
    }
    if (uid && hid) {
      throw new BadRequestException(
        'Provide only one of userId or hederaAccountId',
      );
    }
    let resolvedUserId = uid;
    if (!resolvedUserId && hid) {
      const u = await this.prisma.user.findFirst({
        where: { hederaAccountId: hid },
        select: { id: true },
      });
      if (!u) {
        throw new BadRequestException(
          'No user has registered this Hedera account. They must save it via PATCH /user/wallet first.',
        );
      }
      resolvedUserId = u.id;
    }
    return this.adminMintToCompany(resolvedUserId!, opts.amount);
  }

  // ─────────────────────────────────────────────────────────────────
  //  2. ESCROW LOCK — Company creates hackathon
  //     The company must have enough coins in their off-chain balance.
  //     We deduct from DB immediately, and log the lock on-chain.
  // ─────────────────────────────────────────────────────────────────

  async lockEscrow(
    companyUserId: string,
    amount: number,
    competitionId: string,
  ) {
    if (amount <= 0) return; // Nothing to lock

    const company = await this.prisma.user.findUnique({
      where: { id: companyUserId },
      select: { id: true, walletBalance: true, hederaAccountId: true },
    });
    if (!company) throw new NotFoundException('Company user not found');
    if (company.walletBalance < amount) {
      throw new BadRequestException(
        `Insufficient Arena Coin balance. Required: ${amount}, Available: ${company.walletBalance}`,
      );
    }

    const tokenIdStr =
      this.config.get<string>('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';

    // Deduct from company balance (coins move to platform treasury)
    await this.prisma.user.update({
      where: { id: companyUserId },
      data: { walletBalance: { decrement: amount } },
    });

    let hederaTxId: string | null = null;
    let txStatus: TransactionStatus = TransactionStatus.SUCCESS;
    let errorNote: string | null = null;

    // On-chain: transfer from company wallet → treasury (if they have hederaAccountId)
    if (company.hederaAccountId && tokenIdStr !== 'NOT_SET') {
      const { client, operatorId, operatorKey } = this.buildClient();
      const tokenId = this.arenaTokenId;
      const senderHedId = AccountId.fromString(company.hederaAccountId);
      const atomicAmount = this.toAtomicUnits(amount);

      try {
        const transferTx = await new TransferTransaction()
          .addTokenTransfer(tokenId, senderHedId, -atomicAmount)
          .addTokenTransfer(tokenId, operatorId, atomicAmount)
          .freezeWith(client)
          .sign(operatorKey); // Note: needs company to sign too — simplified for now (treasury pays)

        const submit = await transferTx.execute(client);
        await submit.getReceipt(client);
        hederaTxId = submit.transactionId.toString();
        this.logger.log(
          `Escrow locked: ${amount} ARENA from ${company.hederaAccountId} → treasury for competition ${competitionId}`,
        );
      } catch (err: unknown) {
        // Don't block competition creation — just log the failure
        const msg: string = err instanceof Error ? err.message : String(err);
        txStatus = TransactionStatus.FAILED;
        errorNote = `On-chain escrow failed (off-chain balance still deducted): ${msg}`;
        this.logger.warn(`[ESCROW] On-chain lock failed: ${msg}`);
      }
      client.close();
    } else {
      // No Hedera account or token not configured — off-chain only
      errorNote = company.hederaAccountId
        ? 'ARENA_COIN_TOKEN_ID not configured — escrow is off-chain only'
        : 'Company has no Hedera wallet — escrow is off-chain only';
      this.logger.warn(`[ESCROW] ${errorNote}`);
    }

    await this.logTransaction({
      senderAccountId: company.hederaAccountId ?? 'OFF_CHAIN',
      receiverAccountId: 'TREASURY',
      amount,
      type: TransactionType.ESCROW_LOCK,
      status: txStatus,
      competitionId,
      hederaTransactionId: hederaTxId ?? undefined,
      errorNote: errorNote ?? undefined,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  3. REWARD RELEASE — Winner declared
  //     Treasury transfers the locked coins to the winner's Hedera wallet.
  // ─────────────────────────────────────────────────────────────────

  async releaseRewardToWinner(
    winnerUserId: string,
    amount: number,
    competitionId: string,
  ) {
    if (amount <= 0) return;

    const winner = await this.prisma.user.findUnique({
      where: { id: winnerUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        hederaAccountId: true,
        walletBalance: true,
      },
    });
    if (!winner) throw new NotFoundException('Winner user not found');

    const tokenIdStr =
      this.config.get<string>('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';

    let hederaTxId: string | null = null;
    let txStatus: TransactionStatus = TransactionStatus.SUCCESS;
    let errorNote: string | null = null;

    // On-chain transfer: Treasury → Winner wallet
    if (winner.hederaAccountId && tokenIdStr !== 'NOT_SET') {
      const { client, operatorId, operatorKey } = this.buildClient();
      const tokenId = this.arenaTokenId;
      const recipientId = AccountId.fromString(winner.hederaAccountId);
      const atomicAmount = this.toAtomicUnits(amount);

      try {
        const transferTx = await new TransferTransaction()
          .addTokenTransfer(tokenId, operatorId, -atomicAmount)
          .addTokenTransfer(tokenId, recipientId, atomicAmount)
          .freezeWith(client)
          .sign(operatorKey);

        const submit = await transferTx.execute(client);
        await submit.getReceipt(client);
        hederaTxId = submit.transactionId.toString();
        this.logger.log(
          `Reward sent: ${amount} ARENA → ${winner.hederaAccountId}`,
        );
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : String(err);
        if (msg.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
          txStatus = TransactionStatus.PENDING_ASSOCIATION;
          errorNote = `Winner (${winner.hederaAccountId}) has not associated Arena Coin yet. They must associate the token in HashPack and request a manual transfer.`;
        } else {
          txStatus = TransactionStatus.FAILED;
          errorNote = `On-chain reward transfer failed: ${msg}`;
        }
        this.logger.warn(`[REWARD] Transfer issue: ${errorNote}`);
      }
      client.close();
    } else {
      if (!winner.hederaAccountId) {
        txStatus = TransactionStatus.PENDING_ASSOCIATION;
        errorNote =
          'Winner has no Hedera wallet registered. Use PATCH /user/wallet to add one, then claim the reward.';
      } else {
        errorNote =
          'ARENA_COIN_TOKEN_ID not configured — reward logged off-chain only';
      }
      this.logger.warn(`[REWARD] ${errorNote}`);
    }

    // Update winner's off-chain balance only if successful
    if (txStatus === TransactionStatus.SUCCESS) {
      await this.prisma.user.update({
        where: { id: winnerUserId },
        data: {
          walletBalance: { increment: amount },
          totalWins: { increment: 1 },
        },
      });
    }

    await this.logTransaction({
      senderAccountId: 'TREASURY',
      receiverAccountId: winner.hederaAccountId ?? 'NOT_REGISTERED',
      amount,
      type: TransactionType.REWARD_RELEASE,
      status: txStatus,
      competitionId,
      hederaTransactionId: hederaTxId ?? undefined,
      errorNote: errorNote ?? undefined,
    });

    return {
      success: txStatus === TransactionStatus.SUCCESS,
      pending: txStatus === TransactionStatus.PENDING_ASSOCIATION,
      winnerUserId,
      recipientAccountId: winner.hederaAccountId ?? null,
      amount,
      hederaTransactionId: hederaTxId,
      ...(errorNote && { note: errorNote }),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  4. REFUND — Company cancelled hackathon
  // ─────────────────────────────────────────────────────────────────

  async refundEscrow(
    companyUserId: string,
    amount: number,
    competitionId: string,
  ) {
    if (amount <= 0) return;

    const company = await this.prisma.user.findUnique({
      where: { id: companyUserId },
      select: { id: true, hederaAccountId: true, walletBalance: true },
    });
    if (!company) throw new NotFoundException('Company user not found');

    const tokenIdStr =
      this.config.get<string>('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';

    // Return coins to company off-chain balance
    await this.prisma.user.update({
      where: { id: companyUserId },
      data: { walletBalance: { increment: amount } },
    });

    let hederaTxId: string | null = null;
    let txStatus: TransactionStatus = TransactionStatus.SUCCESS;
    let errorNote: string | null = null;

    if (company.hederaAccountId && tokenIdStr !== 'NOT_SET') {
      const { client, operatorId, operatorKey } = this.buildClient();
      const tokenId = this.arenaTokenId;
      const recipientId = AccountId.fromString(company.hederaAccountId);
      const atomicAmount = this.toAtomicUnits(amount);

      try {
        const transferTx = await new TransferTransaction()
          .addTokenTransfer(tokenId, operatorId, -atomicAmount)
          .addTokenTransfer(tokenId, recipientId, atomicAmount)
          .freezeWith(client)
          .sign(operatorKey);

        const submit = await transferTx.execute(client);
        await submit.getReceipt(client);
        hederaTxId = submit.transactionId.toString();
        this.logger.log(
          `Refund: ${amount} ARENA → ${company.hederaAccountId} for competition ${competitionId}`,
        );
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : String(err);
        txStatus = TransactionStatus.FAILED;
        errorNote = `On-chain refund failed (off-chain balance already restored): ${msg}`;
        this.logger.warn(`[REFUND] ${errorNote}`);
      }
      client.close();
    } else {
      errorNote =
        'Refund is off-chain only (no Hedera wallet or token not configured)';
    }

    await this.logTransaction({
      senderAccountId: 'TREASURY',
      receiverAccountId: company.hederaAccountId ?? 'OFF_CHAIN',
      amount,
      type: TransactionType.REFUND,
      status: txStatus,
      competitionId,
      hederaTransactionId: hederaTxId ?? undefined,
      errorNote: errorNote ?? undefined,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  5. QUERY — Get user wallet info + transaction history
  // ─────────────────────────────────────────────────────────────────

  async getWalletInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        walletBalance: true,
        hederaAccountId: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const tokenId = this.config.get<string>('ARENA_COIN_TOKEN_ID') ?? null;

    const transactions = await this.prisma.transactionLog.findMany({
      where: {
        OR: [
          { receiverAccountId: user.hederaAccountId ?? '__none__' },
          { senderAccountId: user.hederaAccountId ?? '__none__' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      walletBalance: user.walletBalance,
      hederaAccountId: user.hederaAccountId,
      tokenId,
      hashScanUrl: user.hederaAccountId
        ? `https://hashscan.io/testnet/account/${user.hederaAccountId}`
        : null,
      transactions,
    };
  }

  async getTransactionHistory(competitionId: string) {
    return this.prisma.transactionLog.findMany({
      where: { competitionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAdminWalletFundings(opts: {
    page: number;
    limit: number;
    beneficiaryUserId?: string;
  }) {
    const page = Math.max(1, opts.page);
    const limit = Math.min(Math.max(opts.limit, 1), 100);
    const skip = (page - 1) * limit;
    const where = opts.beneficiaryUserId?.trim()
      ? { beneficiaryUserId: opts.beneficiaryUserId.trim() }
      : {};

    const [total, rows] = await Promise.all([
      this.prismaFunding().walletAdminFunding.count({ where }),
      this.prismaFunding().walletAdminFunding.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          beneficiary: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      items: rows.map((r) => ({
        id: r.id,
        arenaCoinAmount: r.arenaCoinAmount,
        paymentReference: r.paymentReference,
        paymentMethod: r.paymentMethod,
        fiatAmount: r.fiatAmount,
        fiatCurrency: r.fiatCurrency,
        paymentDate: r.paymentDate?.toISOString() ?? null,
        internalNotes: r.internalNotes,
        proofDocumentUrl: r.proofDocumentUrl,
        proofHederaAnchorTxId: r.proofHederaAnchorTxId,
        proofSha256Hex: r.proofSha256Hex,
        proofEncryptedPath: r.proofEncryptedPath ?? '',
        proofOriginalFilename: r.proofOriginalFilename,
        hederaMintTransactionId: r.hederaMintTransactionId,
        createdAt: r.createdAt.toISOString(),
        beneficiary: r.beneficiary
          ? {
              id: r.beneficiary.id,
              firstName: r.beneficiary.firstName,
              lastName: r.beneficiary.lastName,
              email: r.beneficiary.email,
            }
          : null,
      })),
    };
  }

  async getFundingProofFilePath(fundingId: string): Promise<{
    stream: ReturnType<typeof createReadStream>;
    filename: string;
    mime: string;
  }> {
    const row = await this.prismaFunding().walletAdminFunding.findUnique({
      where: { id: fundingId },
      select: {
        proofEncryptedPath: true,
        proofOriginalFilename: true,
      },
    });
    if (!row?.proofEncryptedPath?.trim()) {
      throw new NotFoundException('No proof file for this funding entry');
    }
    const rel = row.proofEncryptedPath.trim().replace(/\\/g, '/');
    const abs = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    if (!existsSync(abs)) {
      throw new NotFoundException('Proof file missing on disk');
    }
    const ext = path.extname(row.proofOriginalFilename ?? '').toLowerCase();
    const mime =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'application/octet-stream';
    const filename =
      row.proofOriginalFilename?.trim() || `proof-${fundingId}${ext || '.bin'}`;
    return {
      stream: createReadStream(abs),
      filename,
      mime,
    };
  }

  /**
   * Mint + enregistrement audit (paiement / preuve fichier) pour l’app admin mobile.
   */
  async adminMintWithTrace(
    params: {
      userId: string;
      amount: number;
      paymentMethod: string;
      paymentReference: string;
      fiatAmount?: number;
      fiatCurrency?: string;
      paymentDate?: string;
      internalNotes?: string;
      proofDocumentUrl?: string;
    },
    proofFile?: Express.Multer.File,
  ) {
    const mintResult = await this.adminMintToCompany(
      params.userId,
      params.amount,
    );

    let paymentDateParsed: Date | undefined;
    if (params.paymentDate) {
      const d = new Date(params.paymentDate);
      if (!Number.isNaN(d.getTime())) paymentDateParsed = d;
    }

    let proofSha256Hex: string | undefined;
    let proofOriginalFilename: string | undefined;
    if (proofFile?.buffer?.length) {
      proofSha256Hex = createHash('sha256')
        .update(proofFile.buffer)
        .digest('hex');
      proofOriginalFilename =
        proofFile.originalname?.replace(/[^\w.\-()+@ ]/g, '_') || 'proof.bin';
    }

    const hederaTx =
      mintResult.hederaTransactionId != null
        ? String(mintResult.hederaTransactionId)
        : undefined;

    const created = await this.prismaFunding().walletAdminFunding.create({
      data: {
        beneficiaryUserId: params.userId,
        arenaCoinAmount: params.amount,
        paymentMethod: params.paymentMethod,
        paymentReference: params.paymentReference,
        fiatAmount: params.fiatAmount,
        fiatCurrency: params.fiatCurrency,
        paymentDate: paymentDateParsed,
        internalNotes: params.internalNotes,
        proofDocumentUrl: params.proofDocumentUrl,
        proofSha256Hex,
        proofOriginalFilename,
        hederaMintTransactionId: hederaTx,
      },
    });

    if (proofFile?.buffer?.length) {
      const dir = path.join(process.cwd(), 'uploads', 'wallet-funding');
      await mkdir(dir, { recursive: true });
      const safeBase = proofOriginalFilename ?? 'proof.bin';
      const safeName = `${created.id}_${safeBase}`;
      const abs = path.join(dir, safeName);
      await writeFile(abs, proofFile.buffer);
      const rel = path.join('uploads', 'wallet-funding', safeName).replace(/\\/g, '/');
      await this.prismaFunding().walletAdminFunding.update({
        where: { id: created.id },
        data: {
          proofEncryptedPath: rel,
          proofSha256Hex: proofSha256Hex!,
        },
      });
    }

    return {
      ...mintResult,
      fundingAuditId: created.id,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  6. ADMIN — Hedera Mirror (on-chain token movements for treasury)
  // ─────────────────────────────────────────────────────────────────

  async getAdminMirrorTransactions(opts: {
    limit: number;
    next?: string;
    cryptotransferOnly: boolean;
  }) {
    const mirrorBase = (
      this.config.get<string>('HEDERA_MIRROR_BASE_URL') ?? 'https://testnet.mirrornode.hedera.com'
    ).replace(/\/$/, '');
    const treasury = this.config.get<string>('HEDERA_ACCOUNT_ID');
    const tokenId = this.config.get<string>('ARENA_COIN_TOKEN_ID');
    const decimals = 2;

    const empty = () => ({
      source: 'hedera-mirror',
      strategy: 'treasury-account',
      mirrorBaseUrl: mirrorBase,
      treasuryAccountId: treasury ?? '',
      tokenId: tokenId ?? '',
      decimals,
      transactions: [],
      links: {} as { next?: string },
    });

    if (!treasury || !tokenId) {
      this.logger.warn(
        '[MIRROR] HEDERA_ACCOUNT_ID or ARENA_COIN_TOKEN_ID missing — returning empty page',
      );
      return empty();
    }

    const tokenNorm = tokenId.trim().toLowerCase();
    let url: string;
    if (opts.next?.trim()) {
      const n = opts.next.trim();
      url =
        n.startsWith('http://') || n.startsWith('https://')
          ? n
          : `${mirrorBase}${n.startsWith('/') ? '' : '/'}${n}`;
    } else {
      const qs = new URLSearchParams({
        'account.id': treasury,
        limit: String(Math.min(Math.max(opts.limit, 1), 100)),
      });
      if (opts.cryptotransferOnly) {
        qs.set('transactiontype', 'CRYPTOTRANSFER');
      }
      url = `${mirrorBase}/api/v1/transactions?${qs.toString()}`;
    }

    try {
      const { data, status } = await axios.get<MirrorTransactionsResponse>(
        url,
        {
          timeout: 30_000,
          validateStatus: () => true,
        },
      );

      if (status === 429) {
        throw new HttpException(
          'Hedera Mirror rate limit (429)',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (status < 200 || status >= 300) {
        this.logger.warn(`[MIRROR] HTTP ${status} for ${url}`);
        throw new InternalServerErrorException(
          `Mirror request failed with status ${status}`,
        );
      }

      const rawTxs = data.transactions ?? [];
      const transactions = rawTxs
        .map((tx) => this.mapMirrorTransaction(tx, tokenNorm, decimals))
        .filter((t) => t.rawTokenLegs.length > 0 || t.transfers.length > 0);

      const nextHref = data._links?.next?.href;
      const links =
        nextHref && String(nextHref).trim()
          ? { next: String(nextHref).trim() }
          : {};

      return {
        source: 'hedera-mirror',
        strategy: 'treasury-account',
        mirrorBaseUrl: mirrorBase,
        treasuryAccountId: treasury,
        tokenId,
        decimals,
        transactions,
        links,
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[MIRROR] ${msg}`);
      throw new InternalServerErrorException(
        `Failed to fetch Hedera mirror transactions: ${msg}`,
      );
    }
  }

  private normalizeTokenId(id: string): string {
    return id.trim().toLowerCase();
  }

  private mapMirrorTransaction(
    tx: MirrorTransaction,
    arenaTokenNorm: string,
    decimals: number,
  ) {
    const consensusTimestamp = tx.consensus_timestamp ?? '';
    const tokenTransfers = (tx.token_transfers ?? []).filter(
      (t) =>
        t.token_id &&
        this.normalizeTokenId(t.token_id) === arenaTokenNorm,
    );

    const rawTokenLegs = tokenTransfers.map((t) => {
      const raw = BigInt(String(t.amount));
      const human = Number(raw < 0n ? -raw : raw) / 10 ** decimals;
      return {
        account: t.account ?? '',
        amount: human,
        amountRaw: String(t.amount),
      };
    });

    const senders = tokenTransfers.filter((t) => BigInt(String(t.amount)) < 0n);
    const receivers = tokenTransfers.filter(
      (t) => BigInt(String(t.amount)) > 0n,
    );
    const transfers: {
      sender: string;
      receiver: string;
      amount: number;
      amountRaw: string;
    }[] = [];
    const n = Math.min(senders.length, receivers.length);
    for (let i = 0; i < n; i++) {
      const rawAmt = BigInt(String(senders[i].amount));
      const absRaw = rawAmt < 0n ? -rawAmt : rawAmt;
      transfers.push({
        sender: senders[i].account ?? '',
        receiver: receivers[i].account ?? '',
        amount: Number(absRaw) / 10 ** decimals,
        amountRaw: absRaw.toString(),
      });
    }

    return {
      transactionId: tx.transaction_id ?? null,
      consensusTimestamp,
      consensusAtIso: consensusTimestampToIso(consensusTimestamp),
      type: tx.name ?? null,
      result: tx.result ?? null,
      transfers,
      rawTokenLegs,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  PRIVATE — Internal log helper
  // ─────────────────────────────────────────────────────────────────

  private async logTransaction(data: {
    senderAccountId?: string;
    receiverAccountId: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    competitionId?: string;
    hederaTransactionId?: string;
    errorNote?: string;
  }) {
    const tokenId = this.config.get<string>('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';
    return this.prisma.transactionLog.create({
      data: {
        senderAccountId: data.senderAccountId ?? 'TREASURY',
        receiverAccountId: data.receiverAccountId,
        amount: data.amount,
        tokenId,
        type: data.type,
        status: data.status,
        competitionId: data.competitionId,
        hederaTransactionId: data.hederaTransactionId,
        errorNote: data.errorNote,
      },
    });
  }
}
