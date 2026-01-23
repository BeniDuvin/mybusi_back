import { Injectable } from '@nestjs/common';
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
    console.log(`Sending OTP ${otpCode} to ${phone}`);
    
    return true;
  }
}
