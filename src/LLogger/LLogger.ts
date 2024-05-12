import bunyan from "bunyan";
import { AsyncLocalStorage } from "node:async_hooks";
import type { LLoggerMetadata, LoggerHTTPContext } from "./LLogger.types";
import LLoggerStreamWrapper from "./LLoggerStreamWrapper";

export const LYTIX_LOGGER_HTTP_CONTEXT_KEY = "LXLOGKEY";

/**
 * Main Lytix Logger.
 * This is a special logger since you can specify metadata. Depending if you are
 * running in a http context, the metadata will be saved as follows:
 * - Running with a HTTP context (e.g. express server): Metadata is saved in the http context, and is unique per request
 * - Running standalone (e.g. in a script): Metadata is saved in the class itself and persists for the entire life of the class
 */
export class LLogger {
  private logger: bunyan;
  private metadata?: LLoggerMetadata;
  /**
   * Whether to log to the console or via bunyan
   */
  private console: boolean;
  /**
   * Are we running this logger as part of HTTP context
   */
  private httpContext: boolean;
  /**
   * AsyncLocalStorage for storing metadata across async calls
   */
  private asyncLocalStorage: AsyncLocalStorage<LoggerHTTPContext> | undefined =
    undefined;

  constructor(
    loggerName: string,
    config?: { console?: boolean; httpContext?: boolean }
  ) {
    this.httpContext = config?.httpContext ?? false;
    if (config?.console === true) {
      this.logger = bunyan.createLogger({ name: loggerName });
    } else if (config?.httpContext) {
      this.asyncLocalStorage = new AsyncLocalStorage<LoggerHTTPContext>();
      const streams = [
        { type: "stream", stream: process.stdout, level: "trace" as const },
        {
          type: "stream",
          stream: new LLoggerStreamWrapper(this.asyncLocalStorage),
          /**
           * We only want info and above to push to our server
           * @todo
           */
          level: "info" as const,
        },
      ];
      this.logger = bunyan.createLogger({ name: loggerName, streams });
    } else {
      this.logger = bunyan.createLogger({ name: loggerName });
    }

    this.console = config?.console ?? false;
  }

  /**
   * Set httpContext boolean
   */
  getHttpContext(): boolean {
    return this.httpContext;
  }

  /**
   * Run callback in http context
   */
  runInHttpContext(callback: () => void): void {
    if (!this.asyncLocalStorage) {
      this.logger.warn(`Tried to run in http context but httpContext is false`);
      return callback();
    }
    this.asyncLocalStorage.run({ logs: [], metadata: {} }, callback);
  }

  // /**
  //  * Gets the metadata from the http context
  //  */
  // getMetadataFromHttpContext(): string | undefined {
  //   const toReturn = this.asyncLocalStorage.getStore();
  //   if (!toReturn) {
  //     return "";
  //   }
  //   return JSON.stringify(toReturn.metadata);
  // }

  /**
   * Set the metadata for the logger in the async store
   * or in the class if we are not running in an HTTP context
   */
  public setMetadata(metadata: LLoggerMetadata): void {
    /**
     * Use the express http context to set this metadata
     */
    if (this.httpContext === false || !this.asyncLocalStorage) {
      this.metadata = metadata;
    } else {
      const toSet = this.asyncLocalStorage.getStore();
      if (!toSet) return;
      toSet.metadata = metadata;
    }
  }

  /**
   * Log an info with the metadata
   */
  public info(message: string, ...args: any[]): void {
    const toLog = `${this.getMetadataLoggerString()}${message}`;
    if (this.console) {
      console.log(toLog, ...args);
    } else {
      this.logger.info(toLog, ...args);
    }
  }

  /**
   * Log an warn with the metadata
   */
  public warn(message: string, ...args: any[]): void {
    const toLog = `${this.getMetadataLoggerString()}${message}`;
    if (this.console) {
      console.warn(toLog, ...args);
    } else {
      this.logger.warn(toLog, ...args);
    }
  }

  /**
   * Log an error with the metadata
   */
  public error(message: string, ...args: any[]): void {
    const toLog = `${this.getMetadataLoggerString()}${message}`;
    if (this.console) {
      console.error(toLog, ...args);
    } else {
      this.logger.error(toLog, ...args);
    }
  }

  /**
   * Log an debug with the metadata
   */
  public debug(message: string, ...args: any[]): void {
    const toLog = `${this.getMetadataLoggerString()}${message}`;
    if (this.console) {
      console.debug(toLog, ...args);
    } else {
      this.logger.debug(toLog, ...args);
    }
  }

  /**
   * Get a pretty printed version of the metadata stored
   * to attach to a log
   */
  private getMetadataLoggerString() {
    const metadata = this.getMetadataFromStorage();
    if (metadata && Object.keys(metadata).length > 0) {
      let toReturn = "[";
      for (const [key, value] of Object.entries(metadata)) {
        toReturn += `${key}=${value};`;
      }
      toReturn = toReturn.slice(0, -1);
      toReturn += "] ";
      return toReturn;
    }
    return "";
  }

  /**
   * Gets metadata from storage (either HTTP contet or class)
   */
  private getMetadataFromStorage(): LLoggerMetadata {
    let metadata = this.metadata ?? {};
    if (this.httpContext === true && this.asyncLocalStorage) {
      const toGet = this.asyncLocalStorage.getStore();
      if (!toGet) return {};
      metadata = toGet.metadata;
    }
    return metadata;
  }

  /**
   * Get metadata needed when an error is triggered
   */
  getMetadata(): LLoggerMetadata {
    return this.getMetadataFromStorage();
  }

  /**
   * Get logs from the http context
   */
  getLogs(): string[] {
    if (this.httpContext === false || !this.asyncLocalStorage) return [];
    const storage = this.asyncLocalStorage.getStore();
    if (!storage) return [];
    return storage.logs;
  }
}
