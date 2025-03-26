import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedService {
  excuteSEED() {
    return 'Execute SEED';
  }
}
