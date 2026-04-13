import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EMAIL_QUEUE } from './email.constants';
import { EmailService } from './email.service';

@Processor(EMAIL_QUEUE, {
  concurrency: 1, // Traite les tâches une par une
})
export class EmailQueueProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'send-pre-selection-email':
        const { email, firstName, competitionTitle } = job.data;
        console.log(`[EmailQueue] Traitement du job ${job.id} - Envoi de l'email de pré-sélection à ${email}`);
        
        try {
          await this.emailService.sendPreSelectionNotification(
            email,
            firstName,
            competitionTitle,
          );
          console.log(`[EmailQueue] Emial envoyé avec succès à ${email}`);
        } catch (error) {
          console.error(`[EmailQueue] Échec de l'envoi pour ${email}:`, error);
          throw error; // Allows BullMQ to retry based on job options
        }
        break;

      default:
        console.warn(`[EmailQueue] Job name non reconnu: ${job.name}`);
    }
  }
}
