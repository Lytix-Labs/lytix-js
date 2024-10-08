import bunyan from "bunyan";
import LytixCreds from "../envVars";

/**
 * Main class to collect and report metrics
 * back to HQ
 */
export class MetricCollector {
  private baseURL: string;
  private logger: bunyan;
  public processingMetricMutex: number = 0;
  constructor() {
    this.baseURL = new URL("v2/metrics", LytixCreds.LX_BASE_URL).href;
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
        | string[]
        | { role: string; content: string }[];
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
      return res;
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
    this.processingMetricMutex++;
    const { metricName, metricValue, logs, metricMetadata } = args;

    await this.sendPostRequest("/increment", {
      metricName,
      metricValue,
      metricMetadata: metricMetadata === undefined ? {} : metricMetadata,
      ...(logs === undefined ? {} : { logs }),
    });
    this.processingMetricMutex--;
  }

  /**
   * Capture LError event (logs + metadata)
   * @note You likely never need to call this directly
   */
  public async _captureLError(args: {
    errorMsg: string;
    errorMetadata: { [key: string]: number | boolean | string };
    logs?: string[];
  }) {
    const { errorMsg, errorMetadata, logs = [] } = args;
    this.processingMetricMutex++;

    const body = {
      errorName: errorMsg,
      timestamp: new Date().toISOString().slice(0, -3),
      metadata: errorMetadata,
      logs: logs,
    };

    await this.sendPostRequest("/lerror", body);

    this.processingMetricMutex--;
  }

  /**
   * Capture a model input/output
   */
  public async captureModelIO(args: {
    modelName: string;
    systemPrompt?: string;
    userPrompt: string;
    assistantMessage: string;
    metricMetadata?: { [key: string]: number | boolean | string };
    userIdentifier?: string;
    sessionId?: string;
    modelResponseTime?: number;
  }) {
    const {
      modelName,
      systemPrompt,
      userPrompt,
      assistantMessage,
      metricMetadata,
      userIdentifier,
      sessionId,
      modelResponseTime,
    } = args;

    const messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: userPrompt },
      { role: "assistant", content: assistantMessage },
    ];

    await this.sendPostRequest("/modelIO", {
      modelName,
      messages,
      ...(metricMetadata ? { metricMetadata } : {}),
      ...(userIdentifier ? { userIdentifier } : {}),
      ...(sessionId ? { sessionId } : {}),
      ...(modelResponseTime ? { modelResponseTime } : {}),
    });
  }

  /**
   * Captures a model io event while also capturing the time it takes to respond
   */
  public async captureModelTrace<T extends string>(args: {
    modelName: string;
    systemPrompt?: string;
    userPrompt: string;
    generateModelOutput: () => Promise<T>;
    metricMetadata?: { [key: string]: number | boolean | string };
    userIdentifier?: string;
    sessionId?: string;
  }) {
    const {
      modelName,
      systemPrompt,
      userPrompt,
      generateModelOutput,
      metricMetadata,
      userIdentifier,
      sessionId,
    } = args;
    const startTime = new Date();
    const assistantMessage = await generateModelOutput();
    try {
      /**
       * Capture modelIO event along with the response time
       */
      await Promise.all([
        this.captureModelIO({
          modelName,
          systemPrompt,
          userPrompt,
          assistantMessage,
          metricMetadata,
          userIdentifier,
          sessionId,
          modelResponseTime: new Date().getTime() - startTime.getTime(),
        }),
      ]);
    } catch (err) {
      this.logger.error(
        `Failed to capture model trace: ${err}`,
        err,
        modelName,
        systemPrompt,
        userPrompt,
        assistantMessage
      );
    } finally {
      return assistantMessage;
    }
  }

  /**
   * Capture Azure Video URL
   */
  public async captureAzureVideoURL(args: {
    videoURL: string;
    mimeType: string;
  }): Promise<string> {
    const { videoURL, mimeType } = args;

    const response = await this.sendPostRequest("/azureVideoURL", {
      videoUrl: videoURL,
      mimeType,
    });
    try {
      if (!response) {
        throw new Error("Failed to capture Azure Video URL");
      }
      const json = await response.json();
      const id = json["id"];
      return id;
    } catch (err) {
      this.logger.error(`Failed to capture Azure Video URL: ${err}`, err);
      return "";
    }
  }
}
