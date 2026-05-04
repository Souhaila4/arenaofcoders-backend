import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  MinLength,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseCategory } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────
// CREATE COURSE
// ─────────────────────────────────────────────────────────────────

export class CreateCourseDto {
  @ApiProperty({
    description: 'Title of the course',
    example: 'Master Flutter Development',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Full description of the course',
    example:
      'Learn Flutter from scratch. Build beautiful mobile apps with Dart and Flutter framework.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiProperty({
    description: 'Category of the course',
    enum: CourseCategory,
    example: 'MOBILE_DEVELOPMENT',
  })
  @IsEnum(CourseCategory, {
    message:
      'category must be one of: PROGRAMMING, WEB_DEVELOPMENT, MOBILE_DEVELOPMENT, DATA_SCIENCE, CYBERSECURITY, DESIGN, DEVOPS, OTHER',
  })
  category: CourseCategory;

  @ApiPropertyOptional({
    description: 'Price of the course (display only, no wallet deduction)',
    example: 49.99,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({
    description: 'Whether the course is published and visible to users',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// UPDATE COURSE
// ─────────────────────────────────────────────────────────────────

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'Title of the course' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Description of the course' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category of the course',
    enum: CourseCategory,
  })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiPropertyOptional({ description: 'Price (display only)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ description: 'Publish or unpublish the course' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// QUERY / FILTER
// ─────────────────────────────────────────────────────────────────

export class CourseQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: CourseCategory,
  })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiPropertyOptional({
    description: 'Search by title',
    example: 'flutter',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

// ─────────────────────────────────────────────────────────────────
// ADD DOCUMENT
// ─────────────────────────────────────────────────────────────────

export class AddDocumentDto {
  @ApiProperty({
    description: 'Title of the document',
    example: 'Chapter 1 — Introduction to Dart',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({
    description: 'Display order of the document',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}
