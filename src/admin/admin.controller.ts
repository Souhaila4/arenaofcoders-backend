import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Statistiques plateforme (réservé admin)' })
  @ApiResponse({ status: 200, description: 'Stats utilisateurs, spécialités, etc.' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users/recent')
  @ApiOperation({ summary: 'Derniers utilisateurs inscrits' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max 50' })
  @ApiResponse({ status: 200, description: 'Liste des derniers utilisateurs' })
  async getRecentUsers(@Query('limit') limit?: string) {
    const n = limit ? Math.min(parseInt(limit, 10) || 10, 50) : 10;
    return this.adminService.getRecentUsers(n);
  }

  @Get('users')
  @ApiOperation({ summary: 'Liste utilisateurs avec recherche et pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Email, prénom ou nom' })
  @ApiResponse({ status: 200, description: 'users, total, limit, offset' })
  async getUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search,
    });
  }

  @Post('n8n/webhook-test')
  @ApiOperation({ summary: 'Déclencher le webhook n8n (test) — proxy pour éviter CORS' })
  @ApiResponse({ status: 200, description: 'success: true si le workflow a répondu' })
  @ApiResponse({ status: 200, description: 'success: false + message en cas d’erreur ou timeout' })
  async triggerN8nWebhookTest() {
    return this.adminService.triggerN8nWebhookTest();
  }
}
