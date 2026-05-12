import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { MatchJobDto } from './dto/match-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ─────────────────── ROUTES STATIQUES (Priorité) ───────────────────

  /** GET /jobs/favorites — Get all favorite talents for the company */
  @Get('favorites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.COMPANY])
  async getFavorites(@CurrentUser() company: User) {
    return this.jobsService.getFavoriteUsers(company.id);
  }

  /** POST /jobs/favorites/:userId/toggle — Add/Remove a talent from favorites */
  @Post('favorites/:userId/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.COMPANY])
  async toggleFavorite(
    @Param('userId') userId: string,
    @CurrentUser() company: User,
  ) {
    return this.jobsService.toggleFavorite(company.id, userId);
  }

  // ─────────────────── PUBLIC ───────────────────

  /** GET /jobs — List all active job postings */
  @Get()
  async getJobs() {
    return this.jobsService.getJobs();
  }

  // ─────────────────── ROUTES DYNAMIQUES (:id) ───────────────────

  /** GET /jobs/:id — Get a single job posting */
  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  /** GET /jobs/:id/matches — Get existing match results (COMPANY only) */
  @Get(':id/matches')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.COMPANY])
  async getJobMatches(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.getJobMatches(id, user.id);
  }

  // ─────────────────── ACTIONS COMPANY ───────────────────

  /** POST /jobs — Create a new job posting */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.COMPANY])
  async createJob(
    @Body() dto: CreateJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.createJob(dto, user.id);
  }

  /** POST /jobs/:id/match — Run AI matching for a job */
  @Post(':id/match')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.COMPANY])
  async matchCandidates(
    @Param('id') id: string,
    @Body() dto: MatchJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.matchCandidates(id, user.id, dto.topN);
  }
}
