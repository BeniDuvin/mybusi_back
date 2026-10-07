export type PaymentIntentRequest = {
  paymentId: string;
  storeId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  returnUrl: string;
  callbackUrl: string;
};

export type PaymentIntent = {
  providerReference: string;
  checkoutUrl: string;
};

export type ProviderPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

/** Provider boundary keeps subscription billing independent from the chosen gateway contract. */
export interface PaymentProvider {
  createPayment(request: PaymentIntentRequest): Promise<PaymentIntent>;
  verifyPayment(providerReference: string): Promise<ProviderPaymentStatus>;
}
