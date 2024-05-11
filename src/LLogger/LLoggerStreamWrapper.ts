import stream from "stream";
// import httpContext from "express-http-context";
import { AsyncLocalStorage } from "node:async_hooks";
import type { LoggerHTTPContext } from "./LLogger.types";

class LLoggerStreamWrapper extends stream.Writable {
  private context: AsyncLocalStorage<LoggerHTTPContext>;
  constructor(context: AsyncLocalStorage<LoggerHTTPContext>) {
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
    return true;
  }
}

export default LLoggerStreamWrapper;
