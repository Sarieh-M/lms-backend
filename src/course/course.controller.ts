import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, BadRequestException, Query, Req } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Roles } from 'src/user/decorator/user-role.decorator';;
import { AuthRolesGuard } from 'src/user/guard/auth-role.guard';
import { CurrentUser } from 'src/user/decorator/current-user.decorator';
import { JWTPayloadType } from 'utilitis/types';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LectureDTO } from './dto/lecture-course.dto';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { Request } from 'express';

@ApiTags('Courses')
@Controller('api/course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('add-course')
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Add a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or TEACHER can add courses.' })
  @ApiBody({ description: 'Data for the new course', type: CreateCourseDto })
  public AddNewCourse(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createCourseDto: CreateCourseDto,
    @CurrentUser() user: JWTPayloadType,
    @Req()req: any
  ) {
    const lang = req.lang||'en';
    return this.courseService.AddNewCourse(createCourseDto, user.id,lang);
  }

  @Post(':idCourse/add-lecture-to-course')
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Add a new lecture to a course' })
  @ApiResponse({ status: 201, description: 'Lecture added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or TEACHER can add lectures.' })
  @ApiParam({ name: 'idCourse', type: String, description: 'Course ObjectId' })
  @ApiBody({ description: 'Data for the new lecture', type: LectureDTO })
  public AddLectureToCourse(
    @Param('idCourse') idCourse: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    lectureDto: LectureDTO,
    @Req() req: any,
  ) {
    const lang = req.lang||'en';

    if (!Types.ObjectId.isValid(idCourse)) {
      throw new BadRequestException({
        message:
          lang === 'ar'
            ? 'يوجد أخطاء'
            : 'There errors',
        errors: lang === 'ar' ? 'معرف الدورة غير صالح' : 'Invalid course ID format',
      });
    }

    return this.courseService.AddLectureToCourse(new Types.ObjectId(idCourse), lectureDto,lang);
  }

  @Patch('update/:id')
  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin', 'teacher')
  @ApiOperation({ summary: 'Update a course by ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or TEACHER can update courses.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the course to update',
    example: '642b821384f25c6d9f9c0b10',
  })
  @ApiBody({ description: 'Data to update the course', type: UpdateCourseDto })
  public updateCourseByID(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: JWTPayloadType,
    @Req() req: any,
  ) {
    const lang = req.lang||'en';

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        message:
          lang === 'ar'
            ? 'يوجد أخطاء'
            : 'There errors',
        errors: lang === 'ar' ? 'معرف الدورة غير صالح' : 'Invalid course ID format',
      });
    }

    return this.courseService.updateCourseByID(new Types.ObjectId(id), updateCourseDto, user.id,lang);
  }

  // ──────────────────────────────
  // Public Endpoints
  // ──────────────────────────────

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
    @Req() req?: any,
  ) {
    const lang = req.lang||'en';
    const user = req.user;
    return this.courseService.getAllCourses(
      category,
      level,
      primaryLanguage,
      sortBy,
      page,
      limit,
      useFilter,
      lang,
      user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details by ID' })
  @ApiResponse({ status: 200, description: 'Course details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the course to retrieve',
    example: '642b821384f25c6d9f9c0b10',
  })
  public getCourseDetailsByID(@Param('id') id: string, @Req() req: any) {
    const lang = req.lang||'en';

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        message:
          lang === 'ar'
            ? 'يوجد أخطاء'
            : 'There errors',
        errors: lang === 'ar' ? 'معرف الدورة غير صالح' : 'Invalid course ID format',
      });
    }

    return this.courseService.getCourseDetailsByID(new Types.ObjectId(id),lang);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin', 'teacher')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID', type: String })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async deleteCourse(@Param('id') id: string, @Req() req: any) {
  const lang = req.lang||'en';

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({
        message:
          lang === 'ar'
            ? 'يوجد أخطاء'
            : 'There errors',
        errors: lang === 'ar' ? 'معرف الدورة غير صالح' : 'Invalid course ID format',
      });
    }

    return this.courseService.deleteCourse(new Types.ObjectId(id),lang);
  }
}