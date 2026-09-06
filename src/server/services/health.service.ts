import { IHealthService } from './health.service.interface';
import { ISystemRepository } from '../repositories/system.repository.interface';
import { HealthResponseDto } from '../dtos/health.dto';

export class HealthService implements IHealthService {
  constructor(private readonly systemRepository: ISystemRepository) {}

  getHealth(): HealthResponseDto {
    const metadata = this.systemRepository.getSystemMetadata();
    const uptimeStr = this.formatGoDuration(Date.now() - metadata.startedAt.getTime());

    return {
      version: metadata.version,
      uptime: uptimeStr,
      git_hash: metadata.gitHash,
    };
  }

  private formatGoDuration(ms: number): string {
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60) {
      return `${totalSeconds.toFixed(3)}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = (totalSeconds % 60).toFixed(3);

    if (minutes < 60) {
      return `${minutes}m${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes}m${remainingSeconds}s`;
  }
}
