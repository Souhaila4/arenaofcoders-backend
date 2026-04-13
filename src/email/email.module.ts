import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { EmailService } from './email.service';
import { EmailQueueService } from './email-queue.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EMAIL_QUEUE } from './email.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullBoardModule.forFeature({
      name: EMAIL_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [EmailService, EmailQueueService, EmailQueueProcessor],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
