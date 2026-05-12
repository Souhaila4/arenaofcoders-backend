import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class MatchJobDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  topN?: number = 10;
}
