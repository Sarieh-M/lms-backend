import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaypalService {
  private client: paypal.core.PayPalHttpClient;

  constructor(private readonly configService: ConfigService) {

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new Error('Missing PayPal configuration in environment');
    }


    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  /**
   * Creates a PayPal order.
   * @param paymentData - object matching PayPal OrdersCreate API schema
   * @returns the created order result
   */
  public async createPayment(paymentData: any): Promise<any> {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody(paymentData);
      const response = await this.client.execute(request);
      return response.result;
    } catch (err) {
      console.error('Error creating PayPal payment:', err);
      throw new InternalServerErrorException('Failed to create PayPal payment');
    }
  }
}



