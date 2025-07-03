import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from 'src/course/schemas/course.schema'; 


import * as bcrypt from 'bcrypt'; // لتشفير كلمة المرور
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Order, OrderDocument } from 'src/order/schema/order.schema';
import { UserRole } from 'utilitis/enums';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Course.name) private courseModel: Model<CourseDocument>, // لإحصائيات الدورات
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,   // لإحصائيات الطلبات
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
        users: users.map(user => ({
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
    async getDashboardSummary(): Promise<{ totalUsers: number; totalCourses: number; totalOrders: number }> {
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

        userCounts.forEach(item => {
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
}