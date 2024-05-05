import { NextFunction, Response, Request } from "express";
import metricCollector from "../MetricCollector";
import { MMLoggerMetadata } from "../MMLogger/MMLogger.types";
import { MMLogger } from "../MMLogger/MMLogger";

export const ErrorRequestHandlerLogger = new MMLogger("error-request-handler", {
  console: true,
});

/**
 * Log this error to our server, with the metadata of the
 * request
 */
export function ErrorRequestHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
  logger?: MMLogger
) {
  if (err) {
    try {
      // /**
      //  * Extract any metadata if present in the logger context
      //  */
      // let loggerMetadata: undefined | MMLoggerMetadata = undefined;
      // if (logger) {
      //   loggerMetadata = logger.getMetadata();
      // }
      // /**
      //  * Report this back to HQ
      //  * @note This is a un-awaited promise, and will not block the request
      //  */
      // metricCollector.increment("error-request-handler", 1, loggerMetadata);
    } catch (err) {
      ErrorRequestHandlerLogger.error(`Error reporting error to HQ: ${err}`);
    }
  }
  next(err);
}
