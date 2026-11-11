export type ProductFormatType = 'granel' | 'saco' | 'unidad';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  formatType?: ProductFormatType;
  isGranel?: boolean;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  ticketNumber: string;
  date: string; // ISO string YYYY-MM-DDTHH:mm:ss
  items: SaleItem[];
  totalAmount: number;
  paymentMethod?: string;
  customerType?: 'regular' | 'nuevo' | 'frecuente';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  formatType: ProductFormatType;
  stock: number;
  costPrice: number;
  salePrice: number;
  unitOfMeasure: 'kg' | 'unidad';
  minStock?: number;
}

export type KardexMovementType = 'ENTRADA' | 'VENTA' | 'MERMA' | 'AJUSTE' | 'DEVOLUCION';

export interface KardexEntry {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: KardexMovementType;
  reason?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

// Business Intelligence Calculated Types
export interface KPISummary {
  gmroi: number; // Gross Margin Return on Investment (Gross Margin $ / Average Inventory Cost)
  gmroiStatus: 'optimal' | 'acceptable' | 'critical';
  aov: number; // Average Order Value (Ticket Promedio)
  totalSales: number;
  totalCogs: number;
  grossMarginAmount: number;
  weightedGrossMarginPct: number; // (Sales - COGS) / Sales * 100
  totalExpenses: number;
  operatingEbitda: number; // Gross Margin $ - Expenses $
  ebitdaMarginPct: number;
  inventoryValue: number;
  inventoryTurnoverRatio: number; // COGS / Inventory
  daysSalesInventory: number; // 365 / Turnover
  ticketCount: number;
  itemsSold: number;
}

export type BCGQuadrant = 'star' | 'cash_cow' | 'question_mark' | 'dog';

export interface BCGProductMetrics {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  formatType: ProductFormatType;
  unitsSold: number;
  revenue: number;
  cogs: number;
  grossMarginAmount: number;
  marginPct: number;
  stock: number;
  stockValue: number;
  rotationRate: number; // units sold / period
  quadrant: BCGQuadrant;
  recommendation: string;
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  dayName: string;
  hour: number; // 0 - 23
  salesAmount: number;
  ticketCount: number;
  isPeak: boolean;
}

export interface AssociationRule {
  itemA: string;
  itemB: string;
  skuA: string;
  skuB: string;
  coOccurrenceCount: number;
  supportPct: number; // % of total orders containing both
  confidencePct: number; // probability of B given A
  lift: number; // (>1 indicates strong positive association)
  strategicAction: string;
}

export interface GranelVsSacoComparison {
  granel: {
    revenue: number;
    unitsKg: number;
    cogs: number;
    grossMarginAmount: number;
    marginPct: number;
    avgPricePerKg: number;
  };
  saco: {
    revenue: number;
    unitsSacos: number;
    cogs: number;
    grossMarginAmount: number;
    marginPct: number;
    avgPricePerUnit: number;
    equivalentKg: number;
  };
  marginDeltaPct: number; // granel margin - saco margin
  shrinkageTotalCost: number;
  shrinkageKg: number;
  shrinkageRatePct: number; // Shrinkage cost / total bulk cost
  shrinkageBreakdown: {
    reason: string;
    cost: number;
    quantity: number;
    pct: number;
  }[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  order: number;
}

// 1. Stock Coverage & Runway Intelligence
export type CoverageStatus = 'critical_stockout' | 'reorder_point' | 'healthy' | 'overstock';

export interface StockCoverageMetric {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  formatType: ProductFormatType;
  stock: number;
  minStock: number;
  dailyVelocity: number; // units sold per day in period
  daysOfCoverage: number; // stock / dailyVelocity
  status: CoverageStatus;
  stockValueCost: number;
  reorderUnitsNeeded: number;
  capitalNeeded: number;
  riskDailyRevenueLoss: number;
}

// 2. Period-over-Period Comparison
export interface PeriodComparison {
  hasPreviousData: boolean;
  currentRevenue: number;
  previousRevenue: number;
  revenueDeltaPct: number;
  currentTickets: number;
  previousTickets: number;
  ticketsDeltaPct: number;
  currentAov: number;
  previousAov: number;
  aovDeltaPct: number;
  currentMarginPct: number;
  previousMarginPct: number;
  marginDeltaPts: number;
  currentEbitda: number;
  previousEbitda: number;
  ebitdaDeltaPct: number;
}

// 3. Executive Insights & Anomalies
export type InsightSeverity = 'critical' | 'warning' | 'opportunity' | 'positive';

export interface ExecutiveInsight {
  id: string;
  title: string;
  type: 'risk' | 'opportunity';
  severity: InsightSeverity;
  metricLabel: string;
  metricValue: string;
  financialImpact: number;
  description: string;
  recommendedAction: string;
  category: 'inventory' | 'margin' | 'pricing' | 'basket' | 'shrinkage';
}

// 4. What-If Scenario Simulation
export interface WhatIfSimulationState {
  bulkPriceChangePct: number; // -10 to +25%
  shrinkageReductionPct: number; // 0 to 80% reduction
  supplierDiscountPct: number; // 0 to 10% discount
  crossSellingAovIncreasePct: number; // 0 to 15% ticket lift
}

export interface WhatIfSimulationResult {
  baseAnnualGrossMargin: number;
  projectedAnnualGrossMargin: number;
  marginIncreaseAmount: number;
  marginIncreasePct: number;
  baseAnnualEbitda: number;
  projectedAnnualEbitda: number;
  ebitdaIncreaseAmount: number;
  ebitdaIncreasePct: number;
  bulkRevenueGain: number;
  shrinkageRecoveredAmount: number;
  costSavingsAmount: number;
  basketAovGain: number;
}

// 5. Multidimensional Filters
export type ProductCategoryFilter =
  | 'all'
  | 'Alimentos Perro'
  | 'Alimentos Gato'
  | 'Farmacia & Pipetas'
  | 'Higiene & Arenas'
  | 'Accesorios & Juguetes';

export type ProductFormatFilter = 'all' | 'granel' | 'saco' | 'unidad';

