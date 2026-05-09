import { Module } from '@nestjs/common';
import { JobMatchingController } from './job-matching.controller';
import { JobMatchingService } from './job-matching.service';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [JobMatchingController],
  providers: [JobMatchingService],
})
export class JobMatchingModule {}
