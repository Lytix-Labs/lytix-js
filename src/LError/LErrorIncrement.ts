import LAsyncStore from "../LAsyncStore/LAsyncStore";
import metricCollector from "../MetricCollector";

const LErrorIncrement = (
  errorMsg: string,
  errorMetadata?: { [key: string]: string | number }
) => {
  try {
    /**
     * Attempt to pull any data from the async storage if available
     */
    const asyncLogs = LAsyncStore.asyncLocalStorage?.getStore()?.logs;

    /**
     * Add the error to the logs
     */
    asyncLogs?.push(
      JSON.stringify({
        name: "LError",
        hostname: "",
        pid: -1,
        level: 50,
        msg: errorMsg,
        time: new Date().toISOString(),
      })
    );

    /**
     * Send the logs + the metadata to Lytix
     * @note This is an unawaited promise
     */
    metricCollector._captureMetricTrace({
      metricName: "LError",
      metricValue: 1,
      metricMetadata: {
        ...errorMetadata,
        "$no-index:errorMessage": errorMsg,
      },
      logs: asyncLogs,
    });
  } catch (err) {
    console.error(`Error Sending LError`, err);
  }
};

export default LErrorIncrement;
