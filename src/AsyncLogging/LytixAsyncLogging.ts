import * as vertexAI from "@google-cloud/vertexai";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import * as traceloop from "@traceloop/node-server-sdk";
import OpenAI from "openai";

export class LytixAsyncLogger {
  private lytixAPIKey: string;
  private baseUrl: string;
  private openAI?: typeof OpenAI;
  private googleVertexAI?: typeof vertexAI;

  /**
   * Initialize the LytixAsyncLogger
   */
  constructor(opts: {
    lytixAPIKey: string;
    baseUrl?: string;
    providers: {
      openAI?: typeof OpenAI;
      googleVertexAI?: typeof vertexAI;
    };
  }) {
    this.lytixAPIKey = opts.lytixAPIKey;
    this.baseUrl = opts.baseUrl ?? "https://api.lytix.co/v2/metrics/async";
    this.openAI = opts.providers?.openAI ?? undefined;
    this.googleVertexAI = opts.providers?.googleVertexAI ?? undefined;
  }

  /**
   * Initialize the Traceloop SDK
   */
  init() {
    const exporter = new OTLPTraceExporter({
      url: this.baseUrl,
      headers: {
        "lx-api-key": this.lytixAPIKey,
      },
    });
    traceloop.initialize({
      baseUrl: this.baseUrl,
      disableBatch: true,
      exporter,
      instrumentModules: {
        openAI: this.openAI ?? undefined,
        google_vertexai: this.googleVertexAI ?? undefined,
      },
    });
  }

  /**
   * Run a function (e.g. a inference call) with additional lytix metadata
   * @param metadata - Metadata to associate with the function call
   * @param fn - Function to call
   * @returns - The result of the function call
   */
  withMetadata(
    metadata: {
      userId?: string;
      sessionId?: string;
      workflowName?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: () => any
  ) {
    return traceloop.withAssociationProperties(metadata, callback);
  }
}
