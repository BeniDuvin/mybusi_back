import { ServiceUnavailableException } from '@nestjs/common';
import {
  PaymentIntent,
  PaymentIntentRequest,
  PaymentProvider,
  ProviderPaymentStatus,
} from './payment-provider';

/** Disabled adapter placeholder: connect only after the exact K-Pay API contract is confirmed. */
export class KPayProvider implements PaymentProvider {
  async createPayment(_request: PaymentIntentRequest): Promise<PaymentIntent> {
    throw new ServiceUnavailableException('Le paiement K-Pay n’est pas encore configuré');
  }

  async verifyPayment(_providerReference: string): Promise<ProviderPaymentStatus> {
    throw new ServiceUnavailableException('La vérification K-Pay n’est pas encore configurée');
  }
}
