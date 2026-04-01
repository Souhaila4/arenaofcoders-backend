import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { StreamModule } from './stream/stream.module';
import { AdminModule } from './admin/admin.module';
import { ScraperModule } from './scraper/scraper.module';
import { CompetitionModule } from './competition/competition.module';
import { NotificationModule } from './notification/notification.module';
import { CertificateModule } from './certificate/certificate.module';
import { WalletModule } from './wallet/wallet.module';
import { AntiCheatModule } from './anti-cheat/anti-cheat.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(process.cwd(), '.env'),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ScraperModule,
    AuthModule,
    UserModule,
    StreamModule,
    AdminModule,
    CompetitionModule,
    NotificationModule,
    CertificateModule,
    WalletModule,
    AntiCheatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
