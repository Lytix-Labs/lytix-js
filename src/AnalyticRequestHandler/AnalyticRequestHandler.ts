import { NextFunction, Request, Response } from "express";
import { LLogger } from "../LLogger/LLogger";
import metricCollector from "../MetricCollector";

/**
 * Log this error to our server, with the metadata of the
 * request
 */
export function AnalyticRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
  mmLogger?: LLogger
) {
  const startTime = new Date();

  /**
   * Define our logger if not given
   */
  const loggerPulled = mmLogger ?? new LLogger("lytix-request-handler");

  /**
   * Use close instead of finished, that way all compute is done
   * @see https://nodejs.org/api/stream.html#class-streamwritable
   */
  res.once("close", async () => {
    const { path, method, hostname } = req;
    const referer = req.headers["referer"];
    const userAgent = req.headers["user-agent"];
    const requestDuration = new Date().getTime() - startTime.getTime();
    const statusCode = res.statusCode;

    /**
     * Report this back to HQ
     */
    await metricCollector._captureMetricTrace({
      metricName: "requestDuration",
      metricValue: requestDuration,
      metricMetadata: {
        path,
        method,
        statusCode,
        hostname,
        ...(referer ? { referer } : {}),
        ...(userAgent ? { userAgent } : {}),
      },
      ...(mmLogger !== undefined && (statusCode < 200 || statusCode > 200)
        ? { logs: mmLogger.getLogs() }
        : {}),
    });
  });

  loggerPulled.runInHTTPContext(() => next());
}
