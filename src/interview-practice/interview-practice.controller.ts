import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InterviewTurnDto } from './interview-practice.dto';
import { InterviewPracticeService } from './interview-practice.service';

@ApiTags('interview-practice')
@ApiBearerAuth('access-token')
@Controller('interview-practice')
@UseGuards(JwtAuthGuard)
export class InterviewPracticeController {
  constructor(private readonly interviewPractice: InterviewPracticeService) {}

  @Post('turn')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ interview: {} })
  @ApiOperation({
    summary: 'Mock interview — next recruiter reply (Groq)',
    description:
      'Send job context plus conversation history. Empty messages starts the interview; otherwise the last message must be from the candidate.',
  })
  @ApiResponse({ status: 200, description: 'Recruiter reply text' })
  @ApiResponse({ status: 400, description: 'Invalid conversation state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({
    status: 503,
    description: 'AI provider not configured or unavailable',
  })
  async turn(@Body() dto: InterviewTurnDto) {
    return this.interviewPractice.nextTurn(dto);
  }
}
