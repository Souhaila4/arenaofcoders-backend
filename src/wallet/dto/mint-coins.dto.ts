import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

function toPositiveNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return NaN;
  return n;
}

function toOptionalNonNegNumber(value: unknown): number | undefined {
  if (value === '' || value === undefined || value === null) return undefined;
  const n = toPositiveNumber(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export class MintCoinsDto {
  @ApiProperty({
    example: 'user_id_here',
    description:
      'ID (MongoDB ObjectId) of the company user to receive the coins',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 500,
    description:
      'Number of Arena Coins to mint into the company wallet. The company must have a hederaAccountId registered.',
  })
  @Transform(({ value }) => toPositiveNumber(value))
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description:
      'When set with paymentReference (or proof file), mint is logged for audit.',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalNonNegNumber(value))
  @IsNumber()
  @Min(0)
  fiatAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiatCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proofDocumentUrl?: string;
}
