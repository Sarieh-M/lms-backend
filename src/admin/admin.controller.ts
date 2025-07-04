import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  //============================================================================
  /**
   * @description نقطة نهاية لجلب جميع المستخدمين مع Pagination والبحث (لوحة التحكم).
   * @route GET /users/dashboard-users
   * @param page رقم الصفحة (افتراضي: 1).
   * @param limit عدد العناصر في الصفحة (افتراضي: 10).
   * @param search نص للبحث في اسم المستخدم أو البريد الإلكتروني (اختياري).
   * @returns كائن يحتوي على قائمة المستخدمين، العدد الإجمالي، رقم الصفحة، عدد العناصر في الصفحة، وإجمالي الصفحات.
   */
  @Get('dashboard-users')
  // استخدام DefaultValuePipe و ParseIntPipe للتحكم بقيم page و limit مباشرة في الـ Query
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // استخدم ValidationPipe لتحويل الأنواع والتحقق
  async getAllUsersForDashboard(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.findAllUsersForDashboard(page, limit, search);
  }

  //============================================================================
  /**
   * @description نقطة نهاية لجلب ملخص عام للوحة التحكم (إجمالي المستخدمين، الدورات، الطلبات).
   * @route GET /users/dashboard-summary
   * @returns كائن يحتوي على إحصائيات الأعداد الكلية.
   */
  @Get('dashboard-summary')
  async getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  //============================================================================
  /**
   * @description نقطة نهاية لجلب عدد المستخدمين مصنفين حسب الدور (طالب، معلم، مشرف).
   * @route GET /users/dashboard-roles-count
   * @returns كائن يمثل عدد المستخدمين لكل دور.
   */
  @Get('dashboard-roles-count')
  async getUsersCountByRole() {
    return this.adminService.getUsersCountByRole();
  }

  //============================================================================
  /**
   * @description نقطة نهاية لجلب أحدث المستخدمين المسجلين (مثلاً: آخر 5).
   * @route GET /users/dashboard-latest-users
   * @param limit عدد المستخدمين المطلوبين (افتراضي 5).
   * @returns قائمة بأحدث المستخدمين المسجلين.
   */
  @Get('dashboard-latest-users')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getLatestUsers(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getLatestUsers(limit);
  }
  @Get('student-teacher-counts')
  async getStudentTeacherCounts() {
    return this.adminService.getStudentTeacherCounts();
  }

  // NEW: Get categories with course counts
  @Get('categories-course-counts')
  async getCategoriesWithCourseCounts() {
    return this.adminService.getCategoriesWithCourseCounts();
  }

  // NEW: Get additional analytics (optional)
  @Get('additional-analytics')
  async getAdditionalAnalytics() {
    return this.adminService.getAdditionalAnalytics();
  }

  @Get('courses')
  async getAllCourses(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('instructorId') instructorId?: string,
    @Query('isPublished') isPublished?: boolean
  ) {
    return this.adminService.getAllCoursesWithDetails(
      page,
      limit,
      search,
      categoryId,
      instructorId,
      isPublished
    );
  }
  @Get('last-five-months')
  async getLastFiveMonthsRevenue() {
    return this.adminService.getLastFiveMonthsRevenue();
  }
}
