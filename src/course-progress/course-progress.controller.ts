import { Controller, Get, Post, Body, Patch, Param, HttpStatus, HttpCode, UseGuards, Query, Req } from '@nestjs/common';
import { CourseProgressService } from './course-progress.service';
import { CreateCourseProgressDto } from './dto/create-course-progress.dto';
import { CurrentUser } from 'src/user/decorator/current-user.decorator';
import { JWTPayloadType } from 'utilitis/types';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags,ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { AuthRolesGuard } from 'src/user/guard/auth-role.guard';
import { Roles } from 'src/user/decorator/user-role.decorator';
@ApiTags('Course Progress')
@Controller('api/course-progress')
export class CourseProgressController {
  constructor(
    private readonly courseProgressService: CourseProgressService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────
  // Student-only actions
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Mark a lecture as viewed for the current student.
   *
   * Guards: AuthGuard, AuthRolesGuard(['student'])
   * @returns the updated CourseProgress document
   */
  @Post('mark-lecture')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Mark lecture as viewed',description: 'Marks a lecture as viewed for the current student.',})
  @ApiResponse({status: HttpStatus.OK,description: 'Lecture marked as viewed successfully.',})
  @ApiResponse({status: HttpStatus.UNAUTHORIZED,description: 'Unauthorized request.',})
  async markLectureAsViewed(
    @Body() markLectureDto: CreateCourseProgressDto,
    @CurrentUser() userPayload: JWTPayloadType,
    @Req()req:any
  ) {
    const lang = req.lang||'en';
    return this.courseProgressService.markLectureAsViewed(markLectureDto,userPayload,lang);
  }

  /**
   * Retrieve the current progress of the current student for a specific course.
   *
   * Guards: AuthGuard, AuthRolesGuard(['student'])
   * @param idCourse - ObjectId of the course
   * @returns progress data or purchase requirement message
   */
  @Get('get-current-course-progress/:idCourse')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('student')
  @ApiOperation({summary: 'Get current course progress',description: 'Retrieves the logged-in student’s progress for a specific course.',})
  @ApiParam({name: 'idCourse',type: String,description: 'Unique identifier of the course',})
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Course progress retrieved successfully.',})
  @ApiResponse({status: HttpStatus.NOT_FOUND,description: 'Course not found or no progress recorded.',})
  async getCurrentCourseProgress(
    @Param('idCourse') idCourse: string,
    @CurrentUser() currentUser: JWTPayloadType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req()req:any
  ) {
    const lang = req.lang||'en';
    return this.courseProgressService.getCurrentCourseProgress(new Types.ObjectId(idCourse), currentUser, page, limit,lang);
  }

  /**
   * Reset the current student’s progress for a specific course.
   *
   * Guards: AuthGuard, AuthRolesGuard(['student'])
   * @param idCourse - ObjectId of the course
   * @returns confirmation of reset or not-found message
   */
  @Patch('reset-course-progress/:idCourse')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('student')
  @ApiOperation({summary: 'Reset course progress',description:'Resets the logged-in student’s progress for a specific course.',})
  @ApiParam({name: 'idCourse',type: String, description: 'Unique identifier of the course',})
  @ApiResponse({status: HttpStatus.OK,description: 'Course progress has been reset successfully.',})
  @ApiResponse({status: HttpStatus.NOT_FOUND,description: 'Course progress not found.',})
  async resetCurrentCourseProgress(
    @Param('idCourse') idCourse: string,
    @CurrentUser() currentUser: JWTPayloadType,
    @Req()req:any
  ) {
    const lang = req.lang||'en';
    return this.courseProgressService.resetCurrentCourseProgress(idCourse,currentUser.id,lang);
  }
}