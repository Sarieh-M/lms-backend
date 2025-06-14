import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CheckoutModule } from 'src/Paypal/paypal.module';
import { DatabaseModule } from 'src/db/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schema/order.schema';
import { UserModule } from 'src/user/user.module';
import { StudentCourseModule } from 'src/student-course/student-course.module';
import { CourseModule } from 'src/course/course.module';


@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports:[CheckoutModule,
    DatabaseModule,
    StudentCourseModule,
    CourseModule,
    UserModule,
    MongooseModule.forFeature([{name:Order.name,schema:OrderSchema}])
  ]
})
export class OrderModule {}
