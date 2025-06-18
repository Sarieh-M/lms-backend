import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import {  OrderDto } from './dto/create-order.dto';
import { CurrentUser } from 'src/user/decorator/current-user.decorator';
import { Ids, JWTPayloadType } from 'utilitis/types';
import { Roles } from 'src/user/decorator/user-role.decorator';
import { UserRole } from 'utilitis/enums';
import { AuthRolesGuard } from 'src/user/guard/auth-role.guard';
import { Types } from 'mongoose';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService,
  ) {}

  @Post('create-order')
  @Roles(UserRole.ADMIN,UserRole.STUDENT,UserRole.TEACHER)
  @UseGuards(AuthRolesGuard)
  public async createOrder(@Body() orderDto:OrderDto,@CurrentUser() payload:JWTPayloadType,@Req()req:any ){
    const lang = req.lang||'en';
    return await this.orderService.createOrder(orderDto,payload.id,lang);
  }

  @Post('capture-payment')
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  @UseGuards(AuthRolesGuard)
  public async capturePaymentAndFinalizeOrder(@Body() body:Ids,@Req()req:any ){
    const lang = req.lang||'en';
    return await this.orderService.capturePaymentAndFinalizeOrder(body,lang);
  }


}
