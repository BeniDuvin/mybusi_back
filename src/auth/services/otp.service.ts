import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  constructor(private config: ConfigService) {}

  async generateOtp() {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    return { otpCode, otpExpiry };
  }

  async sendOtp(phone: string, otpCode: string) {
    const rawToken = this.config.get<string>('MTN_SMS_TOKEN');
    const sender = this.config.get<string>('MTN_SMS_SENDER');
    const callbackUrl = this.config.get<string>('MTN_SMS_CALLBACK_URL');

    if (!rawToken || !sender) {
      throw new InternalServerErrorException('SMS provider not configured');
    }

    const token = rawToken.startsWith('Token ')
      ? rawToken.replace(/^Token\s+/, '')
      : rawToken;

    const response = await fetch('https://sms.mtncongo.net/api/sms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        msg: `Votre code OTP est: ${otpCode}`,
        receivers: phone,
        sender,
        callback_url: callbackUrl,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('SMS provider error');
    }

    const result = (await response.json()) as { status?: string };
    if (result?.status && !['200', '201'].includes(result.status)) {
      throw new InternalServerErrorException('SMS provider rejected request');
    }

    return true;
  }
}
