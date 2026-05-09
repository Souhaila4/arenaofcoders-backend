import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Specialty } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ example: 'Développeur Backend NestJS Senior' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'Nous recherchons un développeur backend expérimenté en NestJS, Prisma, MongoDB...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: Specialty,
    example: 'BACKEND',
    description:
      'Spécialité cible — filtre les candidats AVANT l\'appel IA pour économiser les tokens',
  })
  @IsEnum(Specialty)
  targetSpecialty: Specialty;

  @ApiPropertyOptional({ example: 'Remote · Tunis' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Arena Analytics' })
  @IsString()
  @IsNotEmpty()
  companyName: string;
}
