import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'MyBusi API - Gestion commerciale multi-boutiques';
  }
}
