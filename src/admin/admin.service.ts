import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Course, CourseDocument } from 'src/course/schemas/course.schema';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Order, OrderDocument } from 'src/order/schema/order.schema';
import { UserRole } from 'utilitis/enums';
import { subMonths, format } from 'date-fns';

@Injectable()
export class AdminService {
  // Add language translations like in UserService
  // private roleTranslations = {
  //   ADMIN: { en: 'Admin', ar: 'مدير' },
  //   INSTRUCTOR: { en: 'Instructor', ar: 'مدرس' },
  //   STUDENT: { en: 'Student', ar: 'طالب' },
  //   TEACHER: { en: 'Teacher', ar: 'مدرس' }, // Added TEACHER since you use it
  // };
  private roleTranslations = {
    [UserRole.ADMIN]: { en: 'Admin', ar: 'مدير' },
    [UserRole.TEACHER]: { en: 'Teacher', ar: 'مدرس' },
    [UserRole.STUDENT]: { en: 'Student', ar: 'طالب' },
  };
  

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // Modified to include language support
  async findAllUsersForDashboard(
    page: number,
    limit: number,
    lang: 'en' | 'ar' = 'en',
    search?: string,
  ) {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('userName userEmail role createdAt isAccountverified')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    // Apply language translations
    const usersWithLang = users.map((user) => ({
      id: user._id,
      userName: user.userName,
      userEmail: user.userEmail,
      role: this.roleTranslations[user.role]?.[lang] || user.role,
      isAccountverified: user.isAccountverified,
      // createdAt: user.createdAt,
    }));

    return {
      users: usersWithLang,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Modified to include language support
  async getDashboardSummary(lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    const [totalUsers, totalCourses, totalOrders] = await Promise.all([
      this.userModel.countDocuments({}),
      this.courseModel.countDocuments({}),
      this.orderModel.countDocuments({}),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalOrders,
    };
  }

  async getUsersCountByRole(lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    
    const userCounts = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);
  
    // Initialize with all possible roles
    const result = {
      [UserRole.STUDENT]: 0,
      [UserRole.TEACHER]: 0,
      [UserRole.ADMIN]: 0,
    };
  
    userCounts.forEach((item) => {
      if (Object.values(UserRole).includes(item._id as UserRole)) {
        result[item._id as UserRole] = item.count;
      }
    });
  
    // Safely build translated result with fallbacks
    const translatedResult = {};
    
    Object.entries(result).forEach(([role, count]) => {
      const roleKey = role as UserRole;
      const translation = this.roleTranslations[roleKey]?.[lang] || roleKey;
      translatedResult[translation] = count;
    });
  
    return translatedResult;
  }

  // Modified to include language support
  async getLatestUsers(limit: number = 5, lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    const latestUsers = await this.userModel
      .find({})
      .select('userName userEmail role createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Apply language translations
    const usersWithLang = latestUsers.map((user) => ({
      ...user,
      role: this.roleTranslations[user.role]?.[lang] || user.role,
    }));

    return usersWithLang;
  }

  // Modified to include language support
  async getStudentTeacherCounts(lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    const [students, teachers] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.STUDENT }),
      this.userModel.countDocuments({ role: UserRole.TEACHER }),
    ]);

    return { students, teachers };
  }

  // Modified to include language support
  async getAdditionalAnalytics(lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
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

  // Modified to include language support
  async getAllCoursesWithDetails(
    page: number = 1,
    limit: number = 10,
    lang: 'en' | 'ar' = 'en',
    search?: string,
    categoryId?: string,
    instructorId?: string,
    isPublished?: boolean,
  ) {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query['title.en'] = { $regex: search, $options: 'i' };
    }
    if (categoryId) {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.category = new mongoose.Types.ObjectId(categoryId);
      } else {
        throw new BadRequestException(
          lang === 'ar' 
            ? 'معرف الفئة غير صالح' 
            : 'Invalid category ID format'
        );
      }
    }
    if (instructorId) {
      query.instructorId = instructorId;
    }
    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    const courses = await this.courseModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const validCourses = await Promise.all(
      courses.map(async (course) => {
        let categoryDetails = null;

        if (mongoose.Types.ObjectId.isValid(course.category)) {
          const category = await this.courseModel
            .findById(course.category)
            .select('title description')
            .lean();
          if (category) {
            categoryDetails = {
              _id: category._id,
              title: category.title[lang] || category.title.en,
              description: category.description[lang] || category.description.en,
            };
          }
        }

        const [studentsCount, revenue] = await Promise.all([
          this.getEnrolledStudentsCount(course._id),
          this.getCourseRevenue(course._id),
        ]);

        return {
          ...course,
          title: course.title[lang] || course.title.en,
          description: course.description[lang] || course.description.en,
          category: categoryDetails,
          studentsCount,
          revenue,
        };
      }),
    );

    const total = await this.courseModel.countDocuments(query);

    return {
      courses: validCourses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Modified to include language support
  async getCategoriesWithCourseCounts(lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    try {
      const categories = await this.courseModel.aggregate([
        {
          $match: {
            category: {
              $exists: true,
              $type: 'objectId'
            }
          }
        },
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
        {
          $unwind: {
            path: '$categoryData',
            preserveNullAndEmptyArrays: true
          }
        },
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
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            name: 1,
            courseCount: 1
          }
        },
        { $sort: { courseCount: -1 } }
      ]);

      // Apply language selection
      const localizedCategories = categories.map(cat => ({
        ...cat,
        name: cat.name[lang] || cat.name.en
      }));

      return localizedCategories;
    } catch (error) {
      console.error('Error in getCategoriesWithCourseCounts:', error);
      throw new BadRequestException(
        lang === 'ar' 
          ? 'حدث خطأ أثناء جلب الفئات' 
          : 'Error fetching categories'
      );
    }
  }

  // Modified to include language support
  async getLastFiveMonthsRevenue(lang: 'en' | 'ar' = 'en') {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';
    const now = new Date();
    const months = Array.from({ length: 5 }, (_, i) => {
      const date = subMonths(now, 4 - i);
      return {
        name: format(date, 'MMM'),
        fullName: format(date, 'MMMM'),
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
          month: month.name,
          monthFullName: month.fullName,
          revenue: result[0]?.total || 0,
        };
      }),
    );

    return revenueData;
  }

  // Helper methods remain the same
  private isValidObjectId(id: string | Types.ObjectId): boolean {
    if (id instanceof Types.ObjectId) return true;
    return (
      Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id
    );
  }

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
}