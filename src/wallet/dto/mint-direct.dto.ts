import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

function toPositiveNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return NaN;
  return n;
}

export class MintDirectDto {
  @ApiProperty({ example: 10 })
  @Transform(({ value }) => toPositiveNumber(value))
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: 'MongoDB ObjectId of recipient user' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Hedera account id if minting by wallet (must match PATCH /user/wallet)',
  })
  @IsOptional()
  @IsString()
  hederaAccountId?: string;
}
