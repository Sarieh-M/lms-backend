import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, BadRequestException, Query } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Roles } from 'src/user/decorator/user-role.decorator';
import { UserRole } from 'utilitis/enums';
import { AuthRolesGuard } from 'src/user/Guards/auth-role.guard';
import { CurrentUser } from 'src/user/decorator/current-user.decorator';
import { JWTPayloadType } from 'utilitis/types';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LectureDTO } from './dto/lecture-course.dto';
import { AuthGuard } from 'src/user/Guards/auth.guard';

@ApiTags('Courses')
@Controller('api/course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ─────────────────────────────────────────────────────────────────────
  // Admin & Teacher Endpoints
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Create a new course.
   *
   * Guards: AuthGuard, AuthRolesGuard(['admin','teacher'])
   * @body CreateCourseDto
   * @returns the created course
   */
  @Post('add-course')
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin','teacher')
  @ApiOperation({ summary: 'Add a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or TEACHER can add courses.' })
  @ApiBody({ description: 'Data for the new course', type: CreateCourseDto })
  public AddNewCourse(@Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),)
    createCourseDto: CreateCourseDto,@CurrentUser() user: JWTPayloadType,
  ) {
    return this.courseService.AddNewCourse(createCourseDto, user.id);
  }

  /**
   * Add a lecture to an existing course.
   *
   * Guards: AuthGuard, AuthRolesGuard(['admin','teacher'])
   * @param idCourse - ObjectId of the course
   * @body LectureDTO
   * @returns the updated course with new lecture
   */
  @Post(':idCourse/add-lecture-to-course')
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin','teacher')
  @ApiOperation({ summary: 'Add a new lecture to a course' })
  @ApiResponse({ status: 201, description: 'Lecture added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or TEACHER can add lectures.' })
  @ApiParam({ name: 'idCourse', type: String, description: 'Course ObjectId' })
  @ApiBody({ description: 'Data for the new lecture', type: LectureDTO })
  public AddLectureToCourse(@Param('idCourse') idCourse: string,
  @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),)
    lectureDto: LectureDTO,
  ) {
    if (!Types.ObjectId.isValid(idCourse)) {
      throw new BadRequestException('Invalid course ID format');
    }
    return this.courseService.AddLectureToCourse(new Types.ObjectId(idCourse),lectureDto,);
  }

  /**
   * Update an existing course by its ID.
   *
   * Guards: AuthGuard, AuthRolesGuard(['admin','teacher'])
   * @param id - ObjectId of the course
   * @body UpdateCourseDto
   * @returns the updated course
   */
  @Patch('update/:id')
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin','teacher')
  @ApiOperation({ summary: 'Update a course by ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or TEACHER can update courses.' })
  @ApiParam({name: 'id',description: 'The ID of the course to update',example: '642b821384f25c6d9f9c0b10',})
  @ApiBody({ description: 'Data to update the course', type: UpdateCourseDto })
  public updateCourseByID(@Param('id') id: string,
  @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),)
  updateCourseDto: UpdateCourseDto,@CurrentUser() user: JWTPayloadType,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid course ID format');
  }
  return this.courseService.updateCourseByID(new Types.ObjectId(id),updateCourseDto,user.id,);
}

// ─────────────────────────────────────────────────────────────────────
// Public Endpoints
// ─────────────────────────────────────────────────────────────────────

/**
 * Retrieve all courses.
 * Public: no authentication required.
 *
 * @returns array of all courses
 */
@Get()
@ApiOperation({ summary: 'Retrieve all courses' })
@ApiResponse({ status: 200, description: 'List of courses retrieved successfully' })
public getAllCourses(
  @Query('category') category?: string,
  @Query('level') level?: string,
  @Query('primaryLanguage') primaryLanguage?: string,
  @Query('sortBy') sortBy?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('useFilter') useFilter = false,
  @Query('lang') lang: 'en' | 'ar' = 'en')
  {
    return this.courseService.getAllCourses(category, level, primaryLanguage, sortBy, page, limit, useFilter, lang);
  }

/**
 * Get detailed information about a single course.
 * Public: no authentication required.
 *
 * @param id - ObjectId of the course
 * @returns the course document
 */
@Get(':id')
@ApiOperation({ summary: 'Get course details by ID' })
@ApiResponse({ status: 200, description: 'Course details retrieved successfully' })
@ApiResponse({ status: 404, description: 'Course not found' })
@ApiParam({name: 'id',description: 'The ID of the course to retrieve',example: '642b821384f25c6d9f9c0b10',})
public getCourseDetailsByID(@Param('id') id: string, @Query('lang') lang: 'en' | 'ar' = 'en') {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid course ID format');
  }
  return this.courseService.getCourseDetailsByID(new Types.ObjectId(id),lang);
}

@Delete('delete/:id')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin', 'teacher') // فقط الأدمن أو صاحب الكورس يسمح له بالحذف
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID', type: String })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async deleteCourse(@Param('id') id: string) {
    return this.courseService.deleteCourse(new Types.ObjectId(id));
  }
}