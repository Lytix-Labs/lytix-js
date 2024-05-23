import bunyan from "bunyan";
import LytixCreds from "../envVars";

/**
 * Main class to collect and report metrics
 * back to HQ
 */
export class MetricCollector {
  private baseURL: string;
  private logger: bunyan;
  constructor() {
    this.baseURL = new URL("v1/metrics", LytixCreds.LX_BASE_URL).href;
    /**
     * We can't use LLogger here since it'll be a circular dep, so just use the
     * base bunyan logger
     */
    this.logger = bunyan.createLogger({ name: "mm-metrics-collector" });
  }

  /**
   * Wrapper to send a post request with the apiKey
   * in the header
   */
  private async sendPostRequest(
    endpoint: string,
    body: {
      [key: string]:
        | string
        | boolean
        | number
        | { [key: string]: string | boolean | number }
        | string[];
    }
  ) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        "lx-api-key": LytixCreds.LX_API_KEY,
      };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (res.status !== 200) {
        this.logger.warn(
          `Failed to send to Lytix: ${res.status} with url: ${url}: ${res.body}`
        );
      }
    } catch (err) {
      this.logger.error(`Failed to send to Lytix: ${err}`, err);
    }
  }

  /**
   * Increment a given metric
   */
  public async increment(
    metricName: string,
    metricValue: number = 1,
    metricMetadata?: { [key: string]: number | boolean | string }
  ) {
    await this.sendPostRequest("/increment", {
      metricName,
      metricValue,
      metricMetadata: metricMetadata === undefined ? {} : metricMetadata,
    });
  }

  /**
   * Capture request log event
   * @note You likely never need to call this directly
   */
  public async _captureMetricTrace(args: {
    metricName: string;
    metricValue: number;
    logs?: string[];
    metricMetadata?: { [key: string]: number | boolean | string };
  }) {
    const { metricName, metricValue, logs, metricMetadata } = args;

    await this.sendPostRequest("/increment", {
      metricName,
      metricValue,
      metricMetadata: metricMetadata === undefined ? {} : metricMetadata,
      ...(logs === undefined ? {} : { logs }),
    });
  }

  /**
   * Capture a model input/output
   */
  public async captureModelIO(args: {
    modelName: string;
    modelInput: string;
    modelOutput: string;
    metricMetadata?: { [key: string]: number | boolean | string };
    userIdentifier?: string;
    sessionId?: string;
  }) {
    const {
      modelName,
      modelInput,
      modelOutput,
      metricMetadata,
      userIdentifier,
      sessionId,
    } = args;
    await this.sendPostRequest("/modelIO", {
      modelName,
      modelInput,
      modelOutput,
      ...(metricMetadata ? { metricMetadata } : {}),
      ...(userIdentifier ? { userIdentifier } : {}),
      ...(sessionId ? { sessionId } : {}),
    });
  }

  /**
   * Captures a model io event while also capturing the time it takes to respond
   */
  public async captureModelTrace<T extends string>(args: {
    modelName: string;
    modelInput: string;
    generateModelOutput: () => Promise<T>;
    metricMetadata?: { [key: string]: number | boolean | string };
    userIdentifier?: string;
    sessionId?: string;
  }) {
    const {
      modelName,
      modelInput,
      generateModelOutput,
      metricMetadata,
      userIdentifier,
      sessionId,
    } = args;
    const startTime = new Date();
    const modelOutput = await generateModelOutput();
    try {
      /**
       * Capture modelIO event along with the response time
       */
      await Promise.all([
        this.captureModelIO({
          modelName,
          modelInput,
          modelOutput,
          metricMetadata,
          userIdentifier,
          sessionId,
        }),
        this.increment(
          `model.responseTime`,
          new Date().getTime() - startTime.getTime(),
          {
            modelName,
            ...metricMetadata,
          }
        ),
      ]);
    } catch (err) {
      this.logger.error(
        `Failed to capture model trace: ${err}`,
        err,
        modelName,
        modelInput,
        modelOutput
      );
    } finally {
      return modelOutput;
    }
  }
}
