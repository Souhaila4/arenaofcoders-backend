import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MatchJobDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Nombre max de candidats à retourner (défaut 10)',
  })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  topN?: number;
}
