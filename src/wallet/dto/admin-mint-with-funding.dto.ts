import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FundingPaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Données de traçabilité : comment l’entreprise a payé pour obtenir les Arena Coins */
export class FundingTraceDto {
  @ApiProperty({
    enum: FundingPaymentMethod,
    example: FundingPaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(FundingPaymentMethod)
  paymentMethod: FundingPaymentMethod;

  @ApiPropertyOptional({
    example: 1500.0,
    description: 'Montant payé en monnaie fiat (optionnel mais recommandé)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiatAmount?: number;

  @ApiPropertyOptional({
    example: 'EUR',
    description: 'Code devise ISO (3 lettres)',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  fiatCurrency?: string;

  @ApiProperty({
    example: 'VIR-2026-0142-BNP',
    description:
      'Référence bancaire, ID de transaction, ou identifiant unique du paiement',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  paymentReference: string;

  @ApiPropertyOptional({
    example: '2026-05-01T10:00:00.000Z',
    description: 'Date à laquelle le paiement a été émis / reçu',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({
    description:
      'URL d’une preuve (PDF reçu, capture) déjà hébergée, ou chemin /uploads/...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  proofDocumentUrl?: string;

  @ApiPropertyOptional({
    description: 'Notes internes visibles uniquement côté admin / audit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string;
}

export class AdminMintWithFundingDto {
  @ApiProperty({
    description: 'ID utilisateur (entreprise) qui reçoit les Arena Coins',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ type: FundingTraceDto })
  @ValidateNested()
  @Type(() => FundingTraceDto)
  funding: FundingTraceDto;
}
