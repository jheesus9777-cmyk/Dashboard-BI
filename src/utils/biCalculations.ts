import {
  Sale,
  Product,
  Expense,
  KardexEntry,
  KPISummary,
  BCGProductMetrics,
  BCGQuadrant,
  HeatmapCell,
  AssociationRule,
  GranelVsSacoComparison,
  StockCoverageMetric,
  CoverageStatus,
  PeriodComparison,
  ExecutiveInsight,
  WhatIfSimulationState,
  WhatIfSimulationResult,
} from '../types/bi';

export function calculateGMROI(grossMarginAmount: number, inventoryValue: number): { gmroi: number; status: 'optimal' | 'acceptable' | 'critical' } {
  if (inventoryValue <= 0) {
    return { gmroi: 0, status: 'critical' };
  }
  const gmroi = Number((grossMarginAmount / inventoryValue).toFixed(2));
  let status: 'optimal' | 'acceptable' | 'critical' = 'acceptable';
  if (gmroi >= 2.0) {
    status = 'optimal';
  } else if (gmroi < 1.4) {
    status = 'critical';
  }
  return { gmroi, status };
}

export function calculateAOV(totalSales: number, ticketCount: number): number {
  if (ticketCount <= 0) return 0;
  return Number((totalSales / ticketCount).toFixed(2));
}

export function calculateWeightedGrossMargin(totalSales: number, totalCogs: number): number {
  if (totalSales <= 0) return 0;
  const margin = ((totalSales - totalCogs) / totalSales) * 100;
  return Number(margin.toFixed(2));
}

export function calculateKPISummary(
  sales: Sale[],
  products: Product[],
  expenses: Expense[]
): KPISummary {
  const ticketCount = sales.length;
  let totalSales = 0;
  let totalCogs = 0;
  let itemsSold = 0;

  for (const sale of sales) {
    totalSales += sale.totalAmount || 0;
    if (sale.items && Array.isArray(sale.items)) {
      for (const item of sale.items) {
        itemsSold += item.quantity || 1;
        totalCogs += (item.unitCost || 0) * (item.quantity || 1);
      }
    }
  }

  const grossMarginAmount = Math.max(0, totalSales - totalCogs);
  const weightedGrossMarginPct = calculateWeightedGrossMargin(totalSales, totalCogs);
  const aov = calculateAOV(totalSales, ticketCount);

  // Total current inventory value at cost
  const inventoryValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.costPrice || 0), 0);
  const { gmroi, status: gmroiStatus } = calculateGMROI(grossMarginAmount, inventoryValue);

  // Operating Expenses & EBITDA
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const operatingEbitda = grossMarginAmount - totalExpenses;
  const ebitdaMarginPct = totalSales > 0 ? Number(((operatingEbitda / totalSales) * 100).toFixed(2)) : 0;

  // Turnover ratio = Annualized or period COGS / Avg Inventory
  const inventoryTurnoverRatio = inventoryValue > 0 ? Number((totalCogs / inventoryValue).toFixed(2)) : 0;
  const daysSalesInventory = inventoryTurnoverRatio > 0 ? Math.round(365 / (inventoryTurnoverRatio * 4)) : 0; // Normalized for quarterly/monthly run rate

  return {
    gmroi,
    gmroiStatus,
    aov,
    totalSales: Number(totalSales.toFixed(2)),
    totalCogs: Number(totalCogs.toFixed(2)),
    grossMarginAmount: Number(grossMarginAmount.toFixed(2)),
    weightedGrossMarginPct,
    totalExpenses: Number(totalExpenses.toFixed(2)),
    operatingEbitda: Number(operatingEbitda.toFixed(2)),
    ebitdaMarginPct,
    inventoryValue: Number(inventoryValue.toFixed(2)),
    inventoryTurnoverRatio,
    daysSalesInventory: Math.max(1, daysSalesInventory),
    ticketCount,
    itemsSold: Math.round(itemsSold),
  };
}

export function classifyBCGProducts(products: Product[], sales: Sale[]): BCGProductMetrics[] {
  // Aggregate sales per product
  const productAgg = new Map<string, { unitsSold: number; revenue: number; cogs: number }>();

  for (const sale of sales) {
    if (!sale.items) continue;
    for (const item of sale.items) {
      const current = productAgg.get(item.productId) || { unitsSold: 0, revenue: 0, cogs: 0 };
      const qty = item.quantity || 1;
      current.unitsSold += qty;
      current.revenue += item.subtotal || item.unitPrice * qty;
      current.cogs += (item.unitCost || 0) * qty;
      productAgg.set(item.productId, current);
    }
  }

  // Calculate raw metrics
  const rawList = products.map((prod) => {
    const agg = productAgg.get(prod.id) || { unitsSold: 0, revenue: 0, cogs: 0 };
    const grossMarginAmount = Math.max(0, agg.revenue - agg.cogs);
    const marginPct = agg.revenue > 0 ? Number(((grossMarginAmount / agg.revenue) * 100).toFixed(1)) : (
      prod.salePrice > 0 ? Number((((prod.salePrice - prod.costPrice) / prod.salePrice) * 100).toFixed(1)) : 0
    );
    const stockValue = (prod.stock || 0) * (prod.costPrice || 0);

    return {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      category: prod.category,
      formatType: prod.formatType,
      unitsSold: agg.unitsSold,
      revenue: Number(agg.revenue.toFixed(2)),
      cogs: Number(agg.cogs.toFixed(2)),
      grossMarginAmount: Number(grossMarginAmount.toFixed(2)),
      marginPct,
      stock: prod.stock,
      stockValue: Number(stockValue.toFixed(2)),
      rotationRate: agg.unitsSold,
    };
  });

  // Calculate dynamic medians for BCG matrix thresholds
  const rotationThreshold = 25; // units threshold for high rotation
  const marginThreshold = 32; // 32% margin threshold for pet retail

  return rawList.map((item) => {
    const isHighRotation = item.unitsSold >= rotationThreshold;
    const isHighMargin = item.marginPct >= marginThreshold;

    let quadrant: BCGQuadrant;
    let recommendation: string;

    if (isHighRotation && isHighMargin) {
      quadrant = 'star';
      recommendation = 'Invertir en abasto prioritario, asegurar stock sin quiebres y exhibición destacada.';
    } else if (isHighRotation && !isHighMargin) {
      quadrant = 'cash_cow';
      recommendation = 'Ordeñar flujo de caja, negociar mejores costos con proveedores y no sobreinvertir en marketing.';
    } else if (!isHighRotation && isHighMargin) {
      quadrant = 'question_mark';
      recommendation = 'Evaluar elasticidad de precio, implementar venta consultiva o promocionar en bundles.';
    } else {
      quadrant = 'dog';
      recommendation = 'Liquidar remanentes, reducir espacio en góndola o descontinuar SKU de baja rotación.';
    }

    return {
      ...item,
      quadrant,
      recommendation,
    };
  });
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function generateHourlyHeatmap(sales: Sale[]): { cells: HeatmapCell[]; maxSales: number; maxTickets: number } {
  // Initialize 7 x 24 grid
  const grid: Record<string, HeatmapCell> = {};
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      grid[key] = {
        dayOfWeek: day,
        dayName: DAYS_ES[day],
        hour,
        salesAmount: 0,
        ticketCount: 0,
        isPeak: false,
      };
    }
  }

  let maxSales = 0;
  let maxTickets = 0;

  for (const sale of sales) {
    if (!sale.date) continue;
    const d = new Date(sale.date);
    if (isNaN(d.getTime())) continue;

    const day = d.getDay();
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    if (grid[key]) {
      grid[key].salesAmount += sale.totalAmount || 0;
      grid[key].ticketCount += 1;
      if (grid[key].salesAmount > maxSales) maxSales = grid[key].salesAmount;
      if (grid[key].ticketCount > maxTickets) maxTickets = grid[key].ticketCount;
    }
  }

  // Mark top 10% peak intervals
  const peakThreshold = maxSales * 0.75;
  const cells = Object.values(grid).map((cell) => ({
    ...cell,
    salesAmount: Number(cell.salesAmount.toFixed(2)),
    isPeak: cell.salesAmount > 0 && cell.salesAmount >= peakThreshold,
  }));

  return { cells, maxSales, maxTickets };
}

export function calculateMarketBasketRules(sales: Sale[]): AssociationRule[] {
  const itemCounts = new Map<string, { count: number; name: string; sku: string }>();
  const pairCounts = new Map<string, { count: number; nameA: string; nameB: string; skuA: string; skuB: string }>();
  let multiItemTickets = 0;

  for (const sale of sales) {
    if (!sale.items || sale.items.length < 2) continue;
    multiItemTickets++;

    // Unique product IDs in this ticket
    const uniqueProducts = Array.from(new Set(sale.items.map((i) => i.productId)));

    for (const prodId of uniqueProducts) {
      const item = sale.items.find((i) => i.productId === prodId)!;
      const current = itemCounts.get(prodId) || { count: 0, name: item.productName, sku: item.sku };
      current.count += 1;
      itemCounts.set(prodId, current);
    }

    // Pair combinations
    for (let i = 0; i < uniqueProducts.length; i++) {
      for (let j = i + 1; j < uniqueProducts.length; j++) {
        const idA = uniqueProducts[i];
        const idB = uniqueProducts[j];
        const key = [idA, idB].sort().join(':::');

        const itemA = sale.items.find((x) => x.productId === idA)!;
        const itemB = sale.items.find((x) => x.productId === idB)!;

        const currentPair = pairCounts.get(key) || {
          count: 0,
          nameA: itemA.productName,
          nameB: itemB.productName,
          skuA: itemA.sku,
          skuB: itemB.sku,
        };
        currentPair.count += 1;
        pairCounts.set(key, currentPair);
      }
    }
  }

  const totalOrders = Math.max(1, sales.length);
  const rules: AssociationRule[] = [];

  pairCounts.forEach((data) => {
    const supportPct = Number(((data.count / totalOrders) * 100).toFixed(1));
    const countA = itemCounts.get(data.skuA)?.count || itemCounts.values().next().value?.count || data.count;
    const confidencePct = Number(((data.count / Math.max(1, countA)) * 100).toFixed(1));
    
    // Lift = P(A & B) / (P(A) * P(B))
    const expectedFreq = (countA / totalOrders) * (countA / totalOrders);
    const lift = Number(Math.max(1.1, (data.count / totalOrders) / Math.max(0.01, expectedFreq)).toFixed(2));

    let strategicAction = 'Ofrecer descuento bundle cruzado en caja.';
    if (lift > 2.5) {
      strategicAction = 'Asociación premium: ubicar juntos en cabecera de pasillo o checkout.';
    } else if (confidencePct > 50) {
      strategicAction = 'Alta probabilidad: sugerencia automática al cajero cuando se escanee el item principal.';
    }

    rules.push({
      itemA: data.nameA,
      itemB: data.nameB,
      skuA: data.skuA,
      skuB: data.skuB,
      coOccurrenceCount: data.count,
      supportPct,
      confidencePct: Math.min(100, confidencePct),
      lift,
      strategicAction,
    });
  });

  return rules.sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount).slice(0, 15);
}

export function calculateGranelVsSaco(
  sales: Sale[],
  products: Product[],
  kardex: KardexEntry[]
): GranelVsSacoComparison {
  const granel = {
    revenue: 0,
    unitsKg: 0,
    cogs: 0,
    grossMarginAmount: 0,
    marginPct: 0,
    avgPricePerKg: 0,
  };

  const saco = {
    revenue: 0,
    unitsSacos: 0,
    cogs: 0,
    grossMarginAmount: 0,
    marginPct: 0,
    avgPricePerUnit: 0,
    equivalentKg: 0,
  };

  // Analyze sales
  for (const sale of sales) {
    if (!sale.items) continue;
    for (const item of sale.items) {
      const isGranel = item.formatType === 'granel' || item.isGranel || item.category.toLowerCase().includes('granel') || item.productName.toLowerCase().includes('granel');
      const isSaco = item.formatType === 'saco' || (!isGranel && item.unitPrice > 15000 && item.category.includes('Alimento'));

      const revenue = item.subtotal || item.unitPrice * (item.quantity || 1);
      const cogs = (item.unitCost || 0) * (item.quantity || 1);

      if (isGranel) {
        granel.revenue += revenue;
        granel.unitsKg += item.quantity || 1;
        granel.cogs += cogs;
      } else if (isSaco) {
        saco.revenue += revenue;
        saco.unitsSacos += item.quantity || 1;
        saco.cogs += cogs;
        // Average saco is 15kg
        saco.equivalentKg += (item.quantity || 1) * 15;
      }
    }
  }

  granel.grossMarginAmount = Math.max(0, granel.revenue - granel.cogs);
  granel.marginPct = granel.revenue > 0 ? Number(((granel.grossMarginAmount / granel.revenue) * 100).toFixed(1)) : 0;
  granel.avgPricePerKg = granel.unitsKg > 0 ? Number((granel.revenue / granel.unitsKg).toFixed(2)) : 0;

  saco.grossMarginAmount = Math.max(0, saco.revenue - saco.cogs);
  saco.marginPct = saco.revenue > 0 ? Number(((saco.grossMarginAmount / saco.revenue) * 100).toFixed(1)) : 0;
  saco.avgPricePerUnit = saco.unitsSacos > 0 ? Number((saco.revenue / saco.unitsSacos).toFixed(2)) : 0;

  const marginDeltaPct = Number((granel.marginPct - saco.marginPct).toFixed(1));

  // Shrinkage analysis from kardex
  const shrinkageEntries = kardex.filter((k) => k.type === 'MERMA');
  let shrinkageTotalCost = 0;
  let shrinkageKg = 0;
  const reasonMap = new Map<string, { cost: number; quantity: number }>();

  for (const entry of shrinkageEntries) {
    shrinkageTotalCost += entry.totalCost || entry.quantity * entry.unitCost;
    shrinkageKg += entry.quantity || 0;
    const reason = entry.reason || 'Merma operativa / Descalce';
    const current = reasonMap.get(reason) || { cost: 0, quantity: 0 };
    current.cost += entry.totalCost || entry.quantity * entry.unitCost;
    current.quantity += entry.quantity || 0;
    reasonMap.set(reason, current);
  }

  const shrinkageBreakdown = Array.from(reasonMap.entries()).map(([reason, data]) => ({
    reason,
    cost: Number(data.cost.toFixed(2)),
    quantity: Number(data.quantity.toFixed(1)),
    pct: shrinkageTotalCost > 0 ? Number(((data.cost / shrinkageTotalCost) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.cost - a.cost);

  // Shrinkage rate over total granel inventory cost or COGS
  const totalBaseCost = granel.cogs > 0 ? granel.cogs : 100000;
  const shrinkageRatePct = Number(((shrinkageTotalCost / totalBaseCost) * 100).toFixed(2));

  return {
    granel: {
      revenue: Number(granel.revenue.toFixed(2)),
      unitsKg: Number(granel.unitsKg.toFixed(1)),
      cogs: Number(granel.cogs.toFixed(2)),
      grossMarginAmount: Number(granel.grossMarginAmount.toFixed(2)),
      marginPct: granel.marginPct,
      avgPricePerKg: granel.avgPricePerKg,
    },
    saco: {
      revenue: Number(saco.revenue.toFixed(2)),
      unitsSacos: Math.round(saco.unitsSacos),
      cogs: Number(saco.cogs.toFixed(2)),
      grossMarginAmount: Number(saco.grossMarginAmount.toFixed(2)),
      marginPct: saco.marginPct,
      avgPricePerUnit: saco.avgPricePerUnit,
      equivalentKg: Math.round(saco.equivalentKg),
    },
    marginDeltaPct,
    shrinkageTotalCost: Number(shrinkageTotalCost.toFixed(2)),
    shrinkageKg: Number(shrinkageKg.toFixed(1)),
    shrinkageRatePct,
    shrinkageBreakdown,
  };
}

// 1. Stock Coverage & Runway Intelligence
export function calculateStockCoverage(
  products: Product[],
  sales: Sale[],
  daysInPeriod: number
): StockCoverageMetric[] {
  const safeDays = Math.max(1, daysInPeriod);

  const soldMap = new Map<string, { unitsSold: number; revenue: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const prev = soldMap.get(item.productId) || { unitsSold: 0, revenue: 0 };
      prev.unitsSold += item.quantity;
      prev.revenue += item.subtotal;
      soldMap.set(item.productId, prev);
    }
  }

  return products.map((prod) => {
    const sold = soldMap.get(prod.id) || { unitsSold: 0, revenue: 0 };
    const dailyVelocity = Number((sold.unitsSold / safeDays).toFixed(2));
    const minStock = prod.minStock ?? 10;

    let daysOfCoverage = 999;
    if (dailyVelocity > 0) {
      daysOfCoverage = Number((prod.stock / dailyVelocity).toFixed(1));
    } else if (prod.stock === 0) {
      daysOfCoverage = 0;
    }

    let status: CoverageStatus = 'healthy';
    if (prod.stock === 0 || daysOfCoverage <= 3.5) {
      status = 'critical_stockout';
    } else if (daysOfCoverage <= 10 || prod.stock <= minStock) {
      status = 'reorder_point';
    } else if (daysOfCoverage > 45 && prod.stock > minStock * 2) {
      status = 'overstock';
    } else {
      status = 'healthy';
    }

    const avgPrice = sold.unitsSold > 0 ? sold.revenue / sold.unitsSold : prod.salePrice;
    const riskDailyRevenueLoss = dailyVelocity * avgPrice;

    const targetStock = Math.max(minStock, Math.ceil(dailyVelocity * 30));
    const reorderUnitsNeeded = Math.max(0, targetStock - prod.stock);
    const capitalNeeded = reorderUnitsNeeded * prod.costPrice;

    return {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      category: prod.category,
      formatType: prod.formatType,
      stock: prod.stock,
      minStock,
      dailyVelocity,
      daysOfCoverage,
      status,
      stockValueCost: prod.stock * prod.costPrice,
      reorderUnitsNeeded,
      capitalNeeded,
      riskDailyRevenueLoss: Math.round(riskDailyRevenueLoss),
    };
  }).sort((a, b) => {
    const statusWeight: Record<CoverageStatus, number> = {
      critical_stockout: 0,
      reorder_point: 1,
      overstock: 2,
      healthy: 3,
    };
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    return b.riskDailyRevenueLoss - a.riskDailyRevenueLoss;
  });
}

// 2. Period-over-Period Comparison
export function calculatePeriodComparison(
  currentSales: Sale[],
  previousSales: Sale[],
  currentExpenses: Expense[],
  previousExpenses: Expense[]
): PeriodComparison {
  const currentRevenue = currentSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const previousRevenue = previousSales.reduce((acc, s) => acc + s.totalAmount, 0);

  const currentTickets = currentSales.length;
  const previousTickets = previousSales.length;

  const currentAov = currentTickets > 0 ? currentRevenue / currentTickets : 0;
  const previousAov = previousTickets > 0 ? previousRevenue / previousTickets : 0;

  const currentCost = currentSales.reduce((acc, s) => acc + s.items.reduce((sum, it) => sum + (it.unitCost * it.quantity), 0), 0);
  const previousCost = previousSales.reduce((acc, s) => acc + s.items.reduce((sum, it) => sum + (it.unitCost * it.quantity), 0), 0);

  const currentMarginPct = currentRevenue > 0 ? Number((((currentRevenue - currentCost) / currentRevenue) * 100).toFixed(2)) : 0;
  const previousMarginPct = previousRevenue > 0 ? Number((((previousRevenue - previousCost) / previousRevenue) * 100).toFixed(2)) : 0;

  const currentExpTotal = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
  const previousExpTotal = previousExpenses.reduce((acc, e) => acc + e.amount, 0);

  const currentEbitda = (currentRevenue - currentCost) - currentExpTotal;
  const previousEbitda = (previousRevenue - previousCost) - previousExpTotal;

  const revenueDeltaPct = previousRevenue > 0 ? Number((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : 0;
  const ticketsDeltaPct = previousTickets > 0 ? Number((((currentTickets - previousTickets) / previousTickets) * 100).toFixed(1)) : 0;
  const aovDeltaPct = previousAov > 0 ? Number((((currentAov - previousAov) / previousAov) * 100).toFixed(1)) : 0;
  const marginDeltaPts = Number((currentMarginPct - previousMarginPct).toFixed(2));
  const ebitdaDeltaPct = previousEbitda !== 0 ? Number((((currentEbitda - previousEbitda) / Math.abs(previousEbitda)) * 100).toFixed(1)) : 0;

  return {
    hasPreviousData: previousSales.length > 0,
    currentRevenue,
    previousRevenue,
    revenueDeltaPct,
    currentTickets,
    previousTickets,
    ticketsDeltaPct,
    currentAov,
    previousAov,
    aovDeltaPct,
    currentMarginPct,
    previousMarginPct,
    marginDeltaPts,
    currentEbitda,
    previousEbitda,
    ebitdaDeltaPct,
  };
}

// 3. What-If Scenario Simulation
export function calculateWhatIfSimulation(
  kpis: KPISummary,
  granelVsSaco: GranelVsSacoComparison,
  simulation: WhatIfSimulationState
): WhatIfSimulationResult {
  const baseMonthlyGrossMargin = kpis.grossMarginAmount;
  const baseMonthlyEbitda = kpis.operatingEbitda;
  const baseAnnualGrossMargin = baseMonthlyGrossMargin * 12;
  const baseAnnualEbitda = baseMonthlyEbitda * 12;

  // 1. Bulk Price Change effect (applied to granel revenue)
  const monthlyBulkRevenueGain = granelVsSaco.granel.revenue * (simulation.bulkPriceChangePct / 100);
  const bulkRevenueGain = monthlyBulkRevenueGain * 12;

  // 2. Shrinkage Reduction (recovered cost flowing straight to margin)
  const monthlyShrinkageRecovered = granelVsSaco.shrinkageTotalCost * (simulation.shrinkageReductionPct / 100);
  const shrinkageRecoveredAmount = monthlyShrinkageRecovered * 12;

  // 3. Supplier Discount effect (savings on total COGS)
  const monthlyCostSavings = kpis.totalCogs * (simulation.supplierDiscountPct / 100);
  const costSavingsAmount = monthlyCostSavings * 12;

  // 4. Cross-Selling AOV lift (sales increase at weighted gross margin rate)
  const monthlyBasketGain = (kpis.totalSales * (simulation.crossSellingAovIncreasePct / 100)) * (kpis.weightedGrossMarginPct / 100);
  const basketAovGain = monthlyBasketGain * 12;

  const marginIncreaseAmount = Math.round(bulkRevenueGain + shrinkageRecoveredAmount + costSavingsAmount + basketAovGain);
  const projectedAnnualGrossMargin = baseAnnualGrossMargin + marginIncreaseAmount;
  const marginIncreasePct = baseAnnualGrossMargin > 0 ? Number(((marginIncreaseAmount / baseAnnualGrossMargin) * 100).toFixed(1)) : 0;

  const ebitdaIncreaseAmount = marginIncreaseAmount;
  const projectedAnnualEbitda = baseAnnualEbitda + ebitdaIncreaseAmount;
  const ebitdaIncreasePct = baseAnnualEbitda !== 0 ? Number(((ebitdaIncreaseAmount / Math.abs(baseAnnualEbitda)) * 100).toFixed(1)) : 0;

  return {
    baseAnnualGrossMargin,
    projectedAnnualGrossMargin,
    marginIncreaseAmount,
    marginIncreasePct,
    baseAnnualEbitda,
    projectedAnnualEbitda,
    ebitdaIncreaseAmount,
    ebitdaIncreasePct,
    bulkRevenueGain: Math.round(bulkRevenueGain),
    shrinkageRecoveredAmount: Math.round(shrinkageRecoveredAmount),
    costSavingsAmount: Math.round(costSavingsAmount),
    basketAovGain: Math.round(basketAovGain),
  };
}

// 4. Executive Insights & Anomalies
export function generateExecutiveInsights(
  kpis: KPISummary,
  granelVsSaco: GranelVsSacoComparison,
  coverageMetrics: StockCoverageMetric[],
  bcgMetrics: BCGProductMetrics[],
  associationRules: AssociationRule[]
): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];

  // Insight 1: Shrinkage Alert
  if (granelVsSaco.shrinkageRatePct > 4) {
    const annualShrinkageLoss = Math.round(granelVsSaco.shrinkageTotalCost * 12);
    insights.push({
      id: 'insight_shrinkage',
      title: 'Tasa de Merma en Tolvas por Encima de Tolerancia Directiva',
      type: 'risk',
      severity: 'critical',
      category: 'shrinkage',
      metricLabel: 'Merma Actual s/ Granel',
      metricValue: `${granelVsSaco.shrinkageRatePct}% (Meta: ≤ 2.5%)`,
      financialImpact: annualShrinkageLoss,
      description: `Se registran $${Math.round(granelVsSaco.shrinkageTotalCost).toLocaleString('es-CL')} en pérdidas físicas en Kardex (roturas y descalces de peso en balanza).`,
      recommendedAction: 'Calibrar básculas digitales de tolvas granel e implementar protocolo de refuerzo en bodegaje de sacos para frenar fuga de capital.',
    });
  }

  // Insight 2: Stockout Risk on High Velocity Leaders
  const criticalStars = coverageMetrics.filter((m) => m.status === 'critical_stockout' && m.dailyVelocity > 0);
  if (criticalStars.length > 0) {
    const totalDailyLoss = criticalStars.reduce((acc, m) => acc + m.riskDailyRevenueLoss, 0);
    const starNames = criticalStars.map((m) => m.productName).slice(0, 2).join(' y ');
    insights.push({
      id: 'insight_stockouts',
      title: `Riesgo de Quiebre Inminente en ${criticalStars.length} SKU(s) Clave`,
      type: 'risk',
      severity: 'critical',
      category: 'inventory',
      metricLabel: 'Ventas en Riesgo Diario',
      metricValue: `$${totalDailyLoss.toLocaleString('es-CL')}/día`,
      financialImpact: totalDailyLoss * 30,
      description: `Productos de alta demanda como ${starNames} tienen menos de 4 días de stock restante.`,
      recommendedAction: 'Emitir orden de compra prioritaria con proveedores para reabastecer antes de agotar existencia y perder clientes.',
    });
  }

  // Insight 3: High Margin Opportunity on Stars
  const topStars = bcgMetrics.filter((b) => b.quadrant === 'star' && b.marginPct > 45 && b.unitsSold >= 20);
  if (topStars.length > 0) {
    const monthlyStarRev = topStars.reduce((acc, b) => acc + b.revenue, 0);
    const potentialGain = Math.round(monthlyStarRev * 0.04 * 12);
    insights.push({
      id: 'insight_star_pricing',
      title: 'Elasticidad Favorable en Alimentos Granel y Antiparasitarios Líderes',
      type: 'opportunity',
      severity: 'opportunity',
      category: 'pricing',
      metricLabel: 'Ganancia Proyectada (+4% P)',
      metricValue: `+$${potentialGain.toLocaleString('es-CL')}/año`,
      financialImpact: potentialGain,
      description: `${topStars.length} productos en cuadrante Estrella concentran altísima fidelidad de compra y margen robusto.`,
      recommendedAction: 'Aplicar micro-ajuste de +3% a +4% en precio de venta a granel. El mercado tolera el desvío sin resentir la rotación.',
    });
  }

  // Insight 4: Cross-Selling Bundle Opportunity
  const topRule = associationRules[0];
  if (topRule && topRule.lift > 2.0 && topRule.supportPct >= 15) {
    const projectedBundleLift = Math.round(kpis.totalSales * 0.035 * 12);
    insights.push({
      id: 'insight_bundle',
      title: `Oportunidad de Combo Directo: ${topRule.itemA} + ${topRule.itemB}`,
      type: 'opportunity',
      severity: 'opportunity',
      category: 'basket',
      metricLabel: `Lift de Afinidad`,
      metricValue: `${topRule.lift}x (${topRule.confidencePct}% confianza)`,
      financialImpact: projectedBundleLift,
      description: `Ambos productos co-ocurren en ${topRule.coOccurrenceCount} transacciones. Quien compra ${topRule.itemA} tiene alta propensión a añadir ${topRule.itemB}.`,
      recommendedAction: 'Instruir al personal de caja y ubicar exhibidores cruzados en cabecera de pasillo para capturar compra por impulso.',
    });
  }

  // Insight 5: Capital tied up in Dead Stock (Dogs / Huesos)
  const deadDogs = bcgMetrics.filter((b) => b.quadrant === 'dog' && b.stockValue > 0);
  if (deadDogs.length > 0) {
    const totalTiedCapital = deadDogs.reduce((acc, b) => acc + b.stockValue, 0);
    insights.push({
      id: 'insight_dead_stock',
      title: 'Capital Inmovilizado en Cuadrante Huesos / Perros',
      type: 'risk',
      severity: 'warning',
      category: 'inventory',
      metricLabel: 'Capital Atrapado en Stock',
      metricValue: `$${totalTiedCapital.toLocaleString('es-CL')}`,
      financialImpact: totalTiedCapital,
      description: `${deadDogs.length} referencias de baja rotación y bajo margen tienen capital estacionado en vitrinas y bodega.`,
      recommendedAction: 'Ejecutar liquidación con 15%-20% de descuento o venta en combos como regalo de fidelización para recuperar liquidez.',
    });
  }

  return insights;
}

