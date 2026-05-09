import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosResponse } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminMirrorArenaTransactionsResult,
  ArenaMirrorTransactionItem,
  MirrorTokenTransferRow,
  MirrorTransactionRow,
  MirrorTransactionsResponse,
} from './mirror-arena.types';
import { ProofEncryptionService } from './proof-encryption.service';
import { HederaProofAnchorService } from './hedera-proof-anchor.service';
import * as path from 'path';
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
  ArenaCoinFundingMintStatus,
  UserRole,
  FundingPaymentMethod,
} from '@prisma/client';
import { hederaAccountIdLookupVariants, canonicalHederaAccountId } from '../common/hedera-account.util';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly proofEncryption: ProofEncryptionService,
    private readonly hederaProofAnchor: HederaProofAnchorService,
  ) {}

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

  /** Admin: preview recipient linked to a Hedera account (before mint). */
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
   * Admin: mint on-chain + crédit solde app (JSON).
   * userId OU hederaAccountId (pas les deux) — pour l’app mobile « Envoyer ARENA ».
   */
  async adminMintArenaCoinsDirect(params: {
    userId?: string;
    hederaAccountId?: string;
    amount: number;
  }) {
    const amount = params.amount;
    const uid = params.userId?.trim();
    const hid = params.hederaAccountId?.trim();

    if (uid && hid) {
      throw new BadRequestException(
        'Provide only one of userId or hederaAccountId',
      );
    }
    if (!uid && !hid) {
      throw new BadRequestException('Provide userId or hederaAccountId');
    }

    let resolvedUserId = uid ?? '';
    if (hid) {
      const variants = hederaAccountIdLookupVariants(hid);
      const found = await this.prisma.user.findFirst({
        where: { hederaAccountId: { in: variants } },
        select: { id: true },
      });
      if (!found) {
        throw new NotFoundException(
          'No user registered with this Hedera wallet ID',
        );
      }
      resolvedUserId = found.id;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: resolvedUserId },
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
    const recipientAccountCanonical = canonicalHederaAccountId(
      user.hederaAccountId!,
    );
    const recipientId = AccountId.fromString(recipientAccountCanonical);
    const atomicAmount = this.toAtomicUnits(amount);

    let hederaTxId: string | null = null;
    let txStatus: TransactionStatus = TransactionStatus.SUCCESS;
    let errorNote: string | null = null;

    try {
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(atomicAmount)
        .freezeWith(client)
        .sign(operatorKey);
      const mintSubmit = await mintTx.execute(client);
      await mintSubmit.getReceipt(client);
      this.logger.log(`Minted ${amount} ARENA to treasury`);

      const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -atomicAmount)
        .addTokenTransfer(tokenId, recipientId, atomicAmount)
        .freezeWith(client)
        .sign(operatorKey);

      const transferSubmit = await transferTx.execute(client);
      const receipt = await transferSubmit.getReceipt(client);
      hederaTxId = transferSubmit.transactionId.toString();

      this.logger.log(
        `Transferred ${amount} ARENA → ${recipientAccountCanonical} (${String(receipt.status)})`,
      );
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);

      if (msg.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
        txStatus = TransactionStatus.PENDING_ASSOCIATION;
        errorNote = `The company has not associated Arena Coin (${tokenIdStr}) with their wallet yet. Ask them to associate it in HashPack.`;
        this.logger.warn(
          `[MINT] Token not associated: ${recipientAccountCanonical}`,
        );
      } else {
        txStatus = TransactionStatus.FAILED;
        errorNote = msg;
        this.logger.error('[MINT] Transfer failed', msg);
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
    } finally {
      client.close();
    }

    const isSuccess = txStatus === TransactionStatus.SUCCESS;
    if (isSuccess) {
      await this.prisma.user.update({
        where: { id: resolvedUserId },
        data: { walletBalance: { increment: amount } },
      });
    }

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
      userId: resolvedUserId,
      recipientAccountId: user.hederaAccountId,
      amount,
      newBalance: isSuccess ? user.walletBalance + amount : user.walletBalance,
      transactionLogId: log.id,
      hederaTransactionId: hederaTxId,
      ...(errorNote && { note: errorNote }),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  //  1. ADMIN MINT COINS → Company wallet (avec traçabilité paiement fiat)
  // ─────────────────────────────────────────────────────────────────

  /** Données formulaire : origine des fonds avant conversion en Arena Coins */
  async adminMintToCompany(
    userId: string,
    amount: number,
    trace: {
      paymentMethod: FundingPaymentMethod;
      fiatAmount?: number;
      fiatCurrency?: string;
      paymentReference: string;
      paymentDate?: string;
      proofDocumentUrl?: string;
      internalNotes?: string;
    },
    recordedByUserId: string,
    proofUpload?: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    },
  ) {
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
    if (user.role !== UserRole.COMPANY) {
      throw new BadRequestException(
        'Le crédit traçable Arena Coin est réservé aux comptes avec le rôle COMPANY.',
      );
    }
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

    let paymentDateParsed: Date | undefined;
    if (trace.paymentDate) {
      const d = new Date(trace.paymentDate);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('paymentDate invalide');
      }
      paymentDateParsed = d;
    }

    let proofOriginalFilename: string | undefined;
    let proofContentType: string | undefined;
    let proofEncryptedPath: string | undefined;
    let proofSha256Hex: string | undefined;

    if (proofUpload?.buffer?.length) {
      if (!this.proofEncryption.isConfigured()) {
        throw new BadRequestException(
          'Upload de preuve impossible : configurez PROOF_ENCRYPTION_KEY (32 octets, hex ou base64) sur le serveur.',
        );
      }
      try {
        const safeName = path
          .basename(proofUpload.originalname || 'document')
          .replace(/[^\w.\- ()\[\]]+/g, '_')
          .slice(0, 200);
        const stored = await this.proofEncryption.encryptAndPersist({
          plain: proofUpload.buffer,
          originalFilename: safeName,
        });
        proofOriginalFilename = safeName;
        proofContentType = proofUpload.mimetype || 'application/octet-stream';
        proofEncryptedPath = stored.relativePath;
        proofSha256Hex = stored.sha256Hex;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Proof encryption failed: ${msg}`);
        throw new InternalServerErrorException(
          'Échec du chiffrement de la preuve — réessayez ou contactez le support.',
        );
      }
    }

    const funding = await this.prisma.arenaCoinFunding.create({
      data: {
        beneficiaryUserId: userId,
        arenaCoinAmount: amount,
        paymentMethod: trace.paymentMethod,
        fiatAmount: trace.fiatAmount,
        fiatCurrency: trace.fiatCurrency,
        paymentReference: trace.paymentReference.trim(),
        paymentDate: paymentDateParsed,
        proofDocumentUrl: trace.proofDocumentUrl,
        proofOriginalFilename,
        proofContentType,
        proofEncryptedPath,
        proofSha256Hex,
        internalNotes: trace.internalNotes,
        recordedByUserId,
        mintStatus: ArenaCoinFundingMintStatus.PENDING,
      },
    });

    let proofHederaAnchorTxId: string | null = null;
    if (proofSha256Hex) {
      proofHederaAnchorTxId = await this.hederaProofAnchor.anchorFundingProof({
        fundingId: funding.id,
        sha256Hex: proofSha256Hex,
      });
      if (proofHederaAnchorTxId) {
        await this.prisma.arenaCoinFunding.update({
          where: { id: funding.id },
          data: { proofHederaAnchorTxId },
        });
      }
    }

    const { client, operatorId, operatorKey } = this.buildClient();
    const tokenId = this.arenaTokenId;
    const recipientId = AccountId.fromString(user.hederaAccountId);
    const atomicAmount = this.toAtomicUnits(amount);

    let hederaTxId: string | null = null;
    let txStatus: TransactionStatus = TransactionStatus.SUCCESS;
    let errorNote: string | null = null;

    try {
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(atomicAmount)
        .freezeWith(client)
        .sign(operatorKey);
      const mintSubmit = await mintTx.execute(client);
      await mintSubmit.getReceipt(client);
      this.logger.log(`Minted ${amount} ARENA to treasury`);

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
        const failLog = await this.logTransaction({
          senderAccountId: 'TREASURY',
          receiverAccountId: user.hederaAccountId,
          amount,
          type: TransactionType.ADMIN_MINT,
          status: txStatus,
          errorNote,
          hederaTransactionId: hederaTxId ?? undefined,
        });
        await this.prisma.arenaCoinFunding.update({
          where: { id: funding.id },
          data: {
            mintStatus: ArenaCoinFundingMintStatus.FAILED,
            transactionLogId: failLog.id,
            hederaTransactionId: hederaTxId ?? undefined,
            mintErrorNote: errorNote ?? undefined,
          },
        });
        throw new InternalServerErrorException(`Failed to mint coins: ${msg}`);
      }
    }
    client.close();

    const isSuccess = txStatus === TransactionStatus.SUCCESS;
    if (isSuccess) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });
    }

    const log = await this.logTransaction({
      senderAccountId: 'TREASURY',
      receiverAccountId: user.hederaAccountId,
      amount,
      type: TransactionType.ADMIN_MINT,
      status: txStatus,
      errorNote: errorNote ?? undefined,
      hederaTransactionId: hederaTxId ?? undefined,
    });

    const fundingMintStatus =
      txStatus === TransactionStatus.SUCCESS
        ? ArenaCoinFundingMintStatus.COMPLETED
        : ArenaCoinFundingMintStatus.PENDING_ASSOCIATION;

    await this.prisma.arenaCoinFunding.update({
      where: { id: funding.id },
      data: {
        mintStatus: fundingMintStatus,
        transactionLogId: log.id,
        hederaTransactionId: hederaTxId ?? undefined,
        mintErrorNote: errorNote ?? undefined,
      },
    });

    return {
      success: isSuccess,
      fundingId: funding.id,
      userId,
      recipientAccountId: user.hederaAccountId,
      amount,
      newBalance: isSuccess ? user.walletBalance + amount : user.walletBalance,
      transactionLogId: log.id,
      hederaTransactionId: hederaTxId,
      mintStatus: fundingMintStatus,
      proofSha256Hex: proofSha256Hex ?? undefined,
      proofHederaAnchorTxId: proofHederaAnchorTxId ?? undefined,
      ...(errorNote && { note: errorNote }),
    };
  }

  /** Téléchargement admin : déchiffre la preuve stockée sur disque */
  async getDecryptedProofForFunding(fundingId: string) {
    const row = await this.prisma.arenaCoinFunding.findUnique({
      where: { id: fundingId },
      select: {
        proofEncryptedPath: true,
        proofOriginalFilename: true,
        proofContentType: true,
      },
    });
    if (!row?.proofEncryptedPath) {
      throw new NotFoundException(
        'Aucun fichier preuve chiffré pour cette entrée.',
      );
    }
    const buffer = this.proofEncryption.decryptFromRelativePath(
      row.proofEncryptedPath,
    );
    return {
      buffer,
      filename: row.proofOriginalFilename ?? 'preuve',
      contentType: row.proofContentType ?? 'application/octet-stream',
    };
  }

  /** Liste paginée des entrées fiat → Arena Coin (audit admin) */
  async listFundingsForAdmin(params: {
    page: number;
    limit: number;
    beneficiaryUserId?: string;
  }) {
    const { page, limit, beneficiaryUserId } = params;
    const skip = (page - 1) * limit;
    const where = beneficiaryUserId
      ? { beneficiaryUserId }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.arenaCoinFunding.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          beneficiary: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              hederaAccountId: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.arenaCoinFunding.count({ where }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      items,
    };
  }

  /** Historique des crédits traçables pour l’entreprise connectée */
  async listFundingsForBeneficiary(userId: string) {
    return this.prisma.arenaCoinFunding.findMany({
      where: { beneficiaryUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        recordedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
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

  // ─────────────────────────────────────────────────────────────────
  //  ADMIN — Hedera Mirror Node (on-chain Arena Coin ledger)
  // ─────────────────────────────────────────────────────────────────

  async getMirrorArenaTransactionsForAdmin(params: {
    limit?: number;
    nextPath?: string;
    cryptotransferOnly?: boolean;
  }): Promise<AdminMirrorArenaTransactionsResult> {
    const tokenId = this.config.get<string>('ARENA_COIN_TOKEN_ID')?.trim();
    if (!tokenId) {
      throw new InternalServerErrorException(
        'ARENA_COIN_TOKEN_ID is not configured',
      );
    }
    const treasury = this.config.get<string>('HEDERA_ACCOUNT_ID')?.trim();
    if (!treasury) {
      throw new InternalServerErrorException(
        'HEDERA_ACCOUNT_ID is not configured',
      );
    }

    const decimalsRaw = this.config.get<string>('ARENA_COIN_DECIMALS');
    const decimals =
      decimalsRaw != null && decimalsRaw !== ''
        ? Number(decimalsRaw)
        : 2;
    if (!Number.isFinite(decimals) || decimals < 0 || decimals > 18) {
      throw new InternalServerErrorException(
        'ARENA_COIN_DECIMALS must be a number between 0 and 18',
      );
    }

    const mirrorBase =
      this.config.get<string>('HEDERA_MIRROR_BASE_URL')?.replace(/\/$/, '') ??
      'https://testnet.mirrornode.hedera.com';

    const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
    const cryptotransferOnly = params.cryptotransferOnly === true;

    let url: string;
    if (params.nextPath?.trim()) {
      const np = params.nextPath.trim();
      if (!np.startsWith('/api/v1/transactions')) {
        throw new BadRequestException(
          'Invalid next cursor: must start with /api/v1/transactions',
        );
      }
      url = `${mirrorBase}${np}`;
    } else {
      const q = new URLSearchParams({
        'account.id': treasury,
        order: 'desc',
        limit: String(limit),
      });
      if (cryptotransferOnly) {
        q.set('transactiontype', 'CRYPTOTRANSFER');
      }
      url = `${mirrorBase}/api/v1/transactions?${q.toString()}`;
    }

    let res: AxiosResponse<MirrorTransactionsResponse>;
    try {
      res = await axios.get<MirrorTransactionsResponse>(url, {
        timeout: 30_000,
        validateStatus: () => true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Mirror node request failed: ${msg}`);
      throw new InternalServerErrorException(
        'Failed to reach Hedera mirror node',
      );
    }

    if (res.status === 429) {
      const ra = res.headers['retry-after'];
      const retryAfter = Array.isArray(ra) ? ra[0] : ra;
      throw new HttpException(
        {
          message: 'Hedera mirror node rate limit (429). Retry later.',
          retryAfter: retryAfter ?? undefined,
        },
        429,
      );
    }

    if (res.status >= 400) {
      const dataAny = res.data as unknown as {
        _status?: { messages?: Array<{ message?: string }> };
      };
      const mirrorMsg =
        dataAny?._status?.messages?.[0]?.message ?? `HTTP ${res.status}`;
      this.logger.warn(`Mirror node error ${res.status}: ${mirrorMsg}`);
      throw new InternalServerErrorException(
        `Mirror node returned ${res.status}: ${mirrorMsg}`,
      );
    }

    const rows = res.data.transactions ?? [];
    const items: ArenaMirrorTransactionItem[] = [];
    for (const row of rows) {
      const item = this.mapMirrorRowToArenaItem(
        row,
        tokenId,
        decimals,
        cryptotransferOnly,
      );
      if (item) {
        items.push(item);
      }
    }

    return {
      source: 'hedera-mirror',
      strategy:
        'Query: GET /api/v1/transactions?account.id={HEDERA_ACCOUNT_ID}&order=desc&limit=… ' +
        '(optional transactiontype=CRYPTOTRANSFER). ' +
        'The mirror API does not accept token.id on this route; responses are filtered server-side ' +
        'to rows where token_transfers includes ARENA_COIN_TOKEN_ID. ' +
        'This matches treasury-centric Arena Coin flows (mint, escrow, rewards, refunds).',
      mirrorBaseUrl: mirrorBase,
      treasuryAccountId: treasury,
      tokenId,
      decimals,
      transactions: items,
      links: {
        next: res.data.links?.next ?? null,
      },
    };
  }

  private mapMirrorRowToArenaItem(
    row: MirrorTransactionRow,
    tokenId: string,
    decimals: number,
    cryptotransferOnly: boolean,
  ): ArenaMirrorTransactionItem | null {
    if (cryptotransferOnly && row.name && row.name !== 'CRYPTOTRANSFER') {
      return null;
    }
    const forToken =
      row.token_transfers?.filter((t) => t.token_id === tokenId) ?? [];
    if (forToken.length === 0) {
      return null;
    }

    const { legs, rawTokenLegs } = this.buildArenaTransferLegs(
      forToken,
      decimals,
    );

    return {
      transactionId: row.transaction_id ?? null,
      consensusTimestamp: row.consensus_timestamp,
      consensusAtIso: this.consensusTimestampToIso(row.consensus_timestamp),
      type: row.name ?? null,
      result: row.result ?? null,
      transfers: legs,
      ...(rawTokenLegs ? { rawTokenLegs } : {}),
    };
  }

  private buildArenaTransferLegs(
    rows: MirrorTokenTransferRow[],
    decimals: number,
  ): {
    legs: ArenaMirrorTransactionItem['transfers'];
    rawTokenLegs?: ArenaMirrorTransactionItem['rawTokenLegs'];
  } {
    const amountRawStr = (v: string | number) => String(v ?? '0').trim();
    const isDebit = (amount: string | number) =>
      amountRawStr(amount).startsWith('-');
    const absRaw = (amount: string | number) => {
      const s = amountRawStr(amount);
      return isDebit(amount) ? s.slice(1) : s;
    };

    const legs: ArenaMirrorTransactionItem['transfers'] = [];
    const debits = rows.filter((r) => isDebit(r.amount));
    const credits = rows.filter((r) => {
      const s = amountRawStr(r.amount);
      return !isDebit(r.amount) && s !== '0' && Number(s) !== 0;
    });
    const usedCreditIdx = new Set<number>();

    for (const d of debits) {
      const want = absRaw(d.amount);
      const idx = credits.findIndex(
        (c, i) => !usedCreditIdx.has(i) && absRaw(c.amount) === want,
      );
      if (idx >= 0) {
        usedCreditIdx.add(idx);
        legs.push({
          sender: d.account,
          receiver: credits[idx].account,
          amount: this.rawAmountToHuman(want, decimals),
          amountRaw: want,
        });
      }
    }

    let rawTokenLegs: ArenaMirrorTransactionItem['rawTokenLegs'];
    if (legs.length === 0 && rows.length > 0) {
      rawTokenLegs = rows.map((r) => ({
        account: r.account,
        amount: this.rawAmountToHuman(r.amount, decimals),
        amountRaw: amountRawStr(r.amount),
      }));
    }

    return { legs, rawTokenLegs };
  }

  private rawAmountToHuman(
    amountRawSigned: string | number,
    decimals: number,
  ): number {
    const s = String(amountRawSigned ?? '0').trim();
    const neg = s.startsWith('-');
    const abs = neg ? s.slice(1) : s;
    const n = Number(abs);
    if (!Number.isFinite(n)) {
      return 0;
    }
    const human = n / 10 ** decimals;
    return neg ? -human : human;
  }

  private consensusTimestampToIso(ts: string): string {
    const [secPart, nanoPart = '0'] = ts.split('.');
    const sec = Number(secPart);
    const nano = Number((nanoPart + '000000000').slice(0, 9));
    const ms = sec * 1000 + Math.floor(nano / 1_000_000);
    return new Date(ms).toISOString();
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
