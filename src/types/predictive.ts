export type PredictiveMetricKey = 'sales' | 'margin' | 'aov' | 'ebitda' | 'tickets';

export interface DayOfWeekSeasonality {
  dayIndex: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  dayName: string;
  dayShort: string;
  sampleCount: number;
  averageValue: number;
  seasonalityIndex: number; // e.g. 1.25 = +25% above baseline mean
  variancePct: number; // (seasonalityIndex - 1) * 100
}

export interface SeasonalMetricStats {
  metricKey: PredictiveMetricKey;
  label: string;
  unit: '$' | '%' | 'x' | 'tickets';
  mean: number;
  standardDeviation: number;
  residualSeasonalStdDev: number; // sigma after day-of-week removal
  coefficientOfVariationPct: number; // (residualStdDev / mean) * 100
  min: number;
  max: number;
  median: number;
  dayOfWeekSeasonality: DayOfWeekSeasonality[];
  payCycleLiftPct: number; // Estimated lift on 15th and end-of-month (quincenas)
  suggestedDynamicTarget: number;
  suggestedDynamicWarning: number;
  suggestedDynamicCritical: number;
  staticTarget: number;
  staticWarning: number;
  staticCritical: number;
  falseAlarmsAvoidedCount: number; // Days flagged red under static that were normal seasonality
  leaksDetectedCount: number; // Days marked green under static that underperformed seasonal expectation
}

export interface DailyPredictionPoint {
  date: Date;
  dateStr: string;
  dayName: string;
  dayShort: string;
  dayOfWeek: number;
  isWeekend: boolean;
  isPayCycle: boolean;
  actualValue: number;
  expectedSeasonalValue: number;
  dynamicTarget: number;
  dynamicWarning: number;
  dynamicCritical: number;
  staticTarget: number;
  staticWarning: number;
  staticCritical: number;
  isDynamicAnomaly: boolean; // actualValue < dynamicCritical (or > for lowerIsBetter)
  isStaticAnomaly: boolean;  // actualValue < staticCritical
  status: 'optimal' | 'warning' | 'critical';
  residualError: number;
}

export type SensitivityLevel = 'strict' | 'moderate' | 'tolerant';

export interface PredictiveModelConfig {
  sensitivity: SensitivityLevel;
  sigmaMultiplierWarning: number; // e.g. 1.0
  sigmaMultiplierCritical: number; // e.g. 2.0
  enableDayOfWeekSeasonality: boolean;
  enablePayCycleSeasonality: boolean;
  growthTargetUpliftPct: number; // e.g. +5% above seasonal mean
  trainingWindow: 'all' | '30d' | '60d' | '90d';
}

export interface DynamicThresholdsResult {
  stats: Record<PredictiveMetricKey, SeasonalMetricStats>;
  dailyPoints: Record<PredictiveMetricKey, DailyPredictionPoint[]>;
  summary: {
    totalDaysAnalyzed: number;
    highestSeasonalityDay: string;
    lowestSeasonalityDay: string;
    weekendSurgePct: number;
    totalFalseAlarmsAvoided: number;
    totalLeaksDetected: number;
    overallPredictiveConfidencePct: number;
  };
}
