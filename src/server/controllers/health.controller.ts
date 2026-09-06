import { NextResponse } from 'next/server';
import { IHealthService } from '../services/health.service.interface';

export class HealthController {
  constructor(private readonly healthService: IHealthService) {}

  async check(): Promise<NextResponse> {
    const healthData = this.healthService.getHealth();
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
