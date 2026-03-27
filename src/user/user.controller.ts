import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestCompanyRoleDto } from './dto/company-request.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Classement public des utilisateurs par XP' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs classés par XP' })
  async getLeaderboard() {
    return this.userService.getLeaderboard();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un profil utilisateur public' })
  @ApiResponse({ status: 200, description: 'Le profil utilisateur' })
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post('request-company-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Demander le rôle entreprise (Company)' })
  @ApiBody({ type: RequestCompanyRoleDto })
  @ApiResponse({ status: 201, description: 'Demande envoyée' })
  @ApiResponse({ status: 409, description: 'Vous avez déjà une demande en cours' })
  async requestCompanyRole(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestCompanyRoleDto,
  ) {
    return this.userService.requestCompanyRole(userId, dto);
  }
}
