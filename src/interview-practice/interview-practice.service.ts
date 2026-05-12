import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GroqAiService } from '../agents/groq-ai.service';
import { InterviewTurnDto } from './interview-practice.dto';

@Injectable()
export class InterviewPracticeService {
  constructor(private readonly groq: GroqAiService) {}

  private buildSystemPrompt(dto: InterviewTurnDto): string {
    const company =
      dto.companyName?.trim() ||
      'the hiring company (name not specified)';
    return `You are a senior technical recruiter conducting a realistic practice interview for ${company}.

Job title: ${dto.jobTitle.trim()}

Job description:
${dto.jobDescription.trim()}

Rules:
- Stay in character as the interviewer only. Do not narrate stage directions or meta commentary.
- Ask one focused question or give one short follow-up per reply (max ~150 words unless the candidate asks for detail).
- Tailor questions to this role: probe relevant experience, problem-solving, technologies mentioned in the description, and culture fit.
- If the candidate gives a vague answer, politely dig deeper once before moving on.
- Be professional, concise, and slightly challenging like a real technical screen — not hostile.`;
  }

  async nextTurn(dto: InterviewTurnDto): Promise<{ reply: string }> {
    if (!this.groq.hasApiKey()) {
      throw new ServiceUnavailableException(
        'Interview practice is disabled: GROQ_API_KEY is not configured on the server.',
      );
    }

    const msgs = dto.messages ?? [];
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.role !== 'user') {
        throw new BadRequestException(
          'The last message must be from the candidate (role "user").',
        );
      }
    }

    const system = this.buildSystemPrompt(dto);
    const apiMessages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [{ role: 'system', content: system }];

    for (const m of msgs) {
      apiMessages.push({ role: m.role, content: m.content });
    }

    if (msgs.length === 0) {
      apiMessages.push({
        role: 'user',
        content:
          'The candidate has just joined the video call. Open with a brief greeting, introduce yourself as their interviewer for this role, and ask your first interview question.',
      });
    }

    const reply = await this.groq.chatCompletion(apiMessages, {
      temperature: 0.55,
      maxTokens: 900,
    });

    return { reply };
  }
}
