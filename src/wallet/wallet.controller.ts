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
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express-serve-static-core';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { MintCoinsDto } from './dto/mint-coins.dto';
import { MintDirectDto } from './dto/mint-direct.dto';

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

  // ─────────────────────────────────────────────────────────────────
  //  ADMIN: Mint coins into a company's wallet
  // ─────────────────────────────────────────────────────────────────

  @Post('admin/mint')
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('proof', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: Mint Arena Coins to a company wallet',
    description:
      "JSON body or multipart/form-data (same fields + optional file field `proof`). " +
      'If paymentReference is set (or a proof file is uploaded), an audit row is stored. ' +
      'The company must have already registered their hederaAccountId via PATCH /user/wallet.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        userId: '...',
        recipientAccountId: '0.0.123456',
        amount: 500,
        newBalance: 1000,
        transactionLogId: '...',
        hederaTransactionId: '0.0.7359554@1743295200.123456789',
        fundingAuditId: '...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Company has no Hedera wallet registered or bad request',
  })
  async mintCoins(
    @UploadedFile() proof: Express.Multer.File | undefined,
    @Body() dto: MintCoinsDto,
  ) {
    const ref = dto.paymentReference?.trim() ?? '';
    if (ref.length > 0 || proof != null) {
      if (ref.length === 0) {
        throw new BadRequestException(
          'paymentReference is required when uploading a proof file',
        );
      }
      return this.walletService.adminMintWithTrace(
        {
          userId: dto.userId.trim(),
          amount: dto.amount,
          paymentMethod: dto.paymentMethod?.trim() || 'BANK_TRANSFER',
          paymentReference: ref,
          fiatAmount: dto.fiatAmount,
          fiatCurrency: dto.fiatCurrency?.trim() || undefined,
          paymentDate: dto.paymentDate?.trim() || undefined,
          internalNotes: dto.internalNotes?.trim() || undefined,
          proofDocumentUrl: dto.proofDocumentUrl?.trim() || undefined,
        },
        proof,
      );
    }
    return this.walletService.adminMintToCompany(dto.userId, dto.amount);
  }

  @Post('admin/mint-direct')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: mint ARENA by Mongo user id or Hedera account id',
    description:
      'Same on-chain behaviour as POST /wallet/admin/mint (treasury → recipient wallet). ' +
      'Either `userId` (Mongo) or `hederaAccountId` (must match a user’s PATCH /user/wallet value).',
  })
  @ApiResponse({ status: 201 })
  async adminMintDirect(@Body() dto: MintDirectDto) {
    return this.walletService.adminMintDirect({
      amount: dto.amount,
      userId: dto.userId,
      hederaAccountId: dto.hederaAccountId,
    });
  }

  @Get('admin/funding/:fundingId/proof-file')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Admin: Download funding proof attachment' })
  @ApiParam({ name: 'fundingId', description: 'WalletAdminFunding id' })
  async downloadFundingProof(
    @Param('fundingId') fundingId: string,
  ): Promise<StreamableFile> {
    const { stream, filename, mime } =
      await this.walletService.getFundingProofFilePath(fundingId);
    return new StreamableFile(stream, {
      type: mime,
      disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
  }

  @Get('admin/funding')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Admin: Paginated audit of company funding / mint traces',
  })
  async listAdminFunding(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('beneficiaryUserId') beneficiaryUserId?: string,
  ) {
    const page = Math.max(parseInt(pageStr ?? '1', 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(limitStr ?? '20', 10) || 20, 1),
      100,
    );
    return this.walletService.listAdminWalletFundings({
      page,
      limit,
      beneficiaryUserId: beneficiaryUserId?.trim() || undefined,
    });
  }

  @Get('admin/mirror-transactions')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Admin: Arena Coin on-chain activity (Hedera Mirror)',
    description:
      'Lists token transfers for ARENA_COIN_TOKEN_ID involving the treasury account (HEDERA_ACCOUNT_ID), with cursor pagination compatible with the mobile admin dashboard.',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 429, description: 'Hedera Mirror rate limit' })
  async getAdminMirrorTransactions(
    @Query('limit') limitStr?: string,
    @Query('next') next?: string,
    @Query('cryptotransferOnly') cryptotransferOnly?: string,
  ) {
    const limit = Math.min(
      Math.max(parseInt(limitStr ?? '25', 10) || 25, 1),
      100,
    );
    const only =
      cryptotransferOnly === 'true' ||
      cryptotransferOnly === '1' ||
      cryptotransferOnly === 'yes';
    return this.walletService.getAdminMirrorTransactions({
      limit,
      next: next?.trim() || undefined,
      cryptotransferOnly: only,
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
