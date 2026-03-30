import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AntiCheatService } from './anti-cheat.service';

@Module({
    imports: [ConfigModule],
    providers: [AntiCheatService],
    exports: [AntiCheatService],
})
export class AntiCheatModule { }
