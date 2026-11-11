import {
  KPIThresholdConfig,
  KPIThresholdRule,
  KPIEvaluation,
  ThresholdStatus,
  ThresholdPreset,
} from '../types/thresholds';
import { KPISummary } from '../types/bi';

export const THRESHOLDS_STORAGE_KEY = 'petstock_kpi_critical_thresholds_v2';

export const DEFAULT_CFO_THRESHOLDS: KPIThresholdConfig = {
  gmroi: {
    id: 'gmroi',
    label: 'GMROI (Retorno s/ Inventario)',
    shortLabel: 'GMROI',
    unit: 'x',
    target: 2.0,
    warning: 1.5,
    critical: 1.2,
    lowerIsBetter: false,
    description: 'Margen bruto generado por cada peso invertido en stock de mercadería.',
    cfoCriticalAction: 'Liquidar SKUs con rotación cero (quadrant Perro) para recuperar capital de trabajo antes de 48h.',
    cfoWarningAction: 'Revisar compras de reposición y priorizar SKUs Vaca Lechera de alta velocidad.',
  },
  aov: {
    id: 'aov',
    label: 'Ticket Promedio (AOV)',
    shortLabel: 'Ticket Promedio',
    unit: '$',
    target: 15000,
    warning: 12500,
    critical: 10000,
    lowerIsBetter: false,
    description: 'Monto promedio facturado por cliente en cada compra física o digital.',
    cfoCriticalAction: 'Implementar cross-selling en punto de venta con snacks y complementos de alto margen.',
    cfoWarningAction: 'Monitorear mix de tickets y capacitar al equipo en sugerencia de formatos grandes.',
  },
  weightedGrossMarginPct: {
    id: 'weightedGrossMarginPct',
    label: 'Margen Bruto Ponderado Real',
    shortLabel: 'Margen Bruto',
    unit: '%',
    target: 35.0,
    warning: 30.0,
    critical: 25.0,
    lowerIsBetter: false,
    description: 'Porcentaje de utilidad bruta real sobre ventas netas tras descontar costo de adquisición (COGS).',
    cfoCriticalAction: 'Auditar mermas en granel y frenar descuentos directos en mostrador en las próximas 48h.',
    cfoWarningAction: 'Ajustar precios en categorías con valor percibido y renegociar bonificaciones con proveedores.',
  },
  totalSales: {
    id: 'totalSales',
    label: 'Facturación Neta Total',
    shortLabel: 'Facturación Neta',
    unit: '$',
    target: 350000, // Meta base diaria, se escala automáticamente según los días del período
    warning: 280000,
    critical: 220000,
    lowerIsBetter: false,
    isRevenueDailyRate: true,
    description: 'Ingresos netos facturados en el período (calculado con meta diaria base).',
    cfoCriticalAction: 'Activar campaña de reactivación a clientes recurrentes inactivos y promociones de fin de semana.',
    cfoWarningAction: 'Verificar sell-out por tienda y reforzar disponibilidad de productos Estrella.',
  },
  operatingEbitda: {
    id: 'operatingEbitda',
    label: 'EBITDA Operativo Estimado',
    shortLabel: 'EBITDA Operativo',
    unit: '$',
    target: 50000, // Meta base diaria (~$1.5M mensual)
    warning: 25000,
    critical: 0,
    lowerIsBetter: false,
    isRevenueDailyRate: true,
    description: 'Utilidad operativa antes de intereses e impuestos tras descontar nómina y gastos fijos.',
    cfoCriticalAction: 'Congelar gastos no indispensables inmediatamente y revisar flujo de caja proyectado a 13 semanas.',
    cfoWarningAction: 'Revisar partidas de gastos de operación y consumo de suministros.',
  },
  daysSalesInventory: {
    id: 'daysSalesInventory',
    label: 'Días de Inventario (DSI)',
    shortLabel: 'Días Inventario (DSI)',
    unit: 'días',
    target: 45,
    warning: 75,
    critical: 90,
    lowerIsBetter: true, // ¡Menos días es mejor!
    description: 'Días promedio en que el inventario se vende y se convierte en efectivo en caja.',
    cfoCriticalAction: 'Frenar órdenes de compra en categorías con sobrestock (>75 días) y liquidar excedentes a precio de costo.',
    cfoWarningAction: 'Ajustar puntos de reorden (ROP) y negociar devoluciones con proveedores.',
  },
};

export const THRESHOLD_PRESETS: ThresholdPreset[] = [
  {
    id: 'cfo_sme_retail',
    name: 'Estándar CFO PYME Retail (Recomendado)',
    description: 'Métricas de referencia del marco CFO para tiendas de conveniencia, mascotas y alimentos en LatAm.',
    config: DEFAULT_CFO_THRESHOLDS,
  },
  {
    id: 'cash_liquidity_strict',
    name: 'Enfoque Estricto de Caja & Liquidez',
    description: 'Exige mayor rotación de inventario (DSI < 35d) y mayor rentabilidad mínima de margen (>37%).',
    config: {
      ...DEFAULT_CFO_THRESHOLDS,
      gmroi: { ...DEFAULT_CFO_THRESHOLDS.gmroi, target: 2.5, warning: 1.8, critical: 1.4 },
      weightedGrossMarginPct: { ...DEFAULT_CFO_THRESHOLDS.weightedGrossMarginPct, target: 38.0, warning: 33.0, critical: 28.0 },
      daysSalesInventory: { ...DEFAULT_CFO_THRESHOLDS.daysSalesInventory, target: 35, warning: 60, critical: 75 },
    },
  },
  {
    id: 'aggressive_growth',
    name: 'Expansión Comercial & Volumen',
    description: 'Prioriza volumen de facturación y tickets, tolerando márgenes ligeramente más ajustados para ganar cuota.',
    config: {
      ...DEFAULT_CFO_THRESHOLDS,
      aov: { ...DEFAULT_CFO_THRESHOLDS.aov, target: 17000, warning: 14000, critical: 11500 },
      totalSales: { ...DEFAULT_CFO_THRESHOLDS.totalSales, target: 450000, warning: 360000, critical: 280000 },
      weightedGrossMarginPct: { ...DEFAULT_CFO_THRESHOLDS.weightedGrossMarginPct, target: 32.0, warning: 28.0, critical: 24.0 },
    },
  },
];

/**
 * Loads configured thresholds from localStorage with fallback to DEFAULT_CFO_THRESHOLDS.
 */
export function loadKPIThresholdConfig(): KPIThresholdConfig {
  if (typeof window === 'undefined') return DEFAULT_CFO_THRESHOLDS;
  try {
    const raw = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
    if (!raw) return DEFAULT_CFO_THRESHOLDS;
    const parsed = JSON.parse(raw);
    return {
      gmroi: { ...DEFAULT_CFO_THRESHOLDS.gmroi, ...(parsed.gmroi || {}) },
      aov: { ...DEFAULT_CFO_THRESHOLDS.aov, ...(parsed.aov || {}) },
      weightedGrossMarginPct: {
        ...DEFAULT_CFO_THRESHOLDS.weightedGrossMarginPct,
        ...(parsed.weightedGrossMarginPct || {}),
      },
      totalSales: { ...DEFAULT_CFO_THRESHOLDS.totalSales, ...(parsed.totalSales || {}) },
      operatingEbitda: {
        ...DEFAULT_CFO_THRESHOLDS.operatingEbitda,
        ...(parsed.operatingEbitda || {}),
      },
      daysSalesInventory: {
        ...DEFAULT_CFO_THRESHOLDS.daysSalesInventory,
        ...(parsed.daysSalesInventory || {}),
      },
    };
  } catch (err) {
    console.warn('Error loading KPI thresholds from storage:', err);
    return DEFAULT_CFO_THRESHOLDS;
  }
}

/**
 * Saves threshold config to localStorage.
 */
export function saveKPIThresholdConfig(config: KPIThresholdConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Error saving KPI thresholds to storage:', err);
  }
}

/**
 * Evaluates a single KPI value against its threshold rule.
 */
export function evaluateKPI(
  currentValue: number,
  rule: KPIThresholdRule,
  daysCount = 1
): KPIEvaluation {
  // If rule scales daily (e.g. Sales, EBITDA), scale thresholds by period days
  const scale = rule.isRevenueDailyRate ? Math.max(1, daysCount) : 1;
  const effectiveTarget = rule.target * scale;
  const effectiveWarning = rule.warning * scale;
  const effectiveCritical = rule.critical * scale;

  let status: ThresholdStatus = 'optimal';
  let pctOfTarget = 100;
  let gapAmount = 0;

  if (rule.lowerIsBetter) {
    // For metrics where lower is better (e.g. DSI days):
    // optimal: <= target (e.g. <= 45 days)
    // warning: > target && <= warning (e.g. 46 to 75 days)
    // critical: > warning (e.g. > 75 days)
    if (currentValue <= effectiveTarget) {
      status = 'optimal';
    } else if (currentValue <= effectiveWarning) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    gapAmount = effectiveTarget - currentValue; // negative if current days exceed target
    pctOfTarget = effectiveTarget > 0 ? (effectiveTarget / Math.max(1, currentValue)) * 100 : 100;
  } else {
    // Standard metrics where higher is better:
    // optimal: >= target
    // warning: >= warning && < target
    // critical: < critical (or < warning)
    if (currentValue >= effectiveTarget) {
      status = 'optimal';
    } else if (currentValue >= effectiveWarning) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    gapAmount = currentValue - effectiveTarget;
    pctOfTarget = effectiveTarget > 0 ? (currentValue / effectiveTarget) * 100 : 100;
  }

  let statusLabel = 'En Objetivo';
  let statusBadgeText = 'En Objetivo';
  let recommendation = 'Rendimiento saludable. Continuar monitoreo regular.';

  if (status === 'warning') {
    statusLabel = 'Alerta Preventiva';
    statusBadgeText = 'Alerta Preventiva';
    recommendation = rule.cfoWarningAction;
  } else if (status === 'critical') {
    statusLabel = 'Crítico';
    statusBadgeText = 'Alerta Crítica (48h)';
    recommendation = rule.cfoCriticalAction;
  }

  return {
    status,
    currentValue,
    effectiveTarget,
    effectiveWarning,
    effectiveCritical,
    pctOfTarget: Math.round(pctOfTarget * 10) / 10,
    gapAmount,
    statusLabel,
    statusBadgeText,
    recommendation,
  };
}

export interface AllKPIEvaluations {
  gmroi: KPIEvaluation;
  aov: KPIEvaluation;
  weightedGrossMarginPct: KPIEvaluation;
  totalSales: KPIEvaluation;
  operatingEbitda: KPIEvaluation;
  daysSalesInventory: KPIEvaluation;
  optimalCount: number;
  warningCount: number;
  criticalCount: number;
  totalCount: number;
}

export function evaluateAllCockpitKPIs(
  kpis: KPISummary,
  config: KPIThresholdConfig,
  daysCount = 1
): AllKPIEvaluations {
  const gmroi = evaluateKPI(kpis.gmroi, config.gmroi, daysCount);
  const aov = evaluateKPI(kpis.aov, config.aov, daysCount);
  const weightedGrossMarginPct = evaluateKPI(
    kpis.weightedGrossMarginPct,
    config.weightedGrossMarginPct,
    daysCount
  );
  const totalSales = evaluateKPI(kpis.totalSales, config.totalSales, daysCount);
  const operatingEbitda = evaluateKPI(kpis.operatingEbitda, config.operatingEbitda, daysCount);
  const daysSalesInventory = evaluateKPI(
    kpis.daysSalesInventory,
    config.daysSalesInventory,
    daysCount
  );

  const evals = [gmroi, aov, weightedGrossMarginPct, totalSales, operatingEbitda, daysSalesInventory];
  const optimalCount = evals.filter((e) => e.status === 'optimal').length;
  const warningCount = evals.filter((e) => e.status === 'warning').length;
  const criticalCount = evals.filter((e) => e.status === 'critical').length;

  return {
    gmroi,
    aov,
    weightedGrossMarginPct,
    totalSales,
    operatingEbitda,
    daysSalesInventory,
    optimalCount,
    warningCount,
    criticalCount,
    totalCount: evals.length,
  };
}
