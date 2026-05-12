import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ProofEncryptionService } from './proof-encryption.service';
import { HederaProofAnchorService } from './hedera-proof-anchor.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, ProofEncryptionService, HederaProofAnchorService],
  exports: [WalletService], // Exported so CompetitionModule can use it
})
export class WalletModule {}
