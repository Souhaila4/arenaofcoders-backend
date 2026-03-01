import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';

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
}
