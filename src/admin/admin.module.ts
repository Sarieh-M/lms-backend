import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { UsersService } from './admin.service';
import { UsersController } from './admin.controller';
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
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // إذا كنت ستستخدم UsersService في Module آخر
})
export class AdminModule {}