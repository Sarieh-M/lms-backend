import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaypalService {
  private readonly client: paypal.core.PayPalHttpClient;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const baseApiUrl = this.configService.get<string>('PAYPAL_BASE_API');

    if (!clientId || !clientSecret || !baseApiUrl) {
      throw new Error('Missing PayPal configuration in environment variables.');
    }

    // Custom PayPal Environment
    class CustomEnvironment extends paypal.core.PayPalEnvironment {
      constructor() {
        super(clientId, clientSecret);
      }
      public baseUrl(): string {
        return baseApiUrl;
      }
    }

    const environment = new CustomEnvironment();
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  public async createPayment(paymentData: paypal.orders.OrderRequest): Promise<paypal.orders.Order> {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody(paymentData);

    try {
      const response = await this.client.execute(request);
      return response.result;
    } catch (err) {
      console.error(' Error creating PayPal payment:', err);
      throw new InternalServerErrorException('PayPal payment creation failed.');
    }
  }
}