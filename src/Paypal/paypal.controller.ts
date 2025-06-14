// src/payment/paypal.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PaypalService } from './paypal.service';

class CreatePaymentDto {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
  }>;
}

@ApiTags('Payment')
@Controller('api/payment')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  /**
   * Initiate a new PayPal order (Sandbox).
   * Receives JSON payload for order creation.
   */
  @Post('paypal')
  @ApiOperation({ summary: 'Create a PayPal payment order' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 200, description: 'PayPal order created successfully' })
  @ApiResponse({ status: 500, description: 'Failed to create order' })
  async createPaypalPayment(@Body() paymentDto: CreatePaymentDto,): Promise<any> {
    return this.paypalService.createPayment({intent: paymentDto.intent,purchase_units: paymentDto.purchase_units,});
  }
}

