export type ThresholdStatus = 'optimal' | 'warning' | 'critical';

export interface KPIThresholdRule {
  id: string;
  label: string;
  shortLabel: string;
  unit: '$' | '%' | 'x' | 'días';
  target: number;       // Valor óptimo (Verde)
  warning: number;      // Valor de advertencia preventiva (Amarillo)
  critical: number;     // Valor crítico que detona alerta inmediata (Rojo)
  lowerIsBetter?: boolean; // True para métricas como Días de Inventario (menor = mejor)
  isRevenueDailyRate?: boolean; // Para facturación: escala con la cantidad de días del período seleccionado
  description: string;
  cfoCriticalAction: string;
  cfoWarningAction: string;
}

export interface KPIThresholdConfig {
  gmroi: KPIThresholdRule;
  aov: KPIThresholdRule;
  weightedGrossMarginPct: KPIThresholdRule;
  totalSales: KPIThresholdRule;
  operatingEbitda: KPIThresholdRule;
  daysSalesInventory: KPIThresholdRule;
}

export interface KPIEvaluation {
  status: ThresholdStatus;
  currentValue: number;
  effectiveTarget: number;
  effectiveWarning: number;
  effectiveCritical: number;
  pctOfTarget: number; // Porcentaje alcanzado del objetivo (100% = meta cumplida)
  gapAmount: number;   // Brecha absoluta frente al objetivo (positivo = superávit, negativo = déficit)
  statusLabel: string; // "En Objetivo" | "Alerta Preventiva" | "Crítico"
  statusBadgeText: string;
  recommendation: string;
}

export type ThresholdPresetId = 'cfo_sme_retail' | 'cash_liquidity_strict' | 'aggressive_growth';

export interface ThresholdPreset {
  id: ThresholdPresetId;
  name: string;
  description: string;
  config: KPIThresholdConfig;
}
