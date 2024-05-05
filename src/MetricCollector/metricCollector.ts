import { LLogger } from "../LLogger/LLogger";
import { LX_API_KEY, LX_BASE_URL } from "../envVars";

/**
 * Main class to collect and report metrics
 * back to HQ
 */
export class MetricCollector {
  private apiKey: string;
  private baseURL: string;
  private logger: LLogger;
  constructor() {
    this.apiKey = LX_API_KEY;
    this.baseURL = new URL("v1/metrics", LX_BASE_URL).href;
    this.logger = new LLogger("mm-metrics-collector", { console: true });
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
        | { [key: string]: string | boolean | number };
    }
  ) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "lx-api-key": this.apiKey,
    };
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (res.status !== 200) {
      this.logger.warn(
        `Failed to send MetricMongal: ${res.status} with url: ${url}: ${res.body}`
      );
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
    logs?: string;
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
  public async captureModelIO(
    modelName: string,
    userInput: string,
    modelOutput: string,
    metricMetadata?: { [key: string]: number | boolean | string }
  ) {
    await this.sendPostRequest("/modelIO", {
      modelName,
      userInput,
      modelOutput,
      ...(metricMetadata ? metricMetadata : {}),
    });
  }
}
