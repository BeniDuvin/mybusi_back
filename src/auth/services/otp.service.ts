import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  constructor(private config: ConfigService) {}

  async generateOtp() {
    const otpCode = randomInt(100000, 1000000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    return { otpCode, otpExpiry };
  }

  /** Sends verification and recovery codes through configured SMTP for account security workflows. */
  async sendEmailOtp(email: string, code: string, purpose: 'verification' | 'password-reset') {
    const { transporter, from } = this.createTransporter();
    const subject = purpose === 'verification' ? 'Vérification de votre adresse MyBusi' : 'Réinitialisation de votre mot de passe MyBusi';
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text: `Votre code MyBusi est ${code}. Il expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
    });
  }

  /** Sends a store invitation with mailbox verification and first-login instructions. */
  async sendMemberInvitation(input: {
    email: string;
    storeName: string;
    role: string;
    verificationCode?: string;
    temporaryPassword?: string;
  }) {
    const { transporter, from } = this.createTransporter();
    const verification = input.verificationCode
      ? `Code de vérification : ${input.verificationCode} (valide 10 minutes).`
      : '';
    const credentials = input.temporaryPassword
      ? `Mot de passe temporaire : ${input.temporaryPassword}. Après vérification de votre e-mail, vous devrez le changer avant d’accéder à l’application.`
      : 'Connectez-vous avec votre compte MyBusi habituel pour accéder à cette boutique.';
    await transporter.sendMail({
      from,
      to: input.email,
      subject: `Invitation MyBusi · ${input.storeName}`,
      text: `Vous êtes invité(e) dans la boutique ${input.storeName} avec le rôle ${input.role}. ${verification} ${credentials}`,
    });
  }

  private createTransporter() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    const from = this.config.get<string>('SMTP_FROM') || user;
    if (!host || !user || !pass || !from) {
      throw new InternalServerErrorException('Email service is not configured');
    }
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    return { transporter, from };
  }

  async sendOtp(phone: string, otpCode: string) {
    const otpMock = this.config.get<string>('OTP_MOCK') === 'true';

    if (otpMock) {
      console.info('[OTP_MOCK] SMS delivery simulated; OTP value suppressed.');
      return true;
    }

    const rawToken = this.config.get<string>('MTN_SMS_TOKEN');
    const sender = this.config.get<string>('MTN_SMS_SENDER');
    const callbackUrl = this.config.get<string>('MTN_SMS_CALLBACK_URL');

    if (!rawToken || !sender) {
      throw new InternalServerErrorException('SMS provider not configured');
    }

    const token = rawToken.startsWith('Token ')
      ? rawToken.replace(/^Token\s+/, '')
      : rawToken;

    try {
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
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(
        'Impossible de contacter le service SMS. En développement, ajoutez OTP_MOCK=true dans .env.',
      );
    }
  }
}
