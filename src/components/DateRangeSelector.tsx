import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Database,
  TrendingUp,
  Package,
  Layers,
  Receipt,
  RotateCcw,
  Columns2,
  ArrowRightLeft,
  Scale,
} from 'lucide-react';
import { useBI, DateFilterOption } from '../context/BIContext';

export const DateRangeSelector: React.FC = () => {
  const {
    dateFilter,
    setDateFilter,
    customStartDate,
    customEndDate,
    setCustomDateRange,
    activeDateRange,
    syncStats,
    isFirestoreLoading,
    refreshData,
    dataSource,
    categoryFilter,
    setCategoryFilter,
    formatFilter,
    setFormatFilter,
    isCompareMode,
    toggleCompareMode,
    compareDateFilter,
    setCompareDateFilter,
    compareCustomStartDate,
    compareCustomEndDate,
    setCompareCustomDateRange,
    compareActiveDateRange,
    comparePeriodVariance,
  } = useBI();

  const [isCustomExpanded, setIsCustomExpanded] = useState<boolean>(dateFilter === 'custom');
  const [localStart, setLocalStart] = useState<string>(customStartDate);
  const [localEnd, setLocalEnd] = useState<string>(customEndDate);
  const [localCompareStart, setLocalCompareStart] = useState<string>(compareCustomStartDate);
  const [localCompareEnd, setLocalCompareEnd] = useState<string>(compareCustomEndDate);
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync local inputs when compare custom dates change
  React.useEffect(() => {
    setLocalCompareStart(compareCustomStartDate);
    setLocalCompareEnd(compareCustomEndDate);
  }, [compareCustomStartDate, compareCustomEndDate]);

  // Sync local inputs when custom dates change externally
  React.useEffect(() => {
    setLocalStart(customStartDate);
    setLocalEnd(customEndDate);
  }, [customStartDate, customEndDate]);

  React.useEffect(() => {
    if (dateFilter === 'custom') {
      setIsCustomExpanded(true);
    }
  }, [dateFilter]);

  const presetOptions: { key: DateFilterOption; label: string; badge?: string }[] = [
    { key: 'last_7_days', label: 'Últimos 7 Días' },
    { key: 'last_30_days', label: 'Últimos 30 Días', badge: 'Estándar' },
    { key: 'this_month', label: 'Este Mes (Nov 2026)' },
    { key: 'quarter', label: 'Último Trimestre' },
    { key: 'year', label: 'Año 2026' },
    { key: 'all', label: 'Histórico Total' },
  ];

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!localStart || !localEnd) {
      setDateError('Debes seleccionar tanto la fecha de inicio como la fecha de fin.');
      return;
    }

    if (localStart > localEnd) {
      setDateError('La fecha de inicio no puede ser posterior a la fecha final.');
      return;
    }

    setDateError(null);
    setCustomDateRange(localStart, localEnd);
  };

  const handleShortcut = (start: string, end: string) => {
    setLocalStart(start);
    setLocalEnd(end);
    setDateError(null);
    setCustomDateRange(start, end);
  };

  return (
    <section
      aria-label="Selector de Rango de Fechas y Sincronización Global"
      className="no-print bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
    >
      {/* Top Banner: Range Overview & Telemetry */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-linear-to-b from-slate-50/70 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and Active Range Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
                <Calendar className="w-4 h-4 stroke-[2.2]" />
              </span>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                Rango Temporal de Análisis
              </h2>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                {activeDateRange.formattedLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sincronización simultánea de métricas en tiempo real para todos los módulos directivos (Cockpit, BCG, Heatmap, Market Basket y Granel).
            </p>
          </div>

          {/* Sincronización y Acciones Rápidas */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Compare Split-Screen Toggle */}
            <button
              type="button"
              onClick={toggleCompareMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                isCompareMode
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-500/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Activar vista comparativa dividida lado a lado de dos periodos"
            >
              <Columns2 className={`w-3.5 h-3.5 ${isCompareMode ? 'text-white' : 'text-blue-600'}`} />
              <span>Comparar</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isCompareMode ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {isCompareMode ? 'Activo' : 'Split'}
              </span>
            </button>

            <button
              type="button"
              onClick={refreshData}
              disabled={isFirestoreLoading}
              title="Sincronizar todas las colecciones de Firestore"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isFirestoreLoading ? 'animate-spin' : ''}`} />
              <span>{isFirestoreLoading ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomExpanded(!isCustomExpanded)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                dateFilter === 'custom' || isCustomExpanded
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs font-semibold'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fechas Personalizadas</span>
            </button>
          </div>
        </div>

        {/* Comparison Dual Period Bar (Rendered when compare mode is active) */}
        {isCompareMode ? (
          <div className="mt-4 pt-4 border-t border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configuración de Comparativa Dual
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Período A (Base) vs Período B (Comparativo)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              {/* Selector Periodo A */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Período A (Base):
                  </span>
                  <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {activeDateRange.formattedLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {presetOptions.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDateFilter(key)}
                      className={`px-2 py-1 text-[11px] rounded transition-all ${
                        dateFilter === key
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomExpanded(true);
                      if (dateFilter !== 'custom') setCustomDateRange(localStart, localEnd);
                    }}
                    className={`px-2 py-1 text-[11px] rounded transition-all ${
                      dateFilter === 'custom'
                        ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Exactas...
                  </button>
                </div>
              </div>

              {/* Selector Periodo B */}
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Período B (Comparativo):
                  </span>
                  <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                    {compareActiveDateRange.formattedLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: 'prev_period' as const, label: 'Lapso Anterior Equivalente', highlight: true },
                    { key: 'prev_month' as const, label: 'Mes Anterior' },
                    { key: 'last_30_days' as const, label: 'Últimos 30d' },
                    { key: 'quarter' as const, label: 'Trimestre' },
                    { key: 'year' as const, label: 'Año 2026' },
                  ].map(({ key, label, highlight }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCompareDateFilter(key)}
                      className={`px-2 py-1 text-[11px] rounded transition-all ${
                        compareDateFilter === key
                          ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {label}
                      {highlight && (
                        <span className="ml-1 text-[9px] opacity-80">(Auto)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Segmented Preset Buttons when NOT in compare mode */
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {presetOptions.map(({ key, label, badge }) => {
              const isSelected = dateFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setDateFilter(key);
                    setDateError(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-600'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <span>{label}</span>
                  {badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsCustomExpanded(true);
                if (dateFilter !== 'custom') {
                  setCustomDateRange(localStart, localEnd);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold ring-1 ring-blue-600'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>Fechas Exactas...</span>
            </button>
          </div>
        )}

        {/* Secondary Multidimensional Filters: Categoría & Formato */}
        <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Categoría Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Categoría:</span>
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {(
                [
                  { key: 'all' as const, label: 'Todas' },
                  { key: 'Alimentos Perro' as const, label: 'Alimentos Perro' },
                  { key: 'Alimentos Gato' as const, label: 'Alimentos Gato' },
                  { key: 'Farmacia & Pipetas' as const, label: 'Farmacia & Pipetas' },
                  { key: 'Higiene & Arenas' as const, label: 'Higiene & Arenas' },
                  { key: 'Accesorios & Juguetes' as const, label: 'Accesorios & Juguetes' },
                ]
              ).map((cat) => {
                const isActive = categoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formato Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Formato:</span>
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { key: 'all' as const, label: 'Todos' },
                  { key: 'granel' as const, label: 'Granel (Kg)' },
                  { key: 'saco' as const, label: 'Saco Cerrado' },
                  { key: 'unidad' as const, label: 'Unidad' },
                ]
              ).map((fmt) => {
                const isActive = formatFilter === fmt.key;
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => setFormatFilter(fmt.key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}

              {(categoryFilter !== 'all' || formatFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setFormatFilter('all');
                  }}
                  className="ml-2 text-[10px] text-rose-600 hover:text-rose-800 underline font-mono"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Custom Date Pickers */}
      {isCustomExpanded && (
        <form
          onSubmit={handleApplyCustom}
          className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs animate-in fade-in duration-150"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="custom-start-date" className="font-medium text-slate-700 shrink-0">
                Desde:
              </label>
              <input
                id="custom-start-date"
                type="date"
                value={localStart}
                max={localEnd || '2026-12-31'}
                onChange={(e) => {
                  setLocalStart(e.target.value);
                  setDateError(null);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="custom-end-date" className="font-medium text-slate-700 shrink-0">
                Hasta:
              </label>
              <input
                id="custom-end-date"
                type="date"
                value={localEnd}
                min={localStart || '2020-01-01'}
                max="2026-12-31"
                onChange={(e) => {
                  setLocalEnd(e.target.value);
                  setDateError(null);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-2xs transition-colors shrink-0"
            >
              <span>Aplicar Rango</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">Accesos directos:</span>
            <button
              type="button"
              onClick={() => handleShortcut('2026-10-26', '2026-11-09')}
              className="px-2 py-1 text-[11px] text-slate-600 hover:text-blue-700 hover:bg-white rounded border border-slate-200/70 transition-colors"
            >
              Últimas 2 semanas
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('2026-10-01', '2026-10-31')}
              className="px-2 py-1 text-[11px] text-slate-600 hover:text-blue-700 hover:bg-white rounded border border-slate-200/70 transition-colors"
            >
              Mes Anterior (Octubre)
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('2026-11-01', '2026-11-09')}
              className="px-2 py-1 text-[11px] text-slate-600 hover:text-blue-700 hover:bg-white rounded border border-slate-200/70 transition-colors"
            >
              Noviembre en curso
            </button>
          </div>
        </form>
      )}

      {/* Date Validation Error Feedback */}
      {dateError && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>{dateError}</span>
        </div>
      )}

      {/* Bottom Telemetry Bar: Live Cross-Collection Sincronization Stats */}
      <div className="px-4 py-2.5 bg-white text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap text-slate-600">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-400">Ventas en Rango:</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {syncStats.filteredSalesCount} tickets
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-mono font-medium text-blue-700 tabular-nums">
              ${syncStats.filteredRevenue.toLocaleString('es-CL')}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-400">Kardex Auditado:</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {syncStats.filteredKardexCount} mov.
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">Gastos Operativos:</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {syncStats.filteredExpensesCount} reg.
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-400">Catálogo Base:</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {syncStats.totalProducts} SKUs
            </span>
          </div>
        </div>

        {/* Global Sync Confirmation Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto text-[11px] text-emerald-700 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Sincronización activa (useBI) · Todos los widgets</span>
        </div>
      </div>
    </section>
  );
};
