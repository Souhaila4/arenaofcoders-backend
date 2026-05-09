import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MintCoinsDto {
  @ApiPropertyOptional({
    example: 'user_id_here',
    description:
      'MongoDB user id of the recipient (use this or hederaAccountId, not both)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: '0.0.123456',
    description:
      'Hedera account ID already registered on the user profile (use this or userId, not both)',
  })
  @IsOptional()
  @IsString()
  hederaAccountId?: string;

  @ApiProperty({
    example: 500,
    description:
      'Arena Coins to mint and transfer. Recipient must have hederaAccountId on file.',
  })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  amount: number;
}
