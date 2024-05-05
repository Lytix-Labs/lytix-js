import { MetricCollector } from "./metricCollector";

declare global {
  var MetricCollector: undefined | MetricCollector;
}

/**
 * We only want 1 instance of this at any given time. So always export
 * a the same created instance
 */
const metricCollector = new MetricCollector();

export default metricCollector;
module.exports = metricCollector;

globalThis.MetricCollector = metricCollector;
