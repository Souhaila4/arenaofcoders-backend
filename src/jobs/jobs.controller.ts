import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { MatchJobDto } from './dto/match-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ─────────────────── PUBLIC ───────────────────

  /** GET /jobs — List all active job postings (public) */
  @Get()
  async getJobs() {
    return this.jobsService.getJobs();
  }

  /** GET /jobs/:id — Get a single job posting (public) */
  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  // ─────────────────── COMPANY ONLY ───────────────────

  /** POST /jobs — Create a new job posting (COMPANY only) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY' as any)
  async createJob(
    @Body() dto: CreateJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.createJob(dto, user.id);
  }

  /** POST /jobs/:id/match — Run AI matching for a job (COMPANY only) */
  @Post(':id/match')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY' as any)
  async matchCandidates(
    @Param('id') id: string,
    @Body() dto: MatchJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.matchCandidates(id, user.id, dto.topN);
  }

  /** GET /jobs/:id/matches — Get existing match results (COMPANY only) */
  @Get(':id/matches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY' as any)
  async getJobMatches(@Param('id') id: string) {
    return this.jobsService.getJobMatches(id);
  }
}
