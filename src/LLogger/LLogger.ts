import bunyan from "bunyan";
import LAsyncStore, { LAsyncStoreClass } from "../LAsyncStore/LAsyncStore";
import metricCollector from "../MetricCollector";
import type { LLoggerMetadata } from "./LLogger.types";
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
  private loggerName: string;
  private metadata?: LLoggerMetadata;
  /**
   * Whether to log to the console or via bunyan
   */
  private console: boolean;
  /**
   * Are we running this logger as part of async/HTTP context
   */
  private asyncContext: boolean;
  /**
   * AsyncLocalStorage for storing metadata across async calls
   */
  private asyncLocalStorage: LAsyncStoreClass | undefined;

  constructor(
    loggerName: string,
    metadata?: LLoggerMetadata,
    config?: {
      console?: boolean;
      asyncContext?: boolean;
    }
  ) {
    this.loggerName = loggerName;
    this.asyncContext = config?.asyncContext ?? true;
    if (config?.console === true) {
      this.logger = bunyan.createLogger({ name: loggerName });
    } else if (this.asyncContext) {
      this.asyncLocalStorage = LAsyncStore;
      this.asyncLocalStorage.initAsyncStore();
      if (!this.asyncLocalStorage.asyncLocalStorage) {
        throw new Error(`Failed to initialize async local storage`);
      }
      const streams = [
        { type: "stream", stream: process.stdout, level: "trace" as const },
        {
          type: "stream",
          stream: new LLoggerStreamWrapper(
            this.asyncLocalStorage.asyncLocalStorage
          ),
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

    if (metadata) {
      this.setMetadata(metadata);
    }
  }

  /**
   * Set httpContext boolean
   */
  getHttpContext(): boolean {
    return this.asyncContext;
  }

  /**
   * Run callback in http context (e.g. sync context)
   */
  runInHTTPContext(callback: () => void): void {
    if (!this.asyncLocalStorage || !this.asyncLocalStorage.asyncLocalStorage) {
      this.logger.warn(`Tried to run in http context but httpContext is false`);
      return callback();
    }
    this.asyncLocalStorage.asyncLocalStorage.run({ logs: [] }, callback);
  }

  /**
   * Run callback in LLogger async context (e.g. logs will
   * be saved across functions)
   */
  runInAsyncContext(
    callback: () => Promise<void>,
    captureError?: boolean
  ): Promise<void> {
    const captureErrorParsed = captureError ?? false;

    if (!this.asyncLocalStorage || !this.asyncLocalStorage.asyncLocalStorage) {
      this.logger.warn(
        `Tried to run in http context but no async context setup`
      );
      return callback();
    }
    const callbackWithCatch = () => {
      /**
       * Re-set the metadata in the async store
       */
      if (this.metadata) {
        this.setMetadata(this.metadata);
      }

      return Promise.resolve(callback())
        .catch(async (e) => {
          if (captureErrorParsed === false) throw e;

          try {
            /**
             * Log the error so the user will be able to see it in the console
             */
            this.logger.error(`Error in async context`, e);

            /**
             * Send the logs + the metadata to Lytix
             */
            await metricCollector._captureMetricTrace({
              metricName: "LLoggerError",
              metricValue: 1,
              metricMetadata: {
                ...(this.metadata ?? {}),
                loggerName: this.loggerName,
              },
              logs: this.getLogs(),
            });
          } catch (e) {
            /**
             * Never let this break anything
             */
          } finally {
            /**
             * Then just raise the error as normal
             */
            throw e;
          }
        })
        .finally(async () => {
          /**
           * Make sure all metrics have been sent
           */
          while (metricCollector.processingMetricMutex > 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        });
    };

    return this.asyncLocalStorage.asyncLocalStorage.run(
      { logs: [] },
      callbackWithCatch
    );
  }

  /**
   * Set the metadata for the logger in the async store
   * or in the class if we are not running in an HTTP context
   */
  public setMetadata(metadata: LLoggerMetadata): void {
    this.metadata = metadata;
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
    const metadata = this.metadata;
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

  // /**
  //  * Gets metadata from storage (either HTTP contet or class)
  //  */
  // private getMetadataFromStorage(): LLoggerMetadata {
  //   let metadata = this.metadata ?? {};
  //   if (
  //     this.asyncContext === true &&
  //     this.asyncLocalStorage?.asyncLocalStorage
  //   ) {
  //     const toGet = this.asyncLocalStorage.asyncLocalStorage.getStore();
  //     if (!toGet) return {};
  //     metadata = toGet.metadata;
  //   }
  //   return metadata;
  // }

  /**
   * Get metadata needed when an error is triggered
   */
  getMetadata(): LLoggerMetadata {
    return this.metadata ?? {};
  }

  /**
   * Get logs from the http context
   */
  getLogs(): string[] {
    if (
      this.asyncContext === false ||
      !this.asyncLocalStorage?.asyncLocalStorage
    ) {
      return [];
    }
    const storage = this.asyncLocalStorage.asyncLocalStorage.getStore();
    if (!storage) return [];
    return storage.logs;
  }
}
