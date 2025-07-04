import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Request } from 'express';
import { Roles } from 'src/user/decorator/user-role.decorator';
import { UserRole } from 'utilitis/enums';
import { AuthRolesGuard } from 'src/user/guard/auth-role.guard';
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-users')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  async getDashboardSummary(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getDashboardSummary(lang as 'en' | 'ar');
  }

  @Get('dashboard-roles-count')
  @Roles(UserRole.ADMIN)
  async getUsersCountByRole(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getUsersCountByRole(lang as 'en' | 'ar');
  }

  @Get('dashboard-latest-users')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getLatestUsers(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Req() req: Request,
  ) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getLatestUsers(limit, lang as 'en' | 'ar');
  }

  @Get('student-teacher-counts')
  @Roles(UserRole.ADMIN)
  async getStudentTeacherCounts(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getStudentTeacherCounts(lang as 'en' | 'ar');
  }

  @Get('categories-course-counts')
  @Roles(UserRole.ADMIN)
  async getCategoriesWithCourseCounts(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getCategoriesWithCourseCounts(lang as 'en' | 'ar');
  }

  @Get('additional-analytics')
  @Roles(UserRole.ADMIN)
  async getAdditionalAnalytics(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getAdditionalAnalytics(lang as 'en' | 'ar');
  }

  @Get('courses')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  async getLastFiveMonthsRevenue(@Req() req: Request) {
    const lang = (req as any).lang || 'en';
    return this.adminService.getLastFiveMonthsRevenue(lang as 'en' | 'ar');
  }
}
