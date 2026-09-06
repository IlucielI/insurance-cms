import { healthController } from '@/server/di';

export async function GET() {
  return healthController.check();
}
