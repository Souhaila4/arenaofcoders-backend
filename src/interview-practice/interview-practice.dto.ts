import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class InterviewExchangeDto {
  @IsIn(['assistant', 'user'])
  role!: 'assistant' | 'user';

  @IsString()
  @MaxLength(16_000)
  content!: string;
}

export class InterviewTurnDto {
  @IsString()
  @MaxLength(400)
  jobTitle!: string;

  @IsString()
  @MaxLength(32_000)
  jobDescription!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsArray()
  @ArrayMaxSize(48)
  @ValidateNested({ each: true })
  @Type(() => InterviewExchangeDto)
  messages!: InterviewExchangeDto[];
}
