import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE } from './email.constants';

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  /**
   * Adds a pre-selection notification email job to the queue
   */
  async addPreSelectionEmailJob(payload: {
    email: string;
    firstName: string;
    competitionTitle: string;
  }) {
    // Add the job to the BullMQ queue
    await this.emailQueue.add('send-pre-selection-email', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
