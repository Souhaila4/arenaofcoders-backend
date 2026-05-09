import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JobMatchingService } from './job-matching.service';
import { CreateJobDto } from './dto/create-job.dto';
import { MatchJobDto } from './dto/match-job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobMatchingController {
  constructor(private readonly jobMatchingService: JobMatchingService) {}

  // ─────────────────── CRUD ───────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Publier une offre d\'emploi (COMPANY uniquement)',
    description:
      'Crée une nouvelle offre. Le champ targetSpecialty permet de filtrer les candidats avant le matching IA pour économiser les tokens.',
  })
  @ApiResponse({ status: 201, description: 'Offre créée avec succès' })
  @ApiResponse({ status: 403, description: 'Seules les entreprises peuvent publier' })
  async createJob(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobMatchingService.createJob(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les offres d\'emploi actives' })
  @ApiResponse({ status: 200, description: 'Liste des offres' })
  async getJobs() {
    return this.jobMatchingService.getJobs();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID de l\'offre' })
  @ApiOperation({ summary: 'Détail d\'une offre d\'emploi' })
  @ApiResponse({ status: 200, description: 'Détail de l\'offre' })
  @ApiResponse({ status: 404, description: 'Offre introuvable' })
  async getJobById(@Param('id') id: string) {
    return this.jobMatchingService.getJobById(id);
  }

  // ─────────────────── MATCHING IA ───────────────────

  @Post(':id/match')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'ID de l\'offre à matcher' })
  @ApiOperation({
    summary: 'Lancer le matching IA (COMPANY uniquement)',
    description:
      'Filtre les candidats par la spécialité de l\'offre, puis envoie leurs profils à l\'IA Groq pour un classement de pertinence.',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultats du matching avec ranking des candidats',
  })
  @ApiResponse({ status: 403, description: 'Accès réservé au créateur de l\'offre' })
  @ApiResponse({ status: 404, description: 'Offre introuvable' })
  @ApiResponse({ status: 503, description: 'GROQ_API_KEY non configurée' })
  async matchCandidates(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
    @Body() dto: MatchJobDto,
  ) {
    return this.jobMatchingService.matchCandidates(
      jobId,
      userId,
      dto.topN ?? 10,
    );
  }

  @Get(':id/matches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'ID de l\'offre' })
  @ApiOperation({
    summary: 'Voir les résultats du matching pour une offre',
    description:
      'Retourne le classement des candidats avec leurs profils complets et la justification IA.',
  })
  @ApiResponse({ status: 200, description: 'Résultats du matching' })
  @ApiResponse({ status: 404, description: 'Offre introuvable' })
  async getJobMatches(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    return this.jobMatchingService.getJobMatches(jobId);
  }
}
