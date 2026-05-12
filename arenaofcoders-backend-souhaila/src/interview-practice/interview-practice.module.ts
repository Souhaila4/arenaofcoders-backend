import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AuthModule } from '../auth/auth.module';
import { InterviewPracticeController } from './interview-practice.controller';
import { InterviewPracticeService } from './interview-practice.service';

@Module({
  imports: [AuthModule, AgentsModule],
  controllers: [InterviewPracticeController],
  providers: [InterviewPracticeService],
})
export class InterviewPracticeModule {}
