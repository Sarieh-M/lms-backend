import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Request } from 'express';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-users')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getAllUsersForDashboard(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    const lang = (req as any).lang || 'en';
    return this.adminService.findAllUsersForDashboard(
      page,
      limit,
      lang as 'en' | 'ar',
      search,
    );
  }

  @Get('dashboard-summary')
  async getDashboardSummary(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getDashboardSummary(lang as 'en' | 'ar');
  }

  @Get('dashboard-roles-count')
  async getUsersCountByRole(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getUsersCountByRole(lang as 'en' | 'ar');
  }

  @Get('dashboard-latest-users')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getLatestUsers(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Req() req: Request
  ) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getLatestUsers(limit, lang as 'en' | 'ar');
  }

  @Get('student-teacher-counts')
  async getStudentTeacherCounts(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getStudentTeacherCounts(lang as 'en' | 'ar');
  }

  @Get('categories-course-counts')
  async getCategoriesWithCourseCounts(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getCategoriesWithCourseCounts(lang as 'en' | 'ar');
  }

  @Get('additional-analytics')
  async getAdditionalAnalytics(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getAdditionalAnalytics(lang as 'en' | 'ar');
  }

  @Get('courses')
  async getAllCourses(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('instructorId') instructorId?: string,
    @Query('isPublished') isPublished?: boolean,
  ) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getAllCoursesWithDetails(
      page,
      limit,
      lang as 'en' | 'ar',
      search,
      categoryId,
      instructorId,
      isPublished,
    );
  }

  @Get('revenue-trends')
  async getLastFiveMonthsRevenue(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getLastFiveMonthsRevenue(lang as 'en' | 'ar');
  }
}