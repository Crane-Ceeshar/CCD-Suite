export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface Anomaly {
  date: string;
  value: number;
  expected: number;
  deviation: number;
}

export interface AnomalyResult {
  anomalies: Anomaly[];
  mean: number;
  stdDev: number;
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / (values.length - 1));
}

/**
 * Detect anomalies in a time series using z-score method.
 * Points where |value - mean| > sigma * stdDev are flagged as anomalies.
 */
export function detectAnomalies(series: TimeSeriesPoint[], sigma = 2): AnomalyResult {
  const values = series.map((p) => p.value);
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);

  if (stdDev === 0) {
    return { anomalies: [], mean, stdDev };
  }

  const anomalies: Anomaly[] = [];
  for (const point of series) {
    const deviation = Math.abs(point.value - mean);
    if (deviation > sigma * stdDev) {
      anomalies.push({
        date: point.date,
        value: point.value,
        expected: mean,
        deviation: deviation / stdDev,
      });
    }
  }

  return { anomalies, mean, stdDev };
}

/**
 * Check if a single current value is anomalous compared to historical values.
 */
export function isAnomalous(
  currentValue: number,
  historicalValues: number[],
  sigma = 2
): boolean {
  if (historicalValues.length < 3) return false;
  const mean = calculateMean(historicalValues);
  const stdDev = calculateStdDev(historicalValues, mean);
  if (stdDev === 0) return false;
  return Math.abs(currentValue - mean) > sigma * stdDev;
}
