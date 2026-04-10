import { Module } from '@nestjs/common';
import { EquipeController } from './equipe.controller';
import { EquipeService } from './equipe.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EquipeController],
  providers: [EquipeService],
  exports: [EquipeService],
})
export class EquipeModule {}
