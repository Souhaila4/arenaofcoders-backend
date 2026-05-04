import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  AddDocumentDto,
} from './course.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────── ADMIN: CREATE ───────────────────

  async createCourse(
    adminId: string,
    dto: CreateCourseDto,
    thumbnailPath?: string,
  ) {
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        price: dto.price ?? 0,
        isPublished: dto.isPublished ?? false,
        thumbnailUrl: thumbnailPath ?? null,
        createdById: adminId,
      },
      include: {
        _count: { select: { enrollments: true, documents: true } },
      },
    });
  }

  // ─────────────────── ADMIN: UPDATE ───────────────────

  async updateCourse(
    courseId: string,
    dto: UpdateCourseDto,
    thumbnailPath?: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (thumbnailPath) data.thumbnailUrl = thumbnailPath;

    return this.prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        _count: { select: { enrollments: true, documents: true } },
      },
    });
  }

  // ─────────────────── ADMIN: DELETE ───────────────────

  async deleteCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { documents: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Delete uploaded files from disk
    for (const doc of course.documents) {
      const fullPath = path.join(process.cwd(), doc.fileUrl);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    if (course.thumbnailUrl) {
      const thumbPath = path.join(process.cwd(), course.thumbnailUrl);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    await this.prisma.course.delete({ where: { id: courseId } });
    return { deleted: true };
  }

  // ─────────────────── ADMIN: ADD DOCUMENT ───────────────────

  async addDocument(
    courseId: string,
    dto: AddDocumentDto,
    filePath: string,
    fileSize: number,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const fileType = this.classifyFileType(ext);

    return this.prisma.courseDocument.create({
      data: {
        courseId,
        title: dto.title,
        fileUrl: filePath,
        fileType,
        fileSize,
        order: dto.order ?? 0,
      },
    });
  }

  // ─────────────────── ADMIN: REMOVE DOCUMENT ───────────────────

  async removeDocument(documentId: string) {
    const doc = await this.prisma.courseDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Delete file from disk
    const fullPath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await this.prisma.courseDocument.delete({ where: { id: documentId } });
    return { deleted: true };
  }

  // ─────────────────── ADMIN: LIST ALL COURSES ───────────────────

  async getAdminCourses(query: CourseQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { enrollments: true, documents: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─────────────────── USER: LIST PUBLISHED COURSES ───────────────────

  async getCourses(query: CourseQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isPublished: true };
    if (query.category) where.category = query.category;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { enrollments: true, documents: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          ...(userId
            ? {
                enrollments: {
                  where: { userId },
                  select: { id: true },
                  take: 1,
                },
              }
            : {}),
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    // Add isEnrolled flag to each course
    const enriched = data.map((course: any) => ({
      ...course,
      isEnrolled: userId
        ? (course.enrollments?.length ?? 0) > 0
        : false,
      enrollmentCount: course._count?.enrollments ?? 0,
      documentCount: course._count?.documents ?? 0,
      enrollments: undefined, // Remove raw enrollment data
    }));

    return { data: enriched, total, page, limit };
  }

  // ─────────────────── USER: COURSE DETAIL ───────────────────

  async getCourseById(courseId: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: { select: { enrollments: true, documents: true } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        ...(userId
          ? {
              enrollments: {
                where: { userId },
                select: { id: true, joinedAt: true },
                take: 1,
              },
            }
          : {}),
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const isEnrolled = userId
      ? ((course as any).enrollments?.length ?? 0) > 0
      : false;

    return {
      ...course,
      isEnrolled,
      enrollmentCount: course._count?.enrollments ?? 0,
      documentCount: course._count?.documents ?? 0,
      enrollments: undefined,
    };
  }

  // ─────────────────── USER: ENROLL ───────────────────

  async enrollUser(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.isPublished)
      throw new BadRequestException('Course is not published');

    // Check if already enrolled
    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this course');

    await this.prisma.courseEnrollment.create({
      data: { courseId, userId },
    });

    return { enrolled: true, message: 'Successfully enrolled in the course' };
  }

  // ─────────────────── USER: MY ENROLLMENTS ───────────────────

  async getMyEnrollments(userId: string) {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: {
        course: {
          include: {
            _count: { select: { enrollments: true, documents: true } },
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return enrollments.map((e) => ({
      ...e.course,
      enrollmentCount: e.course._count?.enrollments ?? 0,
      documentCount: e.course._count?.documents ?? 0,
      isEnrolled: true,
      joinedAt: e.joinedAt,
    }));
  }

  // ─────────────────── USER: COURSE DOCUMENTS ───────────────────

  async getCourseDocuments(courseId: string, userId: string) {
    // Check enrollment
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (!enrollment)
      throw new ForbiddenException(
        'You must be enrolled in this course to view documents',
      );

    return this.prisma.courseDocument.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
  }

  // ─────────────────── HELPERS ───────────────────

  private classifyFileType(ext: string): string {
    const pdfExts = ['pdf'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (pdfExts.includes(ext)) return 'pdf';
    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (archiveExts.includes(ext)) return 'archive';
    return 'other';
  }
}
