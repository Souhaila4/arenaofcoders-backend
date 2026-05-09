import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { AdminMintWithFundingDto } from './dto/admin-mint-with-funding.dto';
import { ListFundingQueryDto } from './dto/list-funding-query.dto';
import { MintCoinsDto } from './dto/mint-coins.dto';
import { FundingPaymentMethod } from '@prisma/client';

@ApiTags('wallet')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ─────────────────────────────────────────────────────────────────
  //  USER: Get my wallet info + transaction history
  // ─────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({
    summary: 'Get my Arena Coin wallet info',
    description:
      'Returns current off-chain balance, Hedera account ID, and last 50 transactions.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        userId: '...',
        walletBalance: 500,
        hederaAccountId: '0.0.123456',
        tokenId: '0.0.987654',
        hashScanUrl: 'https://hashscan.io/testnet/account/0.0.123456',
        transactions: [],
      },
    },
  })
  async getMyWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWalletInfo(userId);
  }

  @Post('admin/mint-direct')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Admin: mint ARENA + transfert trésor → wallet Hedera (JSON userId ou hederaAccountId)',
    description:
      'Pour l’app mobile « Envoyer ARENA ». Le POST /wallet/admin/mint reste réservé au multipart (traçabilité entreprise).',
  })
  @ApiResponse({ status: 201 })
  async mintDirectJson(@Body() dto: MintCoinsDto) {
    return this.walletService.adminMintArenaCoinsDirect({
      userId: dto.userId,
      hederaAccountId: dto.hederaAccountId,
      amount: dto.amount,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  ADMIN: Mint + traçabilité (multipart : preuve fichier chiffrée)
  // ─────────────────────────────────────────────────────────────────

  @Post('admin/mint')
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('proof', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'amount', 'paymentMethod', 'paymentReference'],
      properties: {
        userId: { type: 'string' },
        amount: { type: 'string', example: '500' },
        paymentMethod: { type: 'string', enum: Object.values(FundingPaymentMethod) },
        paymentReference: { type: 'string' },
        fiatAmount: { type: 'string' },
        fiatCurrency: { type: 'string' },
        paymentDate: { type: 'string', format: 'date-time' },
        internalNotes: { type: 'string' },
        proofDocumentUrl: { type: 'string' },
        proof: { type: 'string', format: 'binary', description: 'Justificatif (PDF, image…)' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: mint + formulaire traçabilité + preuve (fichier chiffrée)',
    description:
      'Champs texte + fichier optionnel `proof`. Fichier stocké chiffré (AES-256-GCM), hash ancré sur Hedera (topic HCS si configuré).',
  })
  @ApiResponse({ status: 201 })
  async mintWithMultipart(
    @UploadedFile() proof: Express.Multer.File | undefined,
    @Body() body: Record<string, string>,
    @CurrentUser('id') adminUserId: string,
  ) {
    const userId = body.userId?.trim();
    const amount = parseFloat(String(body.amount ?? ''));
    if (!userId || Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException('userId et amount (> 0) requis.');
    }
    const pm = body.paymentMethod?.trim();
    if (!pm || !Object.values(FundingPaymentMethod).includes(pm as FundingPaymentMethod)) {
      throw new BadRequestException('paymentMethod invalide.');
    }
    const ref = body.paymentReference?.trim();
    if (!ref) {
      throw new BadRequestException('paymentReference requis.');
    }
    let fiatAmount: number | undefined;
    if (body.fiatAmount != null && String(body.fiatAmount).trim() !== '') {
      const f = parseFloat(String(body.fiatAmount));
      if (Number.isNaN(f) || f < 0) {
        throw new BadRequestException('fiatAmount invalide.');
      }
      fiatAmount = f;
    }
    const fiatCurrency =
      body.fiatCurrency?.trim().length === 3
        ? body.fiatCurrency.trim().toUpperCase()
        : body.fiatCurrency?.trim() || undefined;

    const trace = {
      paymentMethod: pm as FundingPaymentMethod,
      fiatAmount,
      fiatCurrency,
      paymentReference: ref,
      paymentDate: body.paymentDate?.trim() || undefined,
      proofDocumentUrl: body.proofDocumentUrl?.trim() || undefined,
      internalNotes: body.internalNotes?.trim() || undefined,
    };

    const proofUpload =
      proof?.buffer?.length && proof.buffer.length > 0
        ? {
            buffer: proof.buffer,
            originalname: proof.originalname ?? 'document',
            mimetype: proof.mimetype ?? 'application/octet-stream',
          }
        : undefined;

    return this.walletService.adminMintToCompany(
      userId,
      amount,
      trace,
      adminUserId,
      proofUpload,
    );
  }

  /** Mint sans fichier (scripts / clients JSON uniquement) */
  @Post('admin/mint-json')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Admin: mint traçabilité (JSON, sans upload fichier)' })
  async mintJson(
    @Body() dto: AdminMintWithFundingDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.walletService.adminMintToCompany(
      dto.userId,
      dto.amount,
      dto.funding,
      adminUserId,
    );
  }

  @Get('admin/funding/:id/proof-file')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Admin: télécharger la preuve (déchiffrement serveur)',
  })
  @ApiParam({ name: 'id', description: 'ID ArenaCoinFunding' })
  async downloadFundingProof(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.walletService.getDecryptedProofForFunding(id);
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.send(buffer);
  }

  @Get('admin/funding')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Admin: audit des entrées fiat → Arena Coin',
    description:
      'Liste paginée des formulaires de traçabilité (qui a payé comment, combien, référence, lien preuve, statut mint).',
  })
  @ApiResponse({ status: 200 })
  async listFundingsForAdmin(@Query() query: ListFundingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.walletService.listFundingsForAdmin({
      page,
      limit,
      beneficiaryUserId: query.beneficiaryUserId,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  COMPANY: Mes entrées traçables (transparence)
  // ─────────────────────────────────────────────────────────────────

  @Get('funding/me')
  @ApiOperation({
    summary: 'Historique des crédits Arena Coin avec traçabilité',
    description:
      'Pour l’utilisateur connecté : liste des opérations où un admin a enregistré un paiement fiat avant mint.',
  })
  @ApiResponse({ status: 200 })
  async listMyFundings(@CurrentUser('id') userId: string) {
    return this.walletService.listFundingsForBeneficiary(userId);
  }

  @Get('admin/mirror-transactions')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Admin: Arena Coin transactions from Hedera Mirror Node',
    description:
      'Reads the public mirror REST API for the treasury account and filters rows ' +
      'whose token_transfers include ARENA_COIN_TOKEN_ID.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page size (1–100, default 25)',
    example: 25,
  })
  @ApiQuery({
    name: 'next',
    required: false,
    description:
      'Pagination: exact `links.next` path from the previous response (must start with /api/v1/transactions)',
  })
  @ApiQuery({
    name: 'cryptotransferOnly',
    required: false,
    description:
      'If true, adds transactiontype=CRYPTOTRANSFER on the mirror request',
    example: false,
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({
    status: 429,
    description: 'Mirror node rate limit — use Retry-After if provided',
  })
  async getMirrorArenaTransactions(
    @Query('limit') limitStr?: string,
    @Query('next') nextPath?: string,
    @Query('cryptotransferOnly') cryptotransferOnlyStr?: string,
  ) {
    const limit =
      limitStr !== undefined && limitStr !== ''
        ? Number.parseInt(limitStr, 10)
        : undefined;
    const cryptotransferOnly =
      cryptotransferOnlyStr === '1' ||
      cryptotransferOnlyStr?.toLowerCase() === 'true';
    return this.walletService.getMirrorArenaTransactionsForAdmin({
      limit: Number.isFinite(limit) ? limit : undefined,
      nextPath,
      cryptotransferOnly,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  ADMIN: View transaction history for a competition
  // ─────────────────────────────────────────────────────────────────

  @Get('competition/:competitionId/transactions')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Admin: Get Arena Coin transactions for a hackathon',
    description:
      'Lists all escrow, reward, and refund transactions linked to a competition.',
  })
  @ApiParam({
    name: 'competitionId',
    description: 'MongoDB ObjectId of the competition',
  })
  @ApiResponse({ status: 200 })
  async getCompetitionTransactions(
    @Param('competitionId') competitionId: string,
  ) {
    return this.walletService.getTransactionHistory(competitionId);
  }
}
