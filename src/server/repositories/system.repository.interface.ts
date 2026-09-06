export interface SystemMetadata {
  version: string;
  gitHash: string;
  startedAt: Date;
}

export interface ISystemRepository {
  getSystemMetadata(): SystemMetadata;
  getStartTime(): Date;
}
