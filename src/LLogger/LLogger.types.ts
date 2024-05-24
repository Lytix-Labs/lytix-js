/**
 * Type of metadata that can be:
 * 1. Used in the Logger
 * 2. Be reported to Lytix HQ
 */
export interface LLoggerMetadata {
  [key: string]: string | boolean | number;
}

export interface LoggerAsyncContext {
  // metadata: LLoggerMetadata;
  logs: string[];
}
