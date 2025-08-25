export interface InterceptorConfig {
  retryCount: number;
  timeoutMs: number;
  excludedUrls: string[];
}
