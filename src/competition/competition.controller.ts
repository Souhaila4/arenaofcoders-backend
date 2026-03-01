import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CompetitionService } from './competition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateCompetitionDto,
  UpdateCompetitionDto,
  ChangeCompetitionStatusDto,
  JoinCompetitionDto,
  CompetitionQueryDto,
  SubmitWorkDto,
  SubmitCheckpointDto,
  ReviewCheckpointSubmissionDto,
} from './competition.dto';

@ApiTags('🏆 Competitions')
@ApiBearerAuth('access-token')
@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) { }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN — CREATE
  // ─────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new hackathon (Admin only)' })
  @ApiBody({ type: CreateCompetitionDto })
  @ApiResponse({ status: 201, description: 'Competition created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  async createCompetition(
    @Body() createCompetitionDto: CreateCompetitionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.competitionService.createCompetition(
      createCompetitionDto,
      adminUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN — UPDATE
  // ─────────────────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update competition details (Admin only)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiBody({ type: UpdateCompetitionDto })
  @ApiResponse({ status: 200, description: 'Competition updated' })
  @ApiResponse({ status: 400, description: 'Cannot update a running/completed competition' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async updateCompetition(
    @Param('id') competitionId: string,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.competitionService.updateCompetition(
      competitionId,
      updateCompetitionDto,
      adminUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN — CHANGE STATUS
  // ─────────────────────────────────────────────────────────────────

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Manually advance competition lifecycle (Admin only)',
    description: `Allowed: SCHEDULED → OPEN_FOR_ENTRY → RUNNING → SUBMISSION_CLOSED → EVALUATING → COMPLETED → ARCHIVED`,
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiBody({ type: ChangeCompetitionStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async changeCompetitionStatus(
    @Param('id') competitionId: string,
    @Body() changeStatusDto: ChangeCompetitionStatusDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.competitionService.changeCompetitionStatus(
      competitionId,
      changeStatusDto,
      adminUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN — ARCHIVE
  // ─────────────────────────────────────────────────────────────────

  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Archive a completed competition (Admin only)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'Competition archived' })
  @ApiResponse({ status: 400, description: 'Competition is not COMPLETED yet' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async archiveCompetition(@Param('id') competitionId: string): Promise<unknown> {
    return this.competitionService.archiveCompetition(competitionId);
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED — LIST (all competitions, optional filters)
  // ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all competitions' })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'OPEN_FOR_ENTRY', 'RUNNING', 'SUBMISSION_CLOSED', 'EVALUATING', 'COMPLETED', 'ARCHIVED'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['EASY', 'MEDIUM', 'HARD'] })
  @ApiQuery({ name: 'specialty', required: false, enum: ['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'DATA', 'BI', 'CYBERSECURITY', 'DESIGN', 'DEVOPS'] })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of competitions' })
  async findAllCompetitions(@Query() queryDto: CompetitionQueryDto) {
    return this.competitionService.findAllCompetitions(queryDto);
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED — LIST FOR ME (hackathons matching user's mainSpecialty)
  // ─────────────────────────────────────────────────────────────────

  @Get('for-me')
  @ApiOperation({
    summary: 'List hackathons for the current user',
    description:
      "Returns competitions relevant to the logged-in user based on their mainSpecialty.",
  })
  @ApiResponse({ status: 200, description: 'Paginated list of competitions for the user' })
  async findCompetitionsForMe(
    @Query() queryDto: CompetitionQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.competitionService.findCompetitionsForUser(userId, queryDto);
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED — LEADERBOARD (global)
  // ─────────────────────────────────────────────────────────────────

  @Get('leaderboard/global')
  @ApiOperation({
    summary: 'Global leaderboard — top users by wins',
    description: 'Returns the top users ranked by totalWins then totalChallenges.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Global leaderboard' })
  async getGlobalLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    return this.competitionService.getGlobalLeaderboard(limitNum);
  }

  // ─────────────────────────────────────────────────────────────────
  // ADMIN — HACKATHON IDEAS (from n8n webhook)
  // ─────────────────────────────────────────────────────────────────

  @Get('hackathon-ideas')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get AI-generated hackathon ideas (Admin only)',
    description: 'Calls the n8n webhook to generate hackathon ideas. Use when creating a new hackathon.',
  })
  @ApiResponse({ status: 200, description: 'List of ideas with title, score, description, target_market, feasibility' })
  @ApiResponse({ status: 400, description: 'Webhook unavailable or returned invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  async getHackathonIdeas() {
    return this.competitionService.getHackathonIdeas();
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED — GET ONE
  // ─────────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single competition by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'Competition details' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async findCompetition(@Param('id') competitionId: string) {
    return this.competitionService.findCompetitionById(competitionId);
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED — PARTICIPANTS
  // ─────────────────────────────────────────────────────────────────

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get participant list for a competition' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'List of participants with user profiles' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async getCompetitionParticipants(@Param('id') competitionId: string) {
    return this.competitionService.getCompetitionParticipants(competitionId);
  }

  // ─────────────────────────────────────────────────────────────────
  // SHARED — LEADERBOARD per competition
  // ─────────────────────────────────────────────────────────────────

  @Get(':id/leaderboard')
  @ApiOperation({
    summary: 'Leaderboard for a specific competition',
    description: 'Returns ranked participants ordered by status (SUBMITTED first) then join date.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'Competition leaderboard' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async getCompetitionLeaderboard(@Param('id') competitionId: string) {
    return this.competitionService.getLeaderboard(competitionId);
  }

  @Get(':id/top-participants')
  @ApiOperation({
    summary: 'Top participants by score (preselected)',
    description:
      'Returns the top N submitted participants for this hackathon, ordered by pipeline score. Use for preselection display.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: 'Top participants with scores' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async getTopParticipants(
    @Param('id') competitionId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit
      ? Math.min(Math.max(1, parseInt(limit, 10) || 5), 50)
      : 5;
    return this.competitionService.getTopParticipants(competitionId, limitNum);
  }

  // ─────────────────────────────────────────────────────────────────
  // TALENT — JOIN
  // ─────────────────────────────────────────────────────────────────

  @Post(':id/join')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join a competition (Talent / USER role)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiBody({ type: JoinCompetitionDto })
  @ApiResponse({ status: 201, description: 'Successfully joined the competition' })
  @ApiResponse({ status: 400, description: 'Competition not OPEN_FOR_ENTRY or capacity reached' })
  @ApiResponse({ status: 409, description: 'Already joined this competition' })
  async joinCompetition(
    @Param('id') competitionId: string,
    @CurrentUser('id') userId: string,
    @Body() _dto: JoinCompetitionDto,
  ) {
    return this.competitionService.joinCompetition(competitionId, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  // TALENT — MY PARTICIPATION
  // ─────────────────────────────────────────────────────────────────

  @Get(':id/my-participation')
  @ApiOperation({ summary: 'Check your own participation status in a competition' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'Your participation record' })
  @ApiResponse({ status: 404, description: 'You are not registered in this competition' })
  async getMyParticipation(
    @Param('id') competitionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.competitionService.getMyParticipation(competitionId, userId);
  }

  // ─────────────────────────────────────────────────────────────────
  // CHECKPOINTS — USER
  // ─────────────────────────────────────────────────────────────────

  @Get(':id/checkpoints')
  @ApiOperation({ summary: 'List checkpoints for a competition' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'List of checkpoints ordered by execution order' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async getCompetitionCheckpoints(@Param('id') competitionId: string) {
    return this.competitionService.getCompetitionCheckpoints(competitionId);
  }

  @Get(':id/my-checkpoint-submissions')
  @ApiOperation({ summary: 'Get your checkpoint submissions for a competition' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'Your checkpoint submissions with checkpoint details' })
  @ApiResponse({ status: 404, description: 'Competition not found or not registered' })
  async getMyCheckpointSubmissions(
    @Param('id') competitionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.competitionService.getMyCheckpointSubmissions(competitionId, userId);
  }

  @Patch(':id/checkpoints/:checkpointId/submit')
  @ApiOperation({ summary: 'Submit a checkpoint (proof URL and optional notes)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiParam({ name: 'checkpointId', description: 'MongoDB ObjectId of the checkpoint' })
  @ApiBody({ type: SubmitCheckpointDto })
  @ApiResponse({ status: 200, description: 'Checkpoint submitted' })
  @ApiResponse({ status: 400, description: 'Already submitted / disqualified / due date passed' })
  @ApiResponse({ status: 404, description: 'Not a participant or checkpoint not found' })
  async submitCheckpoint(
    @Param('id') competitionId: string,
    @Param('checkpointId') checkpointId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitCheckpointDto,
  ) {
    return this.competitionService.submitCheckpoint(
      competitionId,
      userId,
      checkpointId,
      dto,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // CHECKPOINTS — ADMIN REVIEW
  // ─────────────────────────────────────────────────────────────────

  @Get(':id/checkpoint-submissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all checkpoint submissions for review (Admin only)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'All submissions with participant and checkpoint info' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  async getCheckpointSubmissionsForReview(@Param('id') competitionId: string) {
    return this.competitionService.getCheckpointSubmissionsForReview(competitionId);
  }

  @Patch(':id/checkpoint-submissions/:submissionId/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or reject a checkpoint submission (Admin only)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiParam({ name: 'submissionId', description: 'MongoDB ObjectId of the submission' })
  @ApiBody({ type: ReviewCheckpointSubmissionDto })
  @ApiResponse({ status: 200, description: 'Submission reviewed' })
  @ApiResponse({ status: 400, description: 'Only SUBMITTED checkpoints can be reviewed' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  async reviewCheckpointSubmission(
    @Param('id') competitionId: string,
    @Param('submissionId') submissionId: string,
    @CurrentUser('id') adminUserId: string,
    @Body() dto: ReviewCheckpointSubmissionDto,
  ) {
    return this.competitionService.reviewCheckpointSubmission(
      competitionId,
      submissionId,
      adminUserId,
      dto,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // TALENT — SUBMIT WORK (GitHub link + Anti-Cheat)
  // ─────────────────────────────────────────────────────────────────

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit your GitHub repo link for a competition' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the competition' })
  @ApiResponse({ status: 200, description: 'Submission result (accepted or disqualified)' })
  @ApiResponse({ status: 400, description: 'Already submitted / disqualified / competition not running' })
  @ApiResponse({ status: 404, description: 'Not a participant' })
  async submitWork(
    @Param('id') competitionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitWorkDto,
  ) {
    return this.competitionService.submitWork(competitionId, userId, dto.githubUrl);
  }
}
