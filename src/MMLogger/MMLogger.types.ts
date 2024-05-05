/**
 * Type of metadata that can be:
 * 1. Used in the Logger
 * 2. Be reported to Metric Mongrel HQ
 */
export interface MMLoggerMetadata {
  [key: string]: string | boolean | number;
}
