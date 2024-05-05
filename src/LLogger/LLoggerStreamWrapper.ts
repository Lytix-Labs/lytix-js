import stream from "stream";
import httpContext from "express-http-context";
import { LYTIX_LOGGER_HTTP_CONTEXT_KEY } from "./LLogger";

class LLoggerStreamWrapper extends stream.Writable {
  /**
   * When we have a record from bunyan
   */
  write(record: string) {
    /**
     * Save this stream to our http context if present
     */
    const existingContext: string[] =
      httpContext.get(LYTIX_LOGGER_HTTP_CONTEXT_KEY) ?? [];
    existingContext.push(JSON.stringify(record));
    httpContext.set(LYTIX_LOGGER_HTTP_CONTEXT_KEY, existingContext);
    return true;
  }
}

export default LLoggerStreamWrapper;
