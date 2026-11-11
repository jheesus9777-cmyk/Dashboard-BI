import { Sale, Expense, Product } from '../types/bi';
import {
  PredictiveMetricKey,
  DayOfWeekSeasonality,
  SeasonalMetricStats,
  DailyPredictionPoint,
  PredictiveModelConfig,
  DynamicThresholdsResult,
  SensitivityLevel,
} from '../types/predictive';
import { KPIThresholdConfig } from '../types/thresholds';
import { DEFAULT_CFO_THRESHOLDS } from './kpiThresholds';

export const DEFAULT_PREDICTIVE_CONFIG: PredictiveModelConfig = {
  sensitivity: 'moderate',
  sigmaMultiplierWarning: 1.0,
  sigmaMultiplierCritical: 2.0,
  enableDayOfWeekSeasonality: true,
  enablePayCycleSeasonality: true,
  growthTargetUpliftPct: 5.0,
  trainingWindow: 'all',
};

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORTS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface RawDayAgg {
  date: Date;
  dateStr: string;
  dayOfWeek: number;
  dayOfMonth: number;
  sales: number;
  cogs: number;
  grossMarginAmount: number;
  grossMarginPct: number;
  ticketCount: number;
  aov: number;
  expenses: number;
  ebitda: number;
}

/**
 * Extracts and aggregates continuous daily data points from raw sales and expenses collections.
 */
function aggregateDailyHistory(
  sales: Sale[],
  expenses: Expense[],
  trainingWindow: PredictiveModelConfig['trainingWindow']
): RawDayAgg[] {
  if (sales.length === 0) return [];

  // Determine chronological range from all sales
  let minTime = Infinity;
  let maxTime = -Infinity;

  sales.forEach((s) => {
    if (!s.date) return;
    const t = new Date(s.date).getTime();
    if (!isNaN(t)) {
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
  });

  if (minTime === Infinity) return [];

  let start = new Date(minTime);
  start.setHours(0, 0, 0, 0);
  const end = new Date(maxTime);
  end.setHours(23, 59, 59, 999);

  // Apply training window filter if specified
  if (trainingWindow !== 'all') {
    const days = trainingWindow === '30d' ? 30 : trainingWindow === '60d' ? 60 : 90;
    const windowStart = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    if (windowStart > start) {
      start = windowStart;
      start.setHours(0, 0, 0, 0);
    }
  }

  // Build continuous calendar map
  const pointsMap = new Map<string, {
    date: Date;
    sales: number;
    cogs: number;
    ticketCount: number;
    expenses: number;
  }>();

  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    pointsMap.set(key, {
      date: new Date(curr),
      sales: 0,
      cogs: 0,
      ticketCount: 0,
      expenses: 0,
    });
    curr.setDate(curr.getDate() + 1);
  }

  // Accumulate sales
  sales.forEach((s) => {
    if (!s.date) return;
    const d = new Date(s.date);
    if (isNaN(d.getTime()) || d < start || d > end) return;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;

    const existing = pointsMap.get(key);
    const cogs = s.items.reduce((acc, it) => acc + (it.unitCost || 0) * (it.quantity || 1), 0);

    if (existing) {
      existing.sales += s.totalAmount;
      existing.cogs += cogs;
      existing.ticketCount += 1;
    }
  });

  // Accumulate expenses
  expenses.forEach((e) => {
    if (!e.date) return;
    const d = new Date(e.date);
    if (isNaN(d.getTime()) || d < start || d > end) return;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;

    const existing = pointsMap.get(key);
    if (existing) {
      existing.expenses += e.amount;
    }
  });

  // Calculate daily derived KPIs
  const result: RawDayAgg[] = [];
  Array.from(pointsMap.entries()).forEach(([key, val]) => {
    const grossMarginAmount = val.sales - val.cogs;
    const grossMarginPct = val.sales > 0 ? (grossMarginAmount / val.sales) * 100 : 0;
    const aov = val.ticketCount > 0 ? val.sales / val.ticketCount : 0;
    const ebitda = grossMarginAmount - val.expenses;

    result.push({
      date: val.date,
      dateStr: key,
      dayOfWeek: val.date.getDay(),
      dayOfMonth: val.date.getDate(),
      sales: val.sales,
      cogs: val.cogs,
      grossMarginAmount,
      grossMarginPct: Math.round(grossMarginPct * 10) / 10,
      ticketCount: val.ticketCount,
      aov: Math.round(aov),
      expenses: val.expenses,
      ebitda: Math.round(ebitda),
    });
  });

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Computes statistical properties, day-of-week seasonality, residual variance, and dynamic threshold limits.
 */
function analyzeMetricSeasonality(
  metricKey: PredictiveMetricKey,
  rawDays: RawDayAgg[],
  config: PredictiveModelConfig,
  staticThresholds: KPIThresholdConfig
): { stats: SeasonalMetricStats; points: DailyPredictionPoint[] } {
  const n = rawDays.length;
  if (n === 0) {
    return {
      stats: {
        metricKey,
        label: metricKey,
        unit: '$',
        mean: 0,
        standardDeviation: 0,
        residualSeasonalStdDev: 0,
        coefficientOfVariationPct: 0,
        min: 0,
        max: 0,
        median: 0,
        dayOfWeekSeasonality: [],
        payCycleLiftPct: 0,
        suggestedDynamicTarget: 0,
        suggestedDynamicWarning: 0,
        suggestedDynamicCritical: 0,
        staticTarget: 0,
        staticWarning: 0,
        staticCritical: 0,
        falseAlarmsAvoidedCount: 0,
        leaksDetectedCount: 0,
      },
      points: [],
    };
  }

  // Map values
  const getVal = (d: RawDayAgg) => {
    switch (metricKey) {
      case 'sales':
        return d.sales;
      case 'margin':
        return d.grossMarginPct;
      case 'aov':
        return d.aov;
      case 'ebitda':
        return d.ebitda;
      case 'tickets':
        return d.ticketCount;
      default:
        return d.sales;
    }
  };

  const values = rawDays.map(getVal);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Raw Standard Deviation
  const varianceRaw = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, n - 1);
  const rawStdDev = Math.sqrt(varianceRaw);

  const sortedVals = [...values].sort((a, b) => a - b);
  const min = sortedVals[0] || 0;
  const max = sortedVals[sortedVals.length - 1] || 0;
  const median = sortedVals[Math.floor(sortedVals.length / 2)] || 0;

  // 1. Day of Week Seasonality Breakdown
  const dowSamples: { count: number; sum: number }[] = Array.from({ length: 7 }, () => ({
    count: 0,
    sum: 0,
  }));

  rawDays.forEach((d) => {
    const val = getVal(d);
    dowSamples[d.dayOfWeek].count += 1;
    dowSamples[d.dayOfWeek].sum += val;
  });

  const dayOfWeekSeasonality: DayOfWeekSeasonality[] = dowSamples.map((sample, idx) => {
    const avg = sample.count > 0 ? sample.sum / sample.count : mean;
    const index = mean > 0 ? avg / mean : 1.0;
    return {
      dayIndex: idx,
      dayName: DAY_NAMES[idx],
      dayShort: DAY_SHORTS[idx],
      sampleCount: sample.count,
      averageValue: Math.round(avg * 10) / 10,
      seasonalityIndex: Math.round(index * 1000) / 1000,
      variancePct: Math.round((index - 1.0) * 1000) / 10,
    };
  });

  // 2. Pay Cycle (Quincena) Lift (Days 14-16 and 29-31)
  let payCycleSum = 0;
  let payCycleCount = 0;
  let regularSum = 0;
  let regularCount = 0;

  rawDays.forEach((d) => {
    const val = getVal(d);
    const isPay = (d.dayOfMonth >= 14 && d.dayOfMonth <= 16) || d.dayOfMonth >= 29;
    if (isPay) {
      payCycleSum += val;
      payCycleCount += 1;
    } else {
      regularSum += val;
      regularCount += 1;
    }
  });

  const payCycleAvg = payCycleCount > 0 ? payCycleSum / payCycleCount : mean;
  const regularAvg = regularCount > 0 ? regularSum / regularCount : mean;
  const payCycleLiftPct =
    regularAvg > 0 ? Math.round(((payCycleAvg - regularAvg) / regularAvg) * 1000) / 10 : 0;

  // 3. Expected Seasonal Value & Residual Standard Deviation
  const expectedValues: number[] = [];
  rawDays.forEach((d) => {
    let exp = mean;
    if (config.enableDayOfWeekSeasonality) {
      const sDow = dayOfWeekSeasonality[d.dayOfWeek]?.seasonalityIndex || 1.0;
      exp = mean * sDow;
    }
    if (config.enablePayCycleSeasonality && ((d.dayOfMonth >= 14 && d.dayOfMonth <= 16) || d.dayOfMonth >= 29)) {
      exp = exp * (1 + payCycleLiftPct / 100);
    }
    expectedValues.push(exp);
  });

  // Residual variance (volatility unexplained by seasonal factors)
  let sumSquaredResiduals = 0;
  for (let i = 0; i < n; i++) {
    const diff = values[i] - expectedValues[i];
    sumSquaredResiduals += diff * diff;
  }
  const residualSeasonalStdDev = Math.sqrt(sumSquaredResiduals / Math.max(1, n - 1));
  const cvPct = mean > 0 ? Math.round((residualSeasonalStdDev / mean) * 1000) / 10 : 0;

  // Retrieve static thresholds for backtesting comparison
  let sTarget = 0;
  let sWarn = 0;
  let sCrit = 0;
  let unit: '$' | '%' | 'x' | 'tickets' = '$';
  let label = '';

  if (metricKey === 'sales') {
    sTarget = staticThresholds.totalSales.target;
    sWarn = staticThresholds.totalSales.warning;
    sCrit = staticThresholds.totalSales.critical;
    unit = '$';
    label = 'Facturación Neta Diaria';
  } else if (metricKey === 'margin') {
    sTarget = staticThresholds.weightedGrossMarginPct.target;
    sWarn = staticThresholds.weightedGrossMarginPct.warning;
    sCrit = staticThresholds.weightedGrossMarginPct.critical;
    unit = '%';
    label = 'Margen Bruto Ponderado';
  } else if (metricKey === 'aov') {
    sTarget = staticThresholds.aov.target;
    sWarn = staticThresholds.aov.warning;
    sCrit = staticThresholds.aov.critical;
    unit = '$';
    label = 'Ticket Promedio (AOV)';
  } else if (metricKey === 'ebitda') {
    sTarget = staticThresholds.operatingEbitda.target;
    sWarn = staticThresholds.operatingEbitda.warning;
    sCrit = staticThresholds.operatingEbitda.critical;
    unit = '$';
    label = 'EBITDA Operativo';
  } else if (metricKey === 'tickets') {
    sTarget = Math.round(mean * 1.05);
    sWarn = Math.round(mean * 0.85);
    sCrit = Math.round(mean * 0.7);
    unit = 'tickets';
    label = 'Transacciones Diarias';
  }

  // Suggested dynamic baseline thresholds
  const growthMultiplier = 1 + config.growthTargetUpliftPct / 100;
  const suggestedDynamicTarget = Math.round(mean * growthMultiplier);
  const suggestedDynamicWarning = Math.round(
    Math.max(0, mean - config.sigmaMultiplierWarning * residualSeasonalStdDev)
  );
  const suggestedDynamicCritical = Math.round(
    Math.max(0, mean - config.sigmaMultiplierCritical * residualSeasonalStdDev)
  );

  // 4. Daily Prediction Points & Anomaly Backtesting
  let falseAlarmsAvoidedCount = 0;
  let leaksDetectedCount = 0;

  const points: DailyPredictionPoint[] = rawDays.map((d, i) => {
    const actual = values[i];
    const expected = expectedValues[i];

    // Dynamic thresholds adjusted specifically for this day's seasonal factor
    const dynTarget = Math.round(expected * growthMultiplier);
    const dynWarn = Math.round(
      Math.max(0, expected - config.sigmaMultiplierWarning * residualSeasonalStdDev)
    );
    const dynCrit = Math.round(
      Math.max(0, expected - config.sigmaMultiplierCritical * residualSeasonalStdDev)
    );

    const isDynamicAnomaly = actual < dynCrit;
    const isStaticAnomaly = actual < sCrit;

    // False alarm: static said critical (Red), but dynamically it's within seasonal tolerance
    if (isStaticAnomaly && !isDynamicAnomaly) {
      falseAlarmsAvoidedCount += 1;
    }

    // Leak: static said fine (Green/Yellow), but dynamically it severely missed seasonal capacity
    if (!isStaticAnomaly && actual < dynWarn && expected > mean) {
      leaksDetectedCount += 1;
    }

    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (actual < dynCrit) {
      status = 'critical';
    } else if (actual < dynWarn) {
      status = 'warning';
    }

    return {
      date: d.date,
      dateStr: d.dateStr,
      dayName: DAY_NAMES[d.dayOfWeek],
      dayShort: DAY_SHORTS[d.dayOfWeek],
      dayOfWeek: d.dayOfWeek,
      isWeekend: d.dayOfWeek === 0 || d.dayOfWeek === 6,
      isPayCycle: (d.dayOfMonth >= 14 && d.dayOfMonth <= 16) || d.dayOfMonth >= 29,
      actualValue: actual,
      expectedSeasonalValue: Math.round(expected),
      dynamicTarget: dynTarget,
      dynamicWarning: dynWarn,
      dynamicCritical: dynCrit,
      staticTarget: sTarget,
      staticWarning: sWarn,
      staticCritical: sCrit,
      isDynamicAnomaly,
      isStaticAnomaly,
      status,
      residualError: Math.round(actual - expected),
    };
  });

  return {
    stats: {
      metricKey,
      label,
      unit,
      mean: Math.round(mean * 10) / 10,
      standardDeviation: Math.round(rawStdDev * 10) / 10,
      residualSeasonalStdDev: Math.round(residualSeasonalStdDev * 10) / 10,
      coefficientOfVariationPct: cvPct,
      min,
      max,
      median,
      dayOfWeekSeasonality,
      payCycleLiftPct,
      suggestedDynamicTarget,
      suggestedDynamicWarning,
      suggestedDynamicCritical,
      staticTarget: sTarget,
      staticWarning: sWarn,
      staticCritical: sCrit,
      falseAlarmsAvoidedCount,
      leaksDetectedCount,
    },
    points,
  };
}

/**
 * Main predictive model calculation orchestrator.
 */
export function calculateSeasonalVariancePredictions(
  sales: Sale[],
  expenses: Expense[],
  config: PredictiveModelConfig = DEFAULT_PREDICTIVE_CONFIG,
  staticThresholds: KPIThresholdConfig = DEFAULT_CFO_THRESHOLDS
): DynamicThresholdsResult {
  const rawDays = aggregateDailyHistory(sales, expenses, config.trainingWindow);

  const keys: PredictiveMetricKey[] = ['sales', 'margin', 'aov', 'ebitda', 'tickets'];
  const statsRecord = {} as Record<PredictiveMetricKey, SeasonalMetricStats>;
  const pointsRecord = {} as Record<PredictiveMetricKey, DailyPredictionPoint[]>;

  let totalFalseAlarms = 0;
  let totalLeaks = 0;

  keys.forEach((key) => {
    const analysis = analyzeMetricSeasonality(key, rawDays, config, staticThresholds);
    statsRecord[key] = analysis.stats;
    pointsRecord[key] = analysis.points;
    totalFalseAlarms += analysis.stats.falseAlarmsAvoidedCount;
    totalLeaks += analysis.stats.leaksDetectedCount;
  });

  // Calculate weekend surge index for sales
  const salesStats = statsRecord.sales;
  const satSunAvg = salesStats.dayOfWeekSeasonality
    .filter((d) => d.dayIndex === 0 || d.dayIndex === 6)
    .reduce((acc, d) => acc + d.averageValue, 0) / 2;
  const monFriAvg = salesStats.dayOfWeekSeasonality
    .filter((d) => d.dayIndex >= 1 && d.dayIndex <= 5)
    .reduce((acc, d) => acc + d.averageValue, 0) / 5;
  const weekendSurgePct =
    monFriAvg > 0 ? Math.round(((satSunAvg - monFriAvg) / monFriAvg) * 1000) / 10 : 0;

  // Best and worst seasonality days
  const sortedDow = [...salesStats.dayOfWeekSeasonality].sort(
    (a, b) => b.seasonalityIndex - a.seasonalityIndex
  );
  const highestSeasonalityDay = sortedDow[0]?.dayName || 'Sábado';
  const lowestSeasonalityDay = sortedDow[sortedDow.length - 1]?.dayName || 'Lunes';

  // Overall confidence score based on residual error reduction
  const rawSigma = salesStats.standardDeviation;
  const resSigma = salesStats.residualSeasonalStdDev;
  const confidenceScore =
    rawSigma > 0 ? Math.min(98, Math.max(70, Math.round((1 - resSigma / (rawSigma * 1.5)) * 100))) : 88;

  return {
    stats: statsRecord,
    dailyPoints: pointsRecord,
    summary: {
      totalDaysAnalyzed: rawDays.length,
      highestSeasonalityDay,
      lowestSeasonalityDay,
      weekendSurgePct,
      totalFalseAlarmsAvoided: totalFalseAlarms,
      totalLeaksDetected: totalLeaks,
      overallPredictiveConfidencePct: confidenceScore,
    },
  };
}

/**
 * Converts dynamic predictive stats into a fully compatible KPIThresholdConfig object.
 */
export function buildDynamicThresholdConfigFromPredictions(
  predictions: DynamicThresholdsResult,
  baseConfig: KPIThresholdConfig = DEFAULT_CFO_THRESHOLDS
): KPIThresholdConfig {
  const { stats } = predictions;

  return {
    ...baseConfig,
    totalSales: {
      ...baseConfig.totalSales,
      target: stats.sales.suggestedDynamicTarget,
      warning: stats.sales.suggestedDynamicWarning,
      critical: stats.sales.suggestedDynamicCritical,
      description: `Umbral dinámico estacional (Base diaria calibrada con ±${stats.sales.coefficientOfVariationPct}% de varianza)`,
    },
    weightedGrossMarginPct: {
      ...baseConfig.weightedGrossMarginPct,
      target: stats.margin.suggestedDynamicTarget,
      warning: stats.margin.suggestedDynamicWarning,
      critical: stats.margin.suggestedDynamicCritical,
      description: `Umbral dinámico estacional (Margen calibrado con residuo estacional de ${stats.margin.residualSeasonalStdDev} pts)`,
    },
    aov: {
      ...baseConfig.aov,
      target: stats.aov.suggestedDynamicTarget,
      warning: stats.aov.suggestedDynamicWarning,
      critical: stats.aov.suggestedDynamicCritical,
      description: `Umbral dinámico estacional (Ticket calibrado por afluencia estacional)`,
    },
    operatingEbitda: {
      ...baseConfig.operatingEbitda,
      target: stats.ebitda.suggestedDynamicTarget,
      warning: stats.ebitda.suggestedDynamicWarning,
      critical: stats.ebitda.suggestedDynamicCritical,
      description: `Umbral dinámico estacional (EBITDA diario adaptado a varianza de gastos)`,
    },
  };
}
