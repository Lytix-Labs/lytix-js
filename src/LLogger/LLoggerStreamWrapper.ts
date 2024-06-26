import stream from "stream";
// import httpContext from "express-http-context";
import { AsyncLocalStorage } from "node:async_hooks";
import type { LoggerAsyncContext } from "./LLogger.types";

class LLoggerStreamWrapper extends stream.Writable {
  private context: AsyncLocalStorage<LoggerAsyncContext>;
  constructor(context: AsyncLocalStorage<LoggerAsyncContext>) {
    super();
    this.context = context;
  }

  /**
   * When we have a record from bunyan
   */
  write(record: string) {
    /**
     * Save this stream to our http context if present
     */
    this.context.getStore()?.logs.push(record);

    /**
     * Always only store the last 20 logs in the async context so we
     * dont OOM
     */
    this.context.enterWith({
      logs: this.context.getStore()?.logs.slice(0, 20) ?? [],
    });
    return true;
  }
}

export default LLoggerStreamWrapper;
