import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Order, OrderSchema } from 'src/order/schema/order.schema';
import { Course, CourseSchema } from 'src/course/schemas/course.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema }, // لإحصائيات الدورات
      { name: Order.name, schema: OrderSchema },   // لإحصائيات الطلبات
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} // إذا كنت ستستخدم UsersService في Module آخر
