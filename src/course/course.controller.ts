import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CourseService } from './course.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  AddDocumentDto,
} from './course.dto';
import * as path from 'path';
import * as fs from 'fs';

// Helpers to generate unique filenames
function generateFilename(originalname: string): string {
  const ext = path.extname(originalname);
  const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e6);
  return `${uniqueId}${ext}`;
}

// Ensure upload directories exist
const coursesDir = path.join(process.cwd(), 'uploads', 'courses');
const thumbnailsDir = path.join(coursesDir, 'thumbnails');
if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir))
  fs.mkdirSync(thumbnailsDir, { recursive: true });

@ApiTags('courses')
@Controller('courses')
@ApiBearerAuth('access-token')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ═══════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: thumbnailsDir,
        filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Course created' })
  async createCourse(
    @Req() req: any,
    @Body() dto: CreateCourseDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const thumbnailPath = thumbnail
      ? `/uploads/courses/thumbnails/${thumbnail.filename}`
      : undefined;
    return this.courseService.createCourse(req.user.id, dto, thumbnailPath);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: thumbnailsDir,
        filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiConsumes('multipart/form-data')
  async updateCourse(
    @Param('id') courseId: string,
    @Body() dto: UpdateCourseDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const thumbnailPath = thumbnail
      ? `/uploads/courses/thumbnails/${thumbnail.filename}`
      : undefined;
    return this.courseService.updateCourse(courseId, dto, thumbnailPath);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async deleteCourse(@Param('id') courseId: string) {
    return this.courseService.deleteCourse(courseId);
  }

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: coursesDir,
        filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per document
    }),
  )
  @ApiOperation({ summary: 'Upload a document to a course (Admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiConsumes('multipart/form-data')
  async addDocument(
    @Param('id') courseId: string,
    @Body() dto: AddDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    const filePath = `/uploads/courses/${file.filename}`;
    return this.courseService.addDocument(courseId, dto, filePath, file.size);
  }

  @Delete('documents/:docId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Remove a document (Admin only)' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  async removeDocument(@Param('docId') docId: string) {
    return this.courseService.removeDocument(docId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'List all courses including unpublished (Admin)' })
  async getAdminCourses(@Query() query: CourseQueryDto) {
    return this.courseService.getAdminCourses(query);
  }

  // ═══════════════════════════════════════════════════════════
  // USER ENDPOINTS
  // ═══════════════════════════════════════════════════════════

  @Get('my-enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get courses the current user is enrolled in' })
  async getMyEnrollments(@Req() req: any) {
    return this.courseService.getMyEnrollments(req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all published courses' })
  async getCourses(@Query() query: CourseQueryDto, @Req() req: any) {
    return this.courseService.getCourses(query, req.user?.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course details' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async getCourseById(@Param('id') courseId: string, @Req() req: any) {
    return this.courseService.getCourseById(courseId, req.user?.id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully' })
  async enrollInCourse(@Param('id') courseId: string, @Req() req: any) {
    return this.courseService.enrollUser(courseId, req.user.id);
  }

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course documents (enrolled users only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async getCourseDocuments(@Param('id') courseId: string, @Req() req: any) {
    return this.courseService.getCourseDocuments(courseId, req.user.id);
  }
}
