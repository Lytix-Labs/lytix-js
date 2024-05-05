import stream from "stream";
import httpContext from "express-http-context";
import { MM_LOGGER_HTTP_CONTEXT_KEY } from "./MMLogger";

class MMLoggerStreamWrapper extends stream.Writable {
  /**
   * When we have a record from bunyan
   */
  write(record: string) {
    /**
     * Save this stream to our http context if present
     */
    const existingContext: string[] =
      httpContext.get(MM_LOGGER_HTTP_CONTEXT_KEY) ?? [];
    existingContext.push(JSON.stringify(record));
    httpContext.set(MM_LOGGER_HTTP_CONTEXT_KEY, existingContext);
    return true;
  }
}

export default MMLoggerStreamWrapper;
