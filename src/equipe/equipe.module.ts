import { Module } from '@nestjs/common';
import { EquipeController } from './equipe.controller';
import { EquipeService } from './equipe.service';
import { AuthModule } from '../auth/auth.module';
import { StreamModule } from '../stream/stream.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AuthModule, StreamModule, AgentsModule],
  controllers: [EquipeController],
  providers: [EquipeService],
  exports: [EquipeService],
})
export class EquipeModule {}
