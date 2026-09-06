import { ISystemRepository, SystemMetadata } from './system.repository.interface';
import packageJson from '../../../package.json';

const startedAt = new Date();

export class SystemRepository implements ISystemRepository {
  getStartTime(): Date {
    return startedAt;
  }

  getSystemMetadata(): SystemMetadata {
    return {
      version: process.env.APP_VERSION || packageJson.version || '0.1.0',
      gitHash: process.env.GIT_HASH || process.env.NEXT_PUBLIC_GIT_HASH || 'dev',
      startedAt: this.getStartTime(),
    };
  }
}
