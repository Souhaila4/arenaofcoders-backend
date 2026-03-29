import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Classement public des utilisateurs par XP' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs classés par XP' })
  async getLeaderboard() {
    return this.userService.getLeaderboard();
  }

  @Patch('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register your Hedera wallet',
    description:
      'Save your Hedera account ID so that minted certificate NFTs are automatically transferred to your wallet.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet registered',
    schema: { example: { id: '...', hederaAccountId: '0.0.123456' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid Hedera account ID format' })
  async updateWallet(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.userService.updateWallet(userId, dto.hederaAccountId);
  }
}
