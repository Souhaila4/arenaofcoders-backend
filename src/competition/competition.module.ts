import { Module } from '@nestjs/common';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { AntiCheatModule } from '../anti-cheat/anti-cheat.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AuthModule, EmailModule, AntiCheatModule, AgentsModule],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}
