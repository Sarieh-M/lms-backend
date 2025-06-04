import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import {  OrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, Types } from 'mongoose';
import { PaypalService } from './../Paypal/paypal.service';
import { Ids } from 'utilitis/types';
import { StudentCourseService } from 'src/student-course/student-course.service';
import { CourseService } from 'src/course/course.service';
import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage';
import { Domain } from 'domain';
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
 public async createOrder(orderDto: OrderDto, userId: Types.ObjectId) {
    try {
      
      const domain = this.configService.get<string>('DOMAIN');
      if (!domain) throw new InternalServerErrorException('DOMAIN غير مضبوط');

     
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
      if (!approveUrl) throw new Error('رابط الموافقة غير موجود');

    
      const user = await this.userModel.findById(userId);
      if (!user) throw new InternalServerErrorException('المستخدم غير موجود');

     
      const course = await this.courseService.getCourseDetailsByID(orderDto.courseId);
      if (!course) throw new InternalServerErrorException('الكورس غير موجود');

     
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
        'Something went wrong while creating the order',
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
    public async capturePaymentAndFinalizeOrder(body:Ids){
        try{
            const order = await this.orderModel.findById(body.orderId);
            if (!order) {
                throw new Error("Order not found");
            }
            order.paymentStatus = "paid";
            order.orderStatus = "confirmed";
            order.paymentId = body.paymentId;
            order.payerId = body.payerId;
            await order.save();
            await this.studentCourseService.UpdateStudentCourses(order);
            await this.courseService.updateCourseJustFieldStudent(order);
            return{
                success:true,
                message:"Order confirmed",
                data:order
            };
        }catch(err){
            console.error("Error in capturePaymentAndFinalizeOrder:", err);
            throw new Error("Failed to capture payment and finalize order");
        }
    }
}
