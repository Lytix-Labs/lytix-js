import { NextFunction, Request, Response } from "express";
import { LLogger } from "../LLogger/LLogger";
import metricCollector from "../MetricCollector";

/**
 * Log this error to our server, with the metadata of the
 * request
 */
export function LytixRequestWrapper(
  req: Request,
  res: Response,
  next: NextFunction,
  captureRequestData: boolean = false
) {
  /**
   * Define our logger if not given
   */
  const loggerPulled = new LLogger("lytix-request-handler");

  if (captureRequestData) {
    /**
     * Use close instead of finished, that way all compute is done
     * @see https://nodejs.org/api/stream.html#class-streamwritable
     */
    res.once("close", async () => {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode <= 299) {
        /**
         * Nothing to log if it was a good request
         */
        return;
      }

      /**
       * Otherwise, lets parse and report back to HQ
       */
      const { path, method, hostname } = req;
      const referer = req.headers["referer"];
      const userAgent = req.headers["user-agent"];

      /**
       * Report this back to HQ
       */
      await metricCollector._captureMetricTrace({
        metricName: "LError",
        metricValue: 1,
        metricMetadata: {
          "$no-index:errorMessage": "Non-200 HTTP Request",
          path,
          method,
          statusCode,
          hostname,
          ...(referer ? { referer } : {}),
          ...(userAgent ? { userAgent } : {}),
        },
        ...(statusCode < 200 || statusCode > 200
          ? { logs: loggerPulled.getLogs() }
          : {}),
      });
    });
  }

  loggerPulled.runInHTTPContext(() => next());
}
