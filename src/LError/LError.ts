import metricCollector from "../MetricCollector";

class LError extends Error {
  constructor(msg: string, errorMetadata?: { [key: string]: string }) {
    /**
     * Attempt to pull any data from the async storage if available
     * @todo Support for this will come in the future
     */
    // const store = new AsyncLocalStorage();
    // const storeData = store.getStore();
    // console.log(`>>>STORE DATA`, storeData);

    Promise.resolve().then(async () => {
      await metricCollector.increment(`lerror`, 1, errorMetadata);
    });

    super(msg);
  }
}

export default LError;
