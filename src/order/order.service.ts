import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {  OrderDto } from './dto/create-order.dto';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, Types } from 'mongoose';
import { PaypalService } from './../Paypal/paypal.service';
import { Ids } from 'utilitis/types';
import { StudentCourseService } from 'src/student-course/student-course.service';
import { CourseService } from 'src/course/course.service';
import { User } from 'src/user/schemas/user.schema';

@Injectable()
export class OrderService {
    
    constructor( private readonly configService: ConfigService,
        @InjectModel(Order.name)
        private readonly orderModel: Model<Order>,
        @InjectModel(User.name)
        private readonly userModel: Model<User>,             
        private readonly paypalService: PaypalService,
        private readonly studentCourseService: StudentCourseService,
        private readonly courseService: CourseService,
    ){ }
/**
 * Create order and paid by paypal
 * @param orderDto details of course
 * @param userId id of user
 * @returns URL of paypal for paid
 */
 public async createOrder(orderDto: OrderDto, userId: Types.ObjectId,lang: 'en' | 'ar' = 'en') {
      lang=['en','ar'].includes(lang)?lang:'en';

    try {
      const domain = this.configService.get<string>('DOMAIN');
    if (!domain) 
      {
        throw new InternalServerErrorException(lang === 'ar' ? 'DOMAIN غير مضبوط' : 'DOMAIN is not configured');
      }
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderDto.courseId.toString(),
          description:   orderDto.courseTitle,
          amount: {
            currency_code: 'USD',
            value: orderDto.coursePricing.toFixed(2),
          },
        }],
        application_context: {return_url: `${domain}/payment-return`,cancel_url: `${domain}/payment-cancel`,user_action: 'PAY_NOW',},
      };
      const paymentResponse = await this.paypalService.createPayment(payload);
      const approveUrl = paymentResponse.links.find(l => l.rel === 'approve')?.href;
    if (!approveUrl) 
      {
      throw new InternalServerErrorException(lang === 'ar' ? 'رابط الموافقة غير موجود' : 'Approval link not found');
      }
    const user = await this.userModel.findById(userId);
    if (!user)
       {
        throw new InternalServerErrorException(lang === 'ar' ? 'المستخدم غير موجود' : 'User not found');
       }
    const course = await this.courseService.getCourseDetailsByID(orderDto.courseId);
    if (!course) 
      {
        throw new InternalServerErrorException(lang === 'ar' ? 'الكورس غير موجود' : 'Course not found');
      }
      const newOrder = {
        userId,
        userName:      user.userName,
        userEmail:     user.userEmail,
        orderStatus:   'PENDING',
        paymentMethod: 'paypal',
        paymentStatus: 'PENDING',
        orderDate:     new Date(),
        paymentId:     paymentResponse.id,
        payerId:       '',              
        instructorId:  course.instructorId,
        instructorName:course.instructorName,
        courseImage:   course.image,    
        courseTitle:   orderDto.courseTitle,
        courseId:      orderDto.courseId,
        coursePricing: orderDto.coursePricing,
        paypalOrderId: paymentResponse.id,
      };
      await this.orderModel.create(newOrder);
      return { success: true, approveUrl };
    } catch (err) {
      console.error('Something went wrong while creating the order:', err);
    throw new InternalServerErrorException(
      lang === 'ar'
        ? 'حدث خطأ أثناء إنشاء الطلب'
        : 'Something went wrong while creating the order',
    );
    }
  }
    /**
     * Capture payment and finalize order
     * @param paymentId PayPal payment ID
     * @param payerId PayPal payer ID
     * @param orderId Order ID in the database
     * @returns Order confirmation response
     */
    public async capturePaymentAndFinalizeOrder(body: Ids, lang: 'en' | 'ar' = 'en') {
      lang=['en','ar'].includes(lang)?lang:'en';
  try {
    const order = await this.orderModel.findById(body.orderId);
    if (!order) {
      const message = lang === 'ar' ? 'الطلب غير موجود' : 'Order not found';
      throw new NotFoundException(message);
    }
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = body.paymentId;
    order.payerId = body.payerId;
    await order.save();
    await this.studentCourseService.UpdateStudentCourses(order);
    await this.courseService.updateCourseJustFieldStudent(order, lang);
    const successMessage = lang === 'ar' ? 'تم تأكيد الطلب بنجاح' : 'Order confirmed successfully';
    return {
      success: true,
      message: successMessage,
      data: order,
    };

  } catch (err) {
    console.error("Error in capturePaymentAndFinalizeOrder:", err);
    const errorMessage = lang === 'ar'
      ? 'فشل في تأكيد الطلب ومعالجة الدفع'
      : 'Failed to capture payment and finalize order';

    throw new InternalServerErrorException(errorMessage);
  }
}
}
