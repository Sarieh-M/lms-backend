import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Course, CourseDocument } from 'src/course/schemas/course.schema';

import * as bcrypt from 'bcrypt'; // لتشفير كلمة المرور
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Order, OrderDocument } from 'src/order/schema/order.schema';
import { UserRole } from 'utilitis/enums';
import { subMonths, format } from 'date-fns';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>, // لإحصائيات الدورات
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    // @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    // لإحصائيات الطلبات
  ) {}

  //============================================================================
  /**
   * @description تجلب قائمة المستخدمين مع Pagination، وتصفية (اختياري)، وترجع بيانات محددة للمستخدمين.
   * @param page رقم الصفحة المطلوب.
   * @param limit عدد العناصر في الصفحة الواحدة.
   * @param search نص للبحث في اسم المستخدم أو البريد الإلكتروني.
   * @returns كائن يحتوي على قائمة المستخدمين، العدد الإجمالي، رقم الصفحة، عدد العناصر في الصفحة، وإجمالي الصفحات.
   */
  async findAllUsersForDashboard(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      // البحث في userName أو userEmail (يمكنك إضافة حقول أخرى للبحث)
      query.$or = [
        { userName: { $regex: search, $options: 'i' } }, // 'i' لجعل البحث غير حساس لحالة الأحرف
        { userEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('userName userEmail role createdAt isAccountverified') // اختر الحقول المطلوبة فقط
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }) // ترتيب تنازلي حسب تاريخ الإنشاء (الأحدث أولاً)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users: users.map((user) => ({
        id: user._id, // إضافة ID للمستخدم
        userName: user.userName,
        userEmail: user.userEmail,
        role: user.role,
        // joinDate: user.createdAt, // createdAt هو تاريخ الانضمام (من timestamps)
        isAccountverified: user.isAccountverified, // حالة التحقق من الحساب
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  //============================================================================
  /**
   * @description تجلب إحصائيات عامة للوحة التحكم: إجمالي المستخدمين، الدورات، والطلبات.
   * @returns كائن يحتوي على عدد المستخدمين، الدورات، والطلبات.
   */
  async getDashboardSummary(): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalOrders: number;
  }> {
    const [totalUsers, totalCourses, totalOrders] = await Promise.all([
      this.userModel.countDocuments({}),
      this.courseModel.countDocuments({}),
      this.orderModel.countDocuments({}),
    ]);
    return { totalUsers, totalCourses, totalOrders };
  }

  //============================================================================
  /**
   * @description تجلب عدد المستخدمين لكل دور (طالب، معلم، مشرف).
   * @returns كائن يمثل عدد المستخدمين لكل دور.
   */
  async getUsersCountByRole(): Promise<Record<UserRole, number>> {
    const userCounts = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<UserRole, number> = {
      [UserRole.STUDENT]: 0,
      [UserRole.TEACHER]: 0,
      [UserRole.ADMIN]: 0,
    };

    userCounts.forEach((item) => {
      if (Object.values(UserRole).includes(item._id as UserRole)) {
        result[item._id as UserRole] = item.count;
      }
    });

    return result;
  }

  //============================================================================
  /**
   * @description تجلب أحدث عدد محدد من المستخدمين (مثلاً: آخر 5 مستخدمين مسجلين).
   * @param limit الحد الأقصى لعدد المستخدمين المراد جلبهم (افتراضي 5).
   * @returns قائمة بأحدث المستخدمين المسجلين، مع حقول محددة.
   */
  async getLatestUsers(limit: number = 5) {
    const latestUsers = await this.userModel
      .find({})
      .select('userName userEmail role createdAt')
      .sort({ createdAt: -1 }) // الأحدث أولاً
      .limit(limit)
      .exec();

    return latestUsers;
  }
  // NEW: Get student and teacher counts
  async getStudentTeacherCounts() {
    const [students, teachers] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.STUDENT }),
      this.userModel.countDocuments({ role: UserRole.TEACHER }),
    ]);

    return { students, teachers };
  }

  // NEW: Get additional analytics (optional)
  async getAdditionalAnalytics() {
    const [totalRevenue, completedCourses] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$coursePricing' } } },
      ]),
      this.courseModel.countDocuments({ completed: true }),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      completedCourses,
    };
  }

  async getAllCoursesWithDetails(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: string,
    instructorId?: string,
    isPublished?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Build the query
    if (search) {
      query['title.en'] = { $regex: search, $options: 'i' };
    }
    if (categoryId) {
      // Ensure categoryId is a valid ObjectId if provided
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.category = new mongoose.Types.ObjectId(categoryId);
      } else {
        // Handle invalid categoryId (either ignore or throw error)
        throw new BadRequestException('Invalid category ID format');
      }
    }
    if (instructorId) {
      query.instructorId = instructorId;
    }
    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    // First get courses without population to filter invalid categories
    const courses = await this.courseModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Then manually populate valid categories
    const validCourses = await Promise.all(
      courses.map(async (course) => {
        let categoryDetails = null;

        // Only try to populate if category is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(course.category)) {
          const category = await this.courseModel
            .findById(course.category)
            .select('title description')
            .lean();
          if (category) {
            categoryDetails = {
              _id: category._id,
              title: category.title,
              description: category.description,
            };
          }
        }

        const [studentsCount, revenue] = await Promise.all([
          this.getEnrolledStudentsCount(course._id),
          this.getCourseRevenue(course._id),
        ]);

        return {
          ...course,
          category: categoryDetails, // Replace with populated data or null
          studentsCount,
          revenue,
        };
      }),
    );

    // Count total documents (with same query filters)
    const total = await this.courseModel.countDocuments(query);

    return {
      courses: validCourses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private isValidObjectId(id: string | Types.ObjectId): boolean {
    if (id instanceof Types.ObjectId) return true;
    return (
      Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id
    );
  }

  // Get enrolled students count (works with your schema)
  private async getEnrolledStudentsCount(
    courseId: Types.ObjectId,
  ): Promise<number> {
    const course = await this.courseModel
      .findById(courseId)
      .select('students')
      .lean()
      .exec();
    return course?.students?.length || 0;
  }
  // In your admin.service.ts

  private async getCourseRevenue(courseId: Types.ObjectId): Promise<number> {
    try {
      const result = await this.orderModel.aggregate([
        {
          $match: {
            courseId: courseId,
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$coursePricing' },
          },
        },
      ]);
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating course revenue:', error);
      return 0;
    }
  }

  async getCategoriesWithCourseCounts() {
    try {
      return await this.courseModel.aggregate([
        // Stage 1: Only include valid ObjectId categories
        {
          $match: {
            category: {
              $exists: true,
              $type: 'objectId' // Only ObjectId types
            }
          }
        },
        // Stage 2: Lookup category data safely
        {
          $lookup: {
            from: 'categories',
            let: { categoryId: '$category' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$categoryId'] }
                }
              }
            ],
            as: 'categoryData'
          }
        },
        // Stage 3: Unwind safely
        {
          $unwind: {
            path: '$categoryData',
            preserveNullAndEmptyArrays: true
          }
        },
        // Stage 4: Group by category
        {
          $group: {
            _id: '$category',
            name: {
              $first: {
                en: '$categoryData.title.en',
                ar: '$categoryData.title.ar'
              }
            },
            courseCount: { $sum: 1 }
          }
        },
        // Stage 5: Format output
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            name: 1,
            courseCount: 1
          }
        },
        // Stage 6: Sort
        { $sort: { courseCount: -1 } }
      ]);
    } catch (error) {
      console.error('Error in getCategoriesWithCourseCounts:', error);
      return [];
    }
  }
  //   async getCategoryIdByName(categoryName: string): Promise<Types.ObjectId> {
  //     const category = await this.categoryModel.findOne(
  //       { 'title.en': categoryName },
  //       { _id: 1 }
  //     ).lean().exec();

  //     if (!category) {
  //       throw new NotFoundException(`Category "${categoryName}" not found`);
  //     }

  //     return category._id;
  //   }
  async getLastFiveMonthsRevenue() {
    const now = new Date();
    const months = Array.from({ length: 5 }, (_, i) => {
      const date = subMonths(now, 4 - i); // Get months from oldest to newest
      return {
        name: format(date, 'MMM'), // "Jan", "Feb", etc.
        fullName: format(date, 'MMMM'), // "January", "February", etc.
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      };
    });

    const revenueData = await Promise.all(
      months.map(async (month) => {
        const result = await this.orderModel.aggregate([
          {
            $match: {
              paymentStatus: 'paid',
              orderDate: { $gte: month.start, $lte: month.end },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$coursePricing' },
            },
          },
        ]);
        return {
          month: month.name, // Short name (Jan, Feb)
          revenue: result[0]?.total || 0,
        };
      }),
    );

    return revenueData;
  }
}
