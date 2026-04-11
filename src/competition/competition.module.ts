import { Module, forwardRef } from '@nestjs/common';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { AntiCheatModule } from '../anti-cheat/anti-cheat.module';
import { AgentsModule } from '../agents/agents.module';
import { WalletModule } from '../wallet/wallet.module';
import { EquipeModule } from '../equipe/equipe.module';
import { StreamModule } from '../stream/stream.module';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    AntiCheatModule,
    AgentsModule,
    WalletModule,
    StreamModule,
    forwardRef(() => EquipeModule),
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}
