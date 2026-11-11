import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGMROI,
  calculateAOV,
  calculateWeightedGrossMargin,
  calculateKPISummary,
  classifyBCGProducts,
  generateHourlyHeatmap,
  calculateMarketBasketRules,
  calculateGranelVsSaco,
  calculateStockCoverage,
  calculatePeriodComparison,
  calculateWhatIfSimulation,
  generateExecutiveInsights,
} from './biCalculations';
import { Product, Sale, Expense, KardexEntry } from '../types/bi';

test('calculateGMROI calculates correct ratio and status', () => {
  // $25,000 gross margin over $10,000 inventory = 2.5 (optimal)
  const resultOptimal = calculateGMROI(25000, 10000);
  assert.equal(resultOptimal.gmroi, 2.5);
  assert.equal(resultOptimal.status, 'optimal');

  // $15,000 gross margin over $10,000 inventory = 1.5 (acceptable)
  const resultAcceptable = calculateGMROI(15000, 10000);
  assert.equal(resultAcceptable.gmroi, 1.5);
  assert.equal(resultAcceptable.status, 'acceptable');

  // $10,000 gross margin over $10,000 inventory = 1.0 (critical)
  const resultCritical = calculateGMROI(10000, 10000);
  assert.equal(resultCritical.gmroi, 1.0);
  assert.equal(resultCritical.status, 'critical');

  // Zero inventory guard
  const zeroInv = calculateGMROI(5000, 0);
  assert.equal(zeroInv.gmroi, 0);
  assert.equal(zeroInv.status, 'critical');
});

test('calculateAOV calculates ticket promedio correctly', () => {
  assert.equal(calculateAOV(50000, 20), 2500);
  assert.equal(calculateAOV(0, 0), 0);
  assert.equal(calculateAOV(100, 3), 33.33);
});

test('calculateWeightedGrossMargin calculates real weighted margin', () => {
  // Sales 100, Cost 60 -> Margin 40%
  assert.equal(calculateWeightedGrossMargin(100, 60), 40);
  assert.equal(calculateWeightedGrossMargin(200, 150), 25);
  assert.equal(calculateWeightedGrossMargin(0, 0), 0);
});

test('classifyBCGProducts classifies items into BCG quadrants', () => {
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Royal Canin Mini Adult 7.5kg',
      sku: 'RC-MINI-75',
      category: 'Alimentos Perro',
      formatType: 'saco',
      stock: 30,
      costPrice: 28000,
      salePrice: 42000,
      unitOfMeasure: 'unidad',
    },
    {
      id: 'p2',
      name: 'NexGard Spectra Antipulgas 10-20kg',
      sku: 'NEX-1020',
      category: 'Farmacia & Pipetas',
      formatType: 'unidad',
      stock: 45,
      costPrice: 12000,
      salePrice: 24000,
      unitOfMeasure: 'unidad',
    },
  ];

  // Create sales where p2 has high rotation (>= 25) and high margin (>= 32%)
  const sales: Sale[] = [
    {
      id: 's1',
      ticketNumber: 'T-1001',
      date: '2026-11-01T10:00:00Z',
      items: [
        {
          productId: 'p2',
          productName: 'NexGard Spectra Antipulgas 10-20kg',
          sku: 'NEX-1020',
          category: 'Farmacia & Pipetas',
          quantity: 30,
          unitPrice: 24000,
          unitCost: 12000,
          subtotal: 720000,
        },
      ],
      totalAmount: 720000,
    },
    {
      id: 's2',
      ticketNumber: 'T-1002',
      date: '2026-11-01T11:00:00Z',
      items: [
        {
          productId: 'p1',
          productName: 'Royal Canin Mini Adult 7.5kg',
          sku: 'RC-MINI-75',
          category: 'Alimentos Perro',
          quantity: 5,
          unitPrice: 42000,
          unitCost: 28000,
          subtotal: 210000,
        },
      ],
      totalAmount: 210000,
    },
  ];

  const bcg = classifyBCGProducts(products, sales);
  assert.equal(bcg.length, 2);

  const star = bcg.find((b) => b.productId === 'p2');
  assert.ok(star);
  assert.equal(star.quadrant, 'star');

  const questionMark = bcg.find((b) => b.productId === 'p1');
  assert.ok(questionMark);
  assert.equal(questionMark.quadrant, 'question_mark');
});

test('generateHourlyHeatmap aggregates sales and identifies peak hours', () => {
  const sales: Sale[] = [
    {
      id: 's1',
      ticketNumber: 'T-001',
      date: '2026-11-07T12:30:00', // Saturday noon
      items: [],
      totalAmount: 85000,
    },
    {
      id: 's2',
      ticketNumber: 'T-002',
      date: '2026-11-07T12:45:00', // Saturday noon
      items: [],
      totalAmount: 45000,
    },
  ];

  const { cells, maxSales, maxTickets } = generateHourlyHeatmap(sales);
  assert.equal(cells.length, 7 * 24); // 168 cells
  assert.equal(maxSales, 130000);
  assert.equal(maxTickets, 2);

  const saturday12 = cells.find((c) => c.dayOfWeek === 6 && c.hour === 12);
  assert.ok(saturday12);
  assert.equal(saturday12.salesAmount, 130000);
  assert.equal(saturday12.ticketCount, 2);
  assert.equal(saturday12.isPeak, true);
});

test('calculateMarketBasketRules calculates co-occurrence and association metrics', () => {
  const sales: Sale[] = [
    {
      id: 's1',
      ticketNumber: 'T-1',
      date: '2026-11-01T10:00:00',
      items: [
        { productId: 'p1', productName: 'Alimento Pro Plan', sku: 'PP-1', category: 'Alimento', quantity: 1, unitPrice: 20000, unitCost: 14000, subtotal: 20000 },
        { productId: 'p2', productName: 'Antipulgas Bravecto', sku: 'BV-1', category: 'Farmacia', quantity: 1, unitPrice: 15000, unitCost: 9000, subtotal: 15000 },
      ],
      totalAmount: 35000,
    },
    {
      id: 's2',
      ticketNumber: 'T-2',
      date: '2026-11-02T11:00:00',
      items: [
        { productId: 'p1', productName: 'Alimento Pro Plan', sku: 'PP-1', category: 'Alimento', quantity: 1, unitPrice: 20000, unitCost: 14000, subtotal: 20000 },
        { productId: 'p2', productName: 'Antipulgas Bravecto', sku: 'BV-1', category: 'Farmacia', quantity: 1, unitPrice: 15000, unitCost: 9000, subtotal: 15000 },
      ],
      totalAmount: 35000,
    },
  ];

  const rules = calculateMarketBasketRules(sales);
  assert.equal(rules.length, 1);
  assert.equal(rules[0].coOccurrenceCount, 2);
  assert.ok(rules[0].lift > 1);
});

test('calculateGranelVsSaco computes margin delta and shrinkage rate', () => {
  const sales: Sale[] = [
    {
      id: 's1',
      ticketNumber: 'T-1',
      date: '2026-11-01T10:00:00',
      items: [
        { productId: 'g1', productName: 'Dog Chow Granel Kg', sku: 'DC-GR', category: 'Alimentos Granel', formatType: 'granel', quantity: 10, unitPrice: 2500, unitCost: 1400, subtotal: 25000 },
        { productId: 's1', productName: 'Dog Chow Saco 15kg', sku: 'DC-15', category: 'Alimentos Saco', formatType: 'saco', quantity: 1, unitPrice: 32000, unitCost: 22000, subtotal: 32000 },
      ],
      totalAmount: 57000,
    },
  ];

  const kardex: KardexEntry[] = [
    {
      id: 'k1',
      date: '2026-11-01',
      productId: 'g1',
      productName: 'Dog Chow Granel Kg',
      type: 'MERMA',
      reason: 'Descalce de peso granel',
      quantity: 1.5,
      unitCost: 1400,
      totalCost: 2100,
    },
  ];

  const result = calculateGranelVsSaco(sales, [], kardex);
  assert.equal(result.granel.revenue, 25000);
  assert.equal(result.granel.grossMarginAmount, 11000); // 25000 - 14000
  assert.equal(result.granel.marginPct, 44);
  assert.equal(result.saco.revenue, 32000);
  assert.equal(result.saco.grossMarginAmount, 10000); // 32000 - 22000
  assert.equal(result.saco.marginPct, 31.3);
  assert.ok(result.marginDeltaPct > 0);
  assert.equal(result.shrinkageTotalCost, 2100);
});

test('date filtering correctly selects items strictly within boundary range', () => {
  const sampleSales = [
    { id: '1', date: '2026-10-15T10:00:00Z', totalAmount: 10000, items: [], ticketNumber: 'T-1' },
    { id: '2', date: '2026-11-01T15:00:00Z', totalAmount: 20000, items: [], ticketNumber: 'T-2' },
    { id: '3', date: '2026-11-10T12:00:00Z', totalAmount: 30000, items: [], ticketNumber: 'T-3' },
  ];

  const start = new Date(2026, 10, 1, 0, 0, 0, 0); // 2026-11-01
  const end = new Date(2026, 10, 5, 23, 59, 59, 999); // 2026-11-05

  const inRange = sampleSales.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });

  assert.equal(inRange.length, 1);
  assert.equal(inRange[0].id, '2');
});

test('calculateStockCoverage identifies critical stockouts and reorder points', () => {
  const products: Product[] = [
    { id: 'p1', name: 'Alimento Estrella', sku: 'SKU-1', category: 'Alimentos', formatType: 'granel', stock: 5, minStock: 10, costPrice: 2000, salePrice: 4000, unitOfMeasure: 'kg' },
    { id: 'p2', name: 'Alimento Sobre-stock', sku: 'SKU-2', category: 'Alimentos', formatType: 'saco', stock: 100, minStock: 10, costPrice: 15000, salePrice: 22000, unitOfMeasure: 'unidad' },
  ];

  const sales: Sale[] = [
    {
      id: 's1',
      ticketNumber: 'T-1',
      date: '2026-11-01',
      items: [
        { productId: 'p1', productName: 'Alimento Estrella', sku: 'SKU-1', category: 'Alimentos', quantity: 20, unitPrice: 4000, unitCost: 2000, subtotal: 80000 },
        { productId: 'p2', productName: 'Alimento Sobre-stock', sku: 'SKU-2', category: 'Alimentos', quantity: 2, unitPrice: 22000, unitCost: 15000, subtotal: 44000 },
      ],
      totalAmount: 124000,
    },
  ];

  const coverage = calculateStockCoverage(products, sales, 10);
  assert.equal(coverage.length, 2);

  const star = coverage.find((c) => c.productId === 'p1');
  assert.ok(star);
  assert.equal(star.dailyVelocity, 2.0); // 20 units / 10 days
  assert.equal(star.daysOfCoverage, 2.5); // 5 stock / 2.0 vel
  assert.equal(star.status, 'critical_stockout'); // <= 3.5 days

  const over = coverage.find((c) => c.productId === 'p2');
  assert.ok(over);
  assert.equal(over.status, 'overstock'); // 100 stock / 0.2 vel = 500 days
});

test('calculatePeriodComparison computes percentage variations accurately', () => {
  const currentSales: Sale[] = [
    { id: 'c1', ticketNumber: 'T-C1', date: '2026-11-01', items: [{ productId: 'p', productName: 'P', sku: 'S', category: 'C', quantity: 1, unitPrice: 120000, unitCost: 60000, subtotal: 120000 }], totalAmount: 120000 },
  ];
  const previousSales: Sale[] = [
    { id: 'p1', ticketNumber: 'T-P1', date: '2026-10-01', items: [{ productId: 'p', productName: 'P', sku: 'S', category: 'C', quantity: 1, unitPrice: 100000, unitCost: 60000, subtotal: 100000 }], totalAmount: 100000 },
  ];

  const comp = calculatePeriodComparison(currentSales, previousSales, [], []);
  assert.equal(comp.hasPreviousData, true);
  assert.equal(comp.revenueDeltaPct, 20.0); // 120k vs 100k = +20%
  assert.equal(comp.currentMarginPct, 50.0); // (120-60)/120 = 50%
  assert.equal(comp.previousMarginPct, 40.0); // (100-60)/100 = 40%
  assert.equal(comp.marginDeltaPts, 10.0); // +10 pts
});

test('calculateWhatIfSimulation projects financial impact of pricing and shrinkage reduction', () => {
  const mockKpis: any = {
    totalSales: 10000000,
    totalCogs: 6000000,
    grossMarginAmount: 4000000,
    weightedGrossMarginPct: 40,
    operatingEbitda: 2000000,
  };
  const mockGranelVsSaco: any = {
    granel: { revenue: 2000000 },
    shrinkageTotalCost: 100000,
  };

  const sim = calculateWhatIfSimulation(mockKpis, mockGranelVsSaco, {
    bulkPriceChangePct: 5, // +5% of 2M = 100k/mo -> 1.2M/yr
    shrinkageReductionPct: 50, // 50% of 100k = 50k/mo -> 600k/yr
    supplierDiscountPct: 2, // 2% of 6M = 120k/mo -> 1.44M/yr
    crossSellingAovIncreasePct: 0,
  });

  assert.equal(sim.bulkRevenueGain, 1200000);
  assert.equal(sim.shrinkageRecoveredAmount, 600000);
  assert.equal(sim.costSavingsAmount, 1440000);
  assert.equal(sim.marginIncreaseAmount, 3240000);
  assert.ok(sim.projectedAnnualGrossMargin > sim.baseAnnualGrossMargin);
});


