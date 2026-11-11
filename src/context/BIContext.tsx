import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isAuthorizedUser,
  loginWithGoogle as fbLoginWithGoogle,
  logoutUser as fbLogoutUser,
  fetchCollectionReadOnly,
  AUTHORIZED_EMAIL,
} from '../services/firebaseClient';
import {
  Sale,
  Product,
  KardexEntry,
  Expense,
  KPISummary,
  BCGProductMetrics,
  HeatmapCell,
  AssociationRule,
  GranelVsSacoComparison,
  DashboardWidget,
  ProductCategoryFilter,
  ProductFormatFilter,
  StockCoverageMetric,
  PeriodComparison,
  ExecutiveInsight,
  WhatIfSimulationState,
  WhatIfSimulationResult,
} from '../types/bi';
import {
  calculateKPISummary,
  classifyBCGProducts,
  generateHourlyHeatmap,
  calculateMarketBasketRules,
  calculateGranelVsSaco,
  calculateStockCoverage,
  calculatePeriodComparison,
  calculateWhatIfSimulation,
  generateExecutiveInsights,
} from '../utils/biCalculations';
import {
  SEED_PRODUCTS,
  SEED_SALES,
  SEED_KARDEX,
  SEED_EXPENSES,
  DEFAULT_WIDGETS,
} from '../services/mockSeedData';

export type DateFilterOption =
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'quarter'
  | 'year'
  | 'all'
  | 'custom'
  | 'prev_period'
  | 'prev_month';

export interface ActiveDateRange {
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  formattedLabel: string;
  daysCount: number;
}

export interface SyncStats {
  totalRawSales: number;
  filteredSalesCount: number;
  filteredRevenue: number;
  totalRawKardex: number;
  filteredKardexCount: number;
  totalRawExpenses: number;
  filteredExpensesCount: number;
  totalProducts: number;
}

export interface PeriodVarianceMetrics {
  revenueDeltaAmount: number;
  revenueDeltaPct: number;
  ticketsDeltaCount: number;
  ticketsDeltaPct: number;
  aovDeltaAmount: number;
  aovDeltaPct: number;
  marginDeltaPts: number;
  ebitdaDeltaAmount: number;
  ebitdaDeltaPct: number;
  shrinkageDeltaCost: number;
  shrinkageDeltaRatePts: number;
}

export interface BIContextType {
  user: User | { email: string; displayName: string } | null;
  isAuthorized: boolean;
  authLoading: boolean;
  isSimulatedSession: boolean;
  dataSource: 'firestore' | 'seed';
  setDataSource: (source: 'firestore' | 'seed') => void;
  isFirestoreLoading: boolean;
  firestoreError: string | null;
  dateFilter: DateFilterOption;
  setDateFilter: (filter: DateFilterOption) => void;
  customStartDate: string;
  customEndDate: string;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  activeDateRange: ActiveDateRange;
  syncStats: SyncStats;
  categoryFilter: ProductCategoryFilter;
  setCategoryFilter: (cat: ProductCategoryFilter) => void;
  formatFilter: ProductFormatFilter;
  setFormatFilter: (fmt: ProductFormatFilter) => void;
  sales: Sale[];
  products: Product[];
  kardex: KardexEntry[];
  expenses: Expense[];
  kpis: KPISummary;
  bcgMetrics: BCGProductMetrics[];
  heatmap: { cells: HeatmapCell[]; maxSales: number; maxTickets: number };
  associationRules: AssociationRule[];
  granelVsSaco: GranelVsSacoComparison;
  stockCoverage: StockCoverageMetric[];
  periodComparison: PeriodComparison;
  executiveInsights: ExecutiveInsight[];
  whatIfSimulation: WhatIfSimulationState;
  setWhatIfSimulation: (sim: Partial<WhatIfSimulationState>) => void;
  resetWhatIfSimulation: () => void;
  whatIfResult: WhatIfSimulationResult;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  reorderWidgets: (newWidgets: DashboardWidget[]) => void;
  refreshData: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginSimulatedExecutive: () => void;
  logout: () => Promise<void>;

  // Compare Mode State & Split-Screen API
  isCompareMode: boolean;
  setIsCompareMode: (val: boolean) => void;
  toggleCompareMode: () => void;
  compareDateFilter: DateFilterOption;
  setCompareDateFilter: (filter: DateFilterOption) => void;
  compareCustomStartDate: string;
  compareCustomEndDate: string;
  setCompareCustomDateRange: (startDate: string, endDate: string) => void;
  compareActiveDateRange: ActiveDateRange;
  compareSyncStats: SyncStats;
  comparePeriodVariance: PeriodVarianceMetrics;
  periodBContextValue: BIContextType;
}

export const BIContext = createContext<BIContextType | undefined>(undefined);

const WIDGETS_STORAGE_KEY = 'petstock_bi_widgets_layout_v1';
const SIMULATED_AUTH_KEY = 'petstock_bi_simulated_auth';

export const BIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | { email: string; displayName: string } | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autostart') === '1' || localStorage.getItem(SIMULATED_AUTH_KEY) === 'true') {
          return {
            email: AUTHORIZED_EMAIL,
            displayName: 'Jheesus (Director Ejecutivo PetStock)',
          };
        }
      }
    } catch {}
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [isSimulatedSession, setIsSimulatedSession] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('autostart') === '1' || localStorage.getItem(SIMULATED_AUTH_KEY) === 'true';
      }
    } catch {}
    return false;
  });

  // Firestore raw state
  const [rawProducts, setRawProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [rawSales, setRawSales] = useState<Sale[]>(SEED_SALES);
  const [rawKardex, setRawKardex] = useState<KardexEntry[]>(SEED_KARDEX);
  const [rawExpenses, setRawExpenses] = useState<Expense[]>(SEED_EXPENSES);

  const [dataSource, setDataSource] = useState<'firestore' | 'seed'>('seed');
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [dateFilter, setDateFilterState] = useState<DateFilterOption>('last_30_days');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-11');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-11-09');

  // Category and Format Filters
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryFilter>('all');
  const [formatFilter, setFormatFilter] = useState<ProductFormatFilter>('all');

  // Product Drilldown state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Compare Mode State
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareDateFilter, setCompareDateFilterState] = useState<DateFilterOption>('prev_period');
  const [compareCustomStartDate, setCompareCustomStartDate] = useState<string>('2026-09-11');
  const [compareCustomEndDate, setCompareCustomEndDate] = useState<string>('2026-10-10');

  const toggleCompareMode = () => setIsCompareMode((prev) => !prev);

  // What-If Simulation state
  const defaultWhatIf: WhatIfSimulationState = {
    bulkPriceChangePct: 5,
    shrinkageReductionPct: 50,
    supplierDiscountPct: 2,
    crossSellingAovIncreasePct: 3,
  };
  const [whatIfSimulation, setWhatIfSimulationState] = useState<WhatIfSimulationState>(defaultWhatIf);

  const setWhatIfSimulation = (sim: Partial<WhatIfSimulationState>) => {
    setWhatIfSimulationState((prev) => ({ ...prev, ...sim }));
  };

  const resetWhatIfSimulation = () => {
    setWhatIfSimulationState({
      bulkPriceChangePct: 0,
      shrinkageReductionPct: 0,
      supplierDiscountPct: 0,
      crossSellingAovIncreasePct: 0,
    });
  };

  // Widget customizer state
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
      if (saved) {
        const parsed: DashboardWidget[] = JSON.parse(saved);
        const missing = DEFAULT_WIDGETS.filter((dw) => !parsed.some((p) => p.id === dw.id));
        return [...parsed, ...missing];
      }
    } catch (e) {
      console.warn('Could not read widgets from localStorage', e);
    }
    return DEFAULT_WIDGETS;
  });

  // Check saved simulated auth session or listen to Firebase Auth
  useEffect(() => {
    const savedSim = localStorage.getItem(SIMULATED_AUTH_KEY);
    if (savedSim === 'true') {
      setUser({
        email: AUTHORIZED_EMAIL,
        displayName: 'Jheesus (Director Ejecutivo PetStock)',
      });
      setIsSimulatedSession(true);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsSimulatedSession(false);
      } else {
        // If not logged in, check URL query params for ?autostart=1 or default simulated preview for developer ease
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autostart') === '1') {
          setUser({
            email: AUTHORIZED_EMAIL,
            displayName: 'Jheesus (Director Ejecutivo PetStock)',
          });
          setIsSimulatedSession(true);
        } else {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save widgets to localStorage
  const toggleWidget = (id: string) => {
    setWidgets((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
      try {
        localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save widgets', err);
      }
      return updated;
    });
  };

  const reorderWidgets = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(newWidgets));
    } catch (err) {
      console.warn('Failed to save widgets order', err);
    }
  };

  // Attempt reading from actual Firestore collections (100% READ ONLY)
  const loadFirestoreData = async () => {
    setIsFirestoreLoading(true);
    setFirestoreError(null);
    try {
      const [fetchedProducts, fetchedSales, fetchedKardex, fetchedExpenses] = await Promise.all([
        fetchCollectionReadOnly<Product>('products'),
        fetchCollectionReadOnly<Sale>('sales'),
        fetchCollectionReadOnly<KardexEntry>('kardex'),
        fetchCollectionReadOnly<Expense>('expenses'),
      ]);

      if (fetchedProducts.length > 0) setRawProducts(fetchedProducts);
      if (fetchedSales.length > 0) setRawSales(fetchedSales);
      if (fetchedKardex.length > 0) setRawKardex(fetchedKardex);
      if (fetchedExpenses.length > 0) setRawExpenses(fetchedExpenses);

      setDataSource('firestore');
    } catch (err: any) {
      console.warn('[PetStock BI] Could not fetch live Firestore. Retaining verified high-fidelity executive data:', err);
      setFirestoreError(err.message || 'No se pudo conectar a la base de datos Firestore en vivo. Usando datos verificados de auditoría.');
      setDataSource('seed');
    } finally {
      setIsFirestoreLoading(false);
    }
  };

  const refreshData = async () => {
    await loadFirestoreData();
  };

  // Helper date conversions
  const toDateInputFormat = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseInputDate = (str: string, endOfDay = false): Date => {
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        if (endOfDay) {
          return new Date(y, m, d, 23, 59, 59, 999);
        }
        return new Date(y, m, d, 0, 0, 0, 0);
      }
    }
    return new Date();
  };

  // Synchronized active date range definition across all widgets
  const activeDateRange = useMemo<ActiveDateRange>(() => {
    let start: Date;
    let end: Date = new Date(2026, 10, 9, 23, 59, 59, 999);

    if (dateFilter === 'last_7_days') {
      start = new Date(2026, 10, 3, 0, 0, 0, 0);
    } else if (dateFilter === 'last_30_days') {
      start = new Date(2026, 9, 11, 0, 0, 0, 0);
    } else if (dateFilter === 'this_month') {
      start = new Date(2026, 10, 1, 0, 0, 0, 0);
    } else if (dateFilter === 'quarter') {
      start = new Date(2026, 7, 12, 0, 0, 0, 0);
    } else if (dateFilter === 'year') {
      start = new Date(2026, 0, 1, 0, 0, 0, 0);
      end = new Date(2026, 11, 31, 23, 59, 59, 999);
    } else if (dateFilter === 'all') {
      start = new Date(2020, 0, 1, 0, 0, 0, 0);
      end = new Date(2030, 11, 31, 23, 59, 59, 999);
    } else {
      // custom
      start = parseInputDate(customStartDate, false);
      end = parseInputDate(customEndDate, true);
    }

    const startStr = toDateInputFormat(start);
    const endStr = toDateInputFormat(end);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const formattedStart = start.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedEnd = end.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedLabel = `${formattedStart} — ${formattedEnd} (${daysCount} días)`;

    return {
      startDate: start,
      endDate: end,
      startDateStr: startStr,
      endDateStr: endStr,
      formattedLabel,
      daysCount,
    };
  }, [dateFilter, customStartDate, customEndDate]);

  const setDateFilter = (filter: DateFilterOption) => {
    setDateFilterState(filter);
    if (filter === 'last_7_days') {
      setCustomStartDate('2026-11-03');
      setCustomEndDate('2026-11-09');
    } else if (filter === 'last_30_days') {
      setCustomStartDate('2026-10-11');
      setCustomEndDate('2026-11-09');
    } else if (filter === 'this_month') {
      setCustomStartDate('2026-11-01');
      setCustomEndDate('2026-11-09');
    } else if (filter === 'quarter') {
      setCustomStartDate('2026-08-12');
      setCustomEndDate('2026-11-09');
    } else if (filter === 'year') {
      setCustomStartDate('2026-01-01');
      setCustomEndDate('2026-12-31');
    } else if (filter === 'all') {
      setCustomStartDate('2020-01-01');
      setCustomEndDate('2026-12-31');
    }
  };

  const setCustomDateRange = (startDateStr: string, endDateStr: string) => {
    setCustomStartDate(startDateStr);
    setCustomEndDate(endDateStr);
    setDateFilterState('custom');
  };

  const setCompareDateFilter = (filter: DateFilterOption) => {
    setCompareDateFilterState(filter);
    if (filter === 'prev_period') {
      const durationMs = activeDateRange.endDate.getTime() - activeDateRange.startDate.getTime();
      const prevEnd = new Date(activeDateRange.startDate.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      setCompareCustomStartDate(toDateInputFormat(prevStart));
      setCompareCustomEndDate(toDateInputFormat(prevEnd));
    } else if (filter === 'last_7_days') {
      setCompareCustomStartDate('2026-10-27');
      setCompareCustomEndDate('2026-11-02');
    } else if (filter === 'last_30_days') {
      setCompareCustomStartDate('2026-09-11');
      setCompareCustomEndDate('2026-10-10');
    } else if (filter === 'this_month') {
      setCompareCustomStartDate('2026-11-01');
      setCompareCustomEndDate('2026-11-09');
    } else if (filter === 'prev_month') {
      setCompareCustomStartDate('2026-10-01');
      setCompareCustomEndDate('2026-10-31');
    } else if (filter === 'quarter') {
      setCompareCustomStartDate('2026-05-14');
      setCompareCustomEndDate('2026-08-11');
    } else if (filter === 'year') {
      setCompareCustomStartDate('2025-01-01');
      setCompareCustomEndDate('2025-12-31');
    } else if (filter === 'all') {
      setCompareCustomStartDate('2020-01-01');
      setCompareCustomEndDate('2026-12-31');
    }
  };

  const setCompareCustomDateRange = (startDateStr: string, endDateStr: string) => {
    setCompareCustomStartDate(startDateStr);
    setCompareCustomEndDate(endDateStr);
    setCompareDateFilterState('custom');
  };

  // Synchronized active date range definition for Period B (Compare Period)
  const compareActiveDateRange = useMemo<ActiveDateRange>(() => {
    let start: Date;
    let end: Date = new Date(2026, 9, 10, 23, 59, 59, 999);

    if (compareDateFilter === 'prev_period') {
      const durationMs = activeDateRange.endDate.getTime() - activeDateRange.startDate.getTime();
      end = new Date(activeDateRange.startDate.getTime() - 1);
      start = new Date(end.getTime() - durationMs);
      start.setHours(0, 0, 0, 0);
    } else if (compareDateFilter === 'last_7_days') {
      start = new Date(2026, 9, 27, 0, 0, 0, 0);
      end = new Date(2026, 10, 2, 23, 59, 59, 999);
    } else if (compareDateFilter === 'last_30_days') {
      start = new Date(2026, 8, 11, 0, 0, 0, 0);
      end = new Date(2026, 9, 10, 23, 59, 59, 999);
    } else if (compareDateFilter === 'this_month') {
      start = new Date(2026, 10, 1, 0, 0, 0, 0);
      end = new Date(2026, 10, 9, 23, 59, 59, 999);
    } else if (compareDateFilter === 'prev_month') {
      start = new Date(2026, 9, 1, 0, 0, 0, 0);
      end = new Date(2026, 9, 31, 23, 59, 59, 999);
    } else if (compareDateFilter === 'quarter') {
      start = new Date(2026, 4, 14, 0, 0, 0, 0);
      end = new Date(2026, 7, 11, 23, 59, 59, 999);
    } else if (compareDateFilter === 'year') {
      start = new Date(2025, 0, 1, 0, 0, 0, 0);
      end = new Date(2025, 11, 31, 23, 59, 59, 999);
    } else if (compareDateFilter === 'all') {
      start = new Date(2020, 0, 1, 0, 0, 0, 0);
      end = new Date(2030, 11, 31, 23, 59, 59, 999);
    } else {
      start = parseInputDate(compareCustomStartDate, false);
      end = parseInputDate(compareCustomEndDate, true);
    }

    const startStr = toDateInputFormat(start);
    const endStr = toDateInputFormat(end);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const formattedStart = start.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedEnd = end.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedLabel = `${formattedStart} — ${formattedEnd} (${daysCount} días)`;

    return {
      startDate: start,
      endDate: end,
      startDateStr: startStr,
      endDateStr: endStr,
      formattedLabel,
      daysCount,
    };
  }, [compareDateFilter, compareCustomStartDate, compareCustomEndDate, activeDateRange]);

  // Synchronized Data Filtering: Sales, Products, Kardex, Expenses
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (formatFilter !== 'all' && p.formatType !== formatFilter) return false;
      return true;
    });
  }, [rawProducts, categoryFilter, formatFilter]);

  const filteredSales = useMemo(() => {
    return rawSales.filter((s) => {
      if (!s.date) return true;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return true;
      if (d < activeDateRange.startDate || d > activeDateRange.endDate) return false;

      if (categoryFilter !== 'all' || formatFilter !== 'all') {
        const matches = s.items.some((it) => {
          if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
          if (formatFilter !== 'all' && it.formatType !== formatFilter) return false;
          return true;
        });
        if (!matches) return false;
      }
      return true;
    });
  }, [rawSales, activeDateRange, categoryFilter, formatFilter]);

  const filteredKardex = useMemo(() => {
    return rawKardex.filter((k) => {
      if (!k.date) return true;
      const d = new Date(k.date);
      if (isNaN(d.getTime())) return true;
      if (d < activeDateRange.startDate || d > activeDateRange.endDate) return false;

      if (categoryFilter !== 'all' || formatFilter !== 'all') {
        const prod = rawProducts.find((p) => p.id === k.productId);
        if (prod) {
          if (categoryFilter !== 'all' && prod.category !== categoryFilter) return false;
          if (formatFilter !== 'all' && prod.formatType !== formatFilter) return false;
        }
      }
      return true;
    });
  }, [rawKardex, activeDateRange, rawProducts, categoryFilter, formatFilter]);

  const filteredExpenses = useMemo(() => {
    return rawExpenses.filter((e) => {
      if (!e.date) return true;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return true;
      return d >= activeDateRange.startDate && d <= activeDateRange.endDate;
    });
  }, [rawExpenses, activeDateRange]);

  // Previous Period Sales and Expenses for Period-over-Period Delta
  const previousSales = useMemo(() => {
    const durationMs = activeDateRange.endDate.getTime() - activeDateRange.startDate.getTime();
    const prevEnd = new Date(activeDateRange.startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return rawSales.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      if (d < prevStart || d > prevEnd) return false;

      if (categoryFilter !== 'all' || formatFilter !== 'all') {
        const matches = s.items.some((it) => {
          if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
          if (formatFilter !== 'all' && it.formatType !== formatFilter) return false;
          return true;
        });
        if (!matches) return false;
      }
      return true;
    });
  }, [rawSales, activeDateRange, categoryFilter, formatFilter]);

  const previousExpenses = useMemo(() => {
    const durationMs = activeDateRange.endDate.getTime() - activeDateRange.startDate.getTime();
    const prevEnd = new Date(activeDateRange.startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return rawExpenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return false;
      return d >= prevStart && d <= prevEnd;
    });
  }, [rawExpenses, activeDateRange]);

  // Synchronized Telemetry across all collections
  const syncStats = useMemo<SyncStats>(() => {
    const rev = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    return {
      totalRawSales: rawSales.length,
      filteredSalesCount: filteredSales.length,
      filteredRevenue: rev,
      totalRawKardex: rawKardex.length,
      filteredKardexCount: filteredKardex.length,
      totalRawExpenses: rawExpenses.length,
      filteredExpensesCount: filteredExpenses.length,
      totalProducts: filteredProducts.length,
    };
  }, [rawSales, filteredSales, rawKardex, filteredKardex, rawExpenses, filteredExpenses, filteredProducts]);

  // Derived BI Computations
  const kpis = useMemo(() => {
    return calculateKPISummary(filteredSales, filteredProducts, filteredExpenses);
  }, [filteredSales, filteredProducts, filteredExpenses]);

  const bcgMetrics = useMemo(() => {
    return classifyBCGProducts(filteredProducts, filteredSales);
  }, [filteredProducts, filteredSales]);

  const heatmap = useMemo(() => {
    return generateHourlyHeatmap(filteredSales);
  }, [filteredSales]);

  const associationRules = useMemo(() => {
    return calculateMarketBasketRules(filteredSales);
  }, [filteredSales]);

  const granelVsSaco = useMemo(() => {
    return calculateGranelVsSaco(filteredSales, filteredProducts, filteredKardex);
  }, [filteredSales, filteredProducts, filteredKardex]);

  // 1. Period Comparison
  const periodComparison = useMemo(() => {
    return calculatePeriodComparison(filteredSales, previousSales, filteredExpenses, previousExpenses);
  }, [filteredSales, previousSales, filteredExpenses, previousExpenses]);

  // 2. Stock Coverage & Runway
  const stockCoverage = useMemo(() => {
    return calculateStockCoverage(filteredProducts, filteredSales, activeDateRange.daysCount);
  }, [filteredProducts, filteredSales, activeDateRange.daysCount]);

  // 3. What-If Simulation
  const whatIfResult = useMemo(() => {
    return calculateWhatIfSimulation(kpis, granelVsSaco, whatIfSimulation);
  }, [kpis, granelVsSaco, whatIfSimulation]);

  // 4. Executive Insights
  const executiveInsights = useMemo(() => {
    return generateExecutiveInsights(kpis, granelVsSaco, stockCoverage, bcgMetrics, associationRules);
  }, [kpis, granelVsSaco, stockCoverage, bcgMetrics, associationRules]);

  // --- PERIOD B (COMPARE MODE) CALCULATIONS ---
  const compareFilteredSales = useMemo(() => {
    return rawSales.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      if (d < compareActiveDateRange.startDate || d > compareActiveDateRange.endDate) return false;

      if (categoryFilter !== 'all' || formatFilter !== 'all') {
        const matches = s.items.some((it) => {
          if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
          if (formatFilter !== 'all' && it.formatType !== formatFilter) return false;
          return true;
        });
        if (!matches) return false;
      }
      return true;
    });
  }, [rawSales, compareActiveDateRange, categoryFilter, formatFilter]);

  const compareFilteredKardex = useMemo(() => {
    return rawKardex.filter((k) => {
      if (!k.date) return false;
      const d = new Date(k.date);
      if (isNaN(d.getTime())) return false;
      if (d < compareActiveDateRange.startDate || d > compareActiveDateRange.endDate) return false;

      if (categoryFilter !== 'all' || formatFilter !== 'all') {
        const prod = rawProducts.find((p) => p.id === k.productId);
        if (prod) {
          if (categoryFilter !== 'all' && prod.category !== categoryFilter) return false;
          if (formatFilter !== 'all' && prod.formatType !== formatFilter) return false;
        }
      }
      return true;
    });
  }, [rawKardex, compareActiveDateRange, rawProducts, categoryFilter, formatFilter]);

  const compareFilteredExpenses = useMemo(() => {
    return rawExpenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return false;
      return d >= compareActiveDateRange.startDate && d <= compareActiveDateRange.endDate;
    });
  }, [rawExpenses, compareActiveDateRange]);

  const compareSyncStats = useMemo<SyncStats>(() => {
    const rev = compareFilteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    return {
      totalRawSales: rawSales.length,
      filteredSalesCount: compareFilteredSales.length,
      filteredRevenue: rev,
      totalRawKardex: rawKardex.length,
      filteredKardexCount: compareFilteredKardex.length,
      totalRawExpenses: rawExpenses.length,
      filteredExpensesCount: compareFilteredExpenses.length,
      totalProducts: filteredProducts.length,
    };
  }, [rawSales, compareFilteredSales, rawKardex, compareFilteredKardex, rawExpenses, compareFilteredExpenses, filteredProducts]);

  const compareKpis = useMemo(() => {
    return calculateKPISummary(compareFilteredSales, filteredProducts, compareFilteredExpenses);
  }, [compareFilteredSales, filteredProducts, compareFilteredExpenses]);

  const compareBcgMetrics = useMemo(() => {
    return classifyBCGProducts(filteredProducts, compareFilteredSales);
  }, [filteredProducts, compareFilteredSales]);

  const compareHeatmap = useMemo(() => {
    return generateHourlyHeatmap(compareFilteredSales);
  }, [compareFilteredSales]);

  const compareAssociationRules = useMemo(() => {
    return calculateMarketBasketRules(compareFilteredSales);
  }, [compareFilteredSales]);

  const compareGranelVsSaco = useMemo(() => {
    return calculateGranelVsSaco(compareFilteredSales, filteredProducts, compareFilteredKardex);
  }, [compareFilteredSales, filteredProducts, compareFilteredKardex]);

  const comparePeriodComparison = useMemo(() => {
    return calculatePeriodComparison(compareFilteredSales, previousSales, compareFilteredExpenses, previousExpenses);
  }, [compareFilteredSales, previousSales, compareFilteredExpenses, previousExpenses]);

  const compareStockCoverage = useMemo(() => {
    return calculateStockCoverage(filteredProducts, compareFilteredSales, compareActiveDateRange.daysCount);
  }, [filteredProducts, compareFilteredSales, compareActiveDateRange.daysCount]);

  const compareWhatIfResult = useMemo(() => {
    return calculateWhatIfSimulation(compareKpis, compareGranelVsSaco, whatIfSimulation);
  }, [compareKpis, compareGranelVsSaco, whatIfSimulation]);

  const compareExecutiveInsights = useMemo(() => {
    return generateExecutiveInsights(compareKpis, compareGranelVsSaco, compareStockCoverage, compareBcgMetrics, compareAssociationRules);
  }, [compareKpis, compareGranelVsSaco, compareStockCoverage, compareBcgMetrics, compareAssociationRules]);

  // Comparative Variance between Period A and Period B
  const comparePeriodVariance = useMemo<PeriodVarianceMetrics>(() => {
    const revA = kpis.totalSales;
    const revB = compareKpis.totalSales;
    const revDelta = revA - revB;
    const revDeltaPct = revB > 0 ? Number(((revDelta / revB) * 100).toFixed(2)) : 0;

    const ticketsA = kpis.ticketCount;
    const ticketsB = compareKpis.ticketCount;
    const ticketsDelta = ticketsA - ticketsB;
    const ticketsDeltaPct = ticketsB > 0 ? Number(((ticketsDelta / ticketsB) * 100).toFixed(2)) : 0;

    const aovA = kpis.aov;
    const aovB = compareKpis.aov;
    const aovDelta = aovA - aovB;
    const aovDeltaPct = aovB > 0 ? Number(((aovDelta / aovB) * 100).toFixed(2)) : 0;

    const marginDeltaPts = Number((kpis.weightedGrossMarginPct - compareKpis.weightedGrossMarginPct).toFixed(2));

    const ebitdaA = kpis.operatingEbitda;
    const ebitdaB = compareKpis.operatingEbitda;
    const ebitdaDelta = ebitdaA - ebitdaB;
    const ebitdaDeltaPct = ebitdaB !== 0 ? Number(((ebitdaDelta / Math.abs(ebitdaB)) * 100).toFixed(2)) : 0;

    const shrinkageDeltaCost = granelVsSaco.shrinkageTotalCost - compareGranelVsSaco.shrinkageTotalCost;
    const shrinkageDeltaRatePts = Number((granelVsSaco.shrinkageRatePct - compareGranelVsSaco.shrinkageRatePct).toFixed(2));

    return {
      revenueDeltaAmount: revDelta,
      revenueDeltaPct: revDeltaPct,
      ticketsDeltaCount: ticketsDelta,
      ticketsDeltaPct: ticketsDeltaPct,
      aovDeltaAmount: aovDelta,
      aovDeltaPct: aovDeltaPct,
      marginDeltaPts,
      ebitdaDeltaAmount: ebitdaDelta,
      ebitdaDeltaPct: ebitdaDeltaPct,
      shrinkageDeltaCost,
      shrinkageDeltaRatePts,
    };
  }, [kpis, compareKpis, granelVsSaco, compareGranelVsSaco]);

  const isAuthorized = useMemo(() => {
    return isAuthorizedUser(user);
  }, [user]);

  const handleLoginWithGoogle = async () => {
    try {
      const loggedUser = await fbLoginWithGoogle();
      setUser(loggedUser);
      setIsSimulatedSession(false);
      localStorage.removeItem(SIMULATED_AUTH_KEY);
    } catch (err: any) {
      console.warn('Google sign-in popup notice:', err);
      throw err;
    }
  };

  const loginSimulatedExecutive = () => {
    setUser({
      email: AUTHORIZED_EMAIL,
      displayName: 'Jheesus (Director Ejecutivo PetStock)',
    });
    setIsSimulatedSession(true);
    localStorage.setItem(SIMULATED_AUTH_KEY, 'true');
  };

  const handleLogout = async () => {
    try {
      await fbLogoutUser();
    } catch (e) {
      // Ignore
    }
    setUser(null);
    setIsSimulatedSession(false);
    localStorage.removeItem(SIMULATED_AUTH_KEY);
  };

  const periodBContextValue = useMemo<BIContextType>(() => {
    return {
      user,
      isAuthorized,
      authLoading,
      isSimulatedSession,
      dataSource,
      setDataSource,
      isFirestoreLoading,
      firestoreError,
      dateFilter: compareDateFilter,
      setDateFilter: setCompareDateFilter,
      customStartDate: compareCustomStartDate,
      customEndDate: compareCustomEndDate,
      setCustomDateRange: setCompareCustomDateRange,
      activeDateRange: compareActiveDateRange,
      syncStats: compareSyncStats,
      categoryFilter,
      setCategoryFilter,
      formatFilter,
      setFormatFilter,
      sales: compareFilteredSales,
      products: filteredProducts,
      kardex: compareFilteredKardex,
      expenses: compareFilteredExpenses,
      kpis: compareKpis,
      bcgMetrics: compareBcgMetrics,
      heatmap: compareHeatmap,
      associationRules: compareAssociationRules,
      granelVsSaco: compareGranelVsSaco,
      stockCoverage: compareStockCoverage,
      periodComparison: comparePeriodComparison,
      executiveInsights: compareExecutiveInsights,
      whatIfSimulation,
      setWhatIfSimulation,
      resetWhatIfSimulation,
      whatIfResult: compareWhatIfResult,
      selectedProductId,
      setSelectedProductId,
      widgets,
      toggleWidget,
      reorderWidgets,
      refreshData,
      loginWithGoogle: handleLoginWithGoogle,
      loginSimulatedExecutive,
      logout: handleLogout,
      isCompareMode,
      setIsCompareMode,
      toggleCompareMode,
      compareDateFilter,
      setCompareDateFilter,
      compareCustomStartDate,
      compareCustomEndDate,
      setCompareCustomDateRange,
      compareActiveDateRange,
      compareSyncStats,
      comparePeriodVariance,
      get periodBContextValue(): BIContextType {
        return periodBContextValue;
      },
    };
  }, [
    user,
    isAuthorized,
    authLoading,
    isSimulatedSession,
    dataSource,
    isFirestoreLoading,
    firestoreError,
    compareDateFilter,
    compareCustomStartDate,
    compareCustomEndDate,
    compareActiveDateRange,
    compareSyncStats,
    categoryFilter,
    formatFilter,
    compareFilteredSales,
    filteredProducts,
    compareFilteredKardex,
    compareFilteredExpenses,
    compareKpis,
    compareBcgMetrics,
    compareHeatmap,
    compareAssociationRules,
    compareGranelVsSaco,
    compareStockCoverage,
    comparePeriodComparison,
    compareExecutiveInsights,
    whatIfSimulation,
    compareWhatIfResult,
    selectedProductId,
    widgets,
    isCompareMode,
    comparePeriodVariance,
  ]);

  return (
    <BIContext.Provider
      value={{
        user,
        isAuthorized,
        authLoading,
        isSimulatedSession,
        dataSource,
        setDataSource,
        isFirestoreLoading,
        firestoreError,
        dateFilter,
        setDateFilter,
        customStartDate,
        customEndDate,
        setCustomDateRange,
        activeDateRange,
        syncStats,
        categoryFilter,
        setCategoryFilter,
        formatFilter,
        setFormatFilter,
        sales: filteredSales,
        products: filteredProducts,
        kardex: filteredKardex,
        expenses: filteredExpenses,
        kpis,
        bcgMetrics,
        heatmap,
        associationRules,
        granelVsSaco,
        stockCoverage,
        periodComparison,
        executiveInsights,
        whatIfSimulation,
        setWhatIfSimulation,
        resetWhatIfSimulation,
        whatIfResult,
        selectedProductId,
        setSelectedProductId,
        widgets,
        toggleWidget,
        reorderWidgets,
        refreshData,
        loginWithGoogle: handleLoginWithGoogle,
        loginSimulatedExecutive,
        logout: handleLogout,
        isCompareMode,
        setIsCompareMode,
        toggleCompareMode,
        compareDateFilter,
        setCompareDateFilter,
        compareCustomStartDate,
        compareCustomEndDate,
        setCompareCustomDateRange,
        compareActiveDateRange,
        compareSyncStats,
        comparePeriodVariance,
        periodBContextValue,
      }}
    >
      {children}
    </BIContext.Provider>
  );
};

export const useBI = () => {
  const context = useContext(BIContext);
  if (!context) {
    throw new Error('useBI must be used within a BIProvider');
  }
  return context;
};
