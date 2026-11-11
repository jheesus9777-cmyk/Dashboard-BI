import React, { useState } from 'react';
import { useBI, BIContext } from '../context/BIContext';
import { KPICockpit } from './KPICockpit';
import { BCGMatrix } from './BCGMatrix';
import { GranelVsSaco } from './GranelVsSaco';
import { Heatmap7x24 } from './Heatmap7x24';
import { StockCoverageRunway } from './StockCoverageRunway';
import { WhatIfSimulator } from './WhatIfSimulator';
import {
  Columns2,
  Calendar,
  ArrowRightLeft,
  X,
  TrendingUp,
  Receipt,
  Percent,
  DollarSign,
  PackageCheck,
  Scale,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export const CompareSplitScreen: React.FC = () => {
  const {
    activeDateRange,
    compareActiveDateRange,
    kpis,
    comparePeriodVariance,
    periodBContextValue,
    toggleCompareMode,
  } = useBI();

  const [viewMode, setViewMode] = useState<'side_by_side' | 'tabs'>('side_by_side');
  const [activeTab, setActiveTab] = useState<'periodA' | 'periodB'>('periodA');
  const [focusedModule, setFocusedModule] = useState<'all' | 'cockpit' | 'bcg' | 'granel' | 'heatmap' | 'runway'>('all');

  const formatCurrency = (val: number) => {
    return '$' + Math.round(val).toLocaleString('es-CL');
  };

  const renderVariancePill = (amount: number, pct: number, isPoints = false) => {
    const isPositive = amount > 0;
    const isNeutral = amount === 0;
    const sign = isPositive ? '+' : '';
    const text = isPoints ? `${sign}${amount} pts` : `${sign}${pct}%`;

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
          isNeutral
            ? 'bg-slate-100 text-slate-600 border border-slate-200'
            : isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        {text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Comparative Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <Columns2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    Modo Comparativa en Pantalla Dividida
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Lado a Lado Activo
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Comparación simultánea sincronizada de métricas directivas, matriz BCG, rentabilidad de granel y flujo de inventario entre dos períodos temporales.
                </p>
              </div>
            </div>

            {/* Layout switchers & exit */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/80 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('side_by_side')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    viewMode === 'side_by_side'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Lado a Lado
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tabs')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    viewMode === 'tabs'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Pestañas A/B
                </button>
              </div>

              <button
                type="button"
                onClick={toggleCompareMode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-colors"
                title="Salir del modo comparativa"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar Comparativa</span>
              </button>
            </div>
          </div>

          {/* Dual Period Indicator Pills */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/25 border border-blue-400/40 text-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">Período A (Base):</span>
                <span className="font-mono text-slate-100">{activeDateRange.formattedLabel}</span>
              </div>

              <div className="flex items-center justify-center text-slate-400">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/25 border border-indigo-400/40 text-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">Período B (Comparativo):</span>
                <span className="font-mono text-slate-100">{compareActiveDateRange.formattedLabel}</span>
              </div>
            </div>

            {/* Quick Module Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400">Enfoque:</span>
              <button
                type="button"
                onClick={() => setFocusedModule('all')}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  focusedModule === 'all'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFocusedModule('cockpit')}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  focusedModule === 'cockpit'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Cockpit
              </button>
              <button
                type="button"
                onClick={() => setFocusedModule('bcg')}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  focusedModule === 'bcg'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Matriz BCG
              </button>
              <button
                type="button"
                onClick={() => setFocusedModule('granel')}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  focusedModule === 'granel'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Granel vs Saco
              </button>
              <button
                type="button"
                onClick={() => setFocusedModule('heatmap')}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  focusedModule === 'heatmap'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Heatmap 7x24
              </button>
            </div>
          </div>
        </div>

        {/* Executive Comparative Variance Bar */}
        <div className="p-4 bg-slate-50/90 border-t border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Resumen Ejecutivo de Variaciones (Período A vs Período B)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Δ Neto = Período A - Período B
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
            {/* Revenue Variance */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span>Ventas Totales</span>
                {renderVariancePill(comparePeriodVariance.revenueDeltaAmount, comparePeriodVariance.revenueDeltaPct)}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                  {formatCurrency(kpis.totalSales)}
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  vs {formatCurrency(periodBContextValue.kpis.totalSales)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {comparePeriodVariance.revenueDeltaAmount >= 0 ? '+' : ''}
                {formatCurrency(comparePeriodVariance.revenueDeltaAmount)} diferencia
              </span>
            </div>

            {/* Tickets Variance */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span>Transacciones</span>
                {renderVariancePill(comparePeriodVariance.ticketsDeltaCount, comparePeriodVariance.ticketsDeltaPct)}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                  {kpis.ticketCount} tickets
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  vs {periodBContextValue.kpis.ticketCount}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {comparePeriodVariance.ticketsDeltaCount >= 0 ? '+' : ''}
                {comparePeriodVariance.ticketsDeltaCount} tickets netos
              </span>
            </div>

            {/* AOV Variance */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span>Ticket Promedio</span>
                {renderVariancePill(comparePeriodVariance.aovDeltaAmount, comparePeriodVariance.aovDeltaPct)}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                  {formatCurrency(kpis.aov)}
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  vs {formatCurrency(periodBContextValue.kpis.aov)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {comparePeriodVariance.aovDeltaAmount >= 0 ? '+' : ''}
                {formatCurrency(comparePeriodVariance.aovDeltaAmount)} / cliente
              </span>
            </div>

            {/* Margin Variance */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span>Margen Ponderado</span>
                {renderVariancePill(comparePeriodVariance.marginDeltaPts, 0, true)}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                  {kpis.weightedGrossMarginPct.toFixed(2)}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  vs {periodBContextValue.kpis.weightedGrossMarginPct.toFixed(2)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {comparePeriodVariance.marginDeltaPts >= 0 ? '+' : ''}
                {comparePeriodVariance.marginDeltaPts.toFixed(2)} pts porcentuales
              </span>
            </div>

            {/* EBITDA Variance */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                <span>EBITDA Operativo</span>
                {renderVariancePill(comparePeriodVariance.ebitdaDeltaAmount, comparePeriodVariance.ebitdaDeltaPct)}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                  {formatCurrency(kpis.operatingEbitda)}
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  vs {formatCurrency(periodBContextValue.kpis.operatingEbitda)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {comparePeriodVariance.ebitdaDeltaAmount >= 0 ? '+' : ''}
                {formatCurrency(comparePeriodVariance.ebitdaDeltaAmount)} de flujo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector when in Tabs View Mode */}
      {viewMode === 'tabs' && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('periodA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'periodA'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-300" />
            <span>Período A (Base): {activeDateRange.formattedLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('periodB')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'periodB'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-300" />
            <span>Período B (Comparativo): {compareActiveDateRange.formattedLabel}</span>
          </button>
        </div>
      )}

      {/* Split-Screen Main Visualization */}
      {viewMode === 'side_by_side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* COLUMN A (PERIOD A - BASE) */}
          <div className="space-y-6">
            <div className="sticky top-18 z-20 bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  Columna A
                </span>
                <span className="text-xs font-bold text-blue-950">Período Base</span>
                <span className="text-xs text-blue-700 font-mono hidden sm:inline">
                  {activeDateRange.formattedLabel}
                </span>
              </div>
              <div className="text-xs font-mono font-semibold text-blue-900 tabular-nums">
                {formatCurrency(kpis.totalSales)}
              </div>
            </div>

            {/* Period A Widgets */}
            {(focusedModule === 'all' || focusedModule === 'cockpit') && <KPICockpit />}
            {(focusedModule === 'all' || focusedModule === 'bcg') && <BCGMatrix />}
            {(focusedModule === 'all' || focusedModule === 'granel') && <GranelVsSaco />}
            {(focusedModule === 'all' || focusedModule === 'heatmap') && <Heatmap7x24 />}
            {(focusedModule === 'all' || focusedModule === 'runway') && <StockCoverageRunway />}
            {focusedModule === 'all' && <WhatIfSimulator />}
          </div>

          {/* COLUMN B (PERIOD B - COMPARATIVE) */}
          <div className="space-y-6">
            <div className="sticky top-18 z-20 bg-indigo-50 border border-indigo-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                  Columna B
                </span>
                <span className="text-xs font-bold text-indigo-950">Período Comparativo</span>
                <span className="text-xs text-indigo-700 font-mono hidden sm:inline">
                  {compareActiveDateRange.formattedLabel}
                </span>
              </div>
              <div className="text-xs font-mono font-semibold text-indigo-900 tabular-nums">
                {formatCurrency(periodBContextValue.kpis.totalSales)}
              </div>
            </div>

            {/* Period B Widgets wrapped in Period B Scoped Context */}
            <BIContext.Provider value={periodBContextValue}>
              {(focusedModule === 'all' || focusedModule === 'cockpit') && <KPICockpit />}
              {(focusedModule === 'all' || focusedModule === 'bcg') && <BCGMatrix />}
              {(focusedModule === 'all' || focusedModule === 'granel') && <GranelVsSaco />}
              {(focusedModule === 'all' || focusedModule === 'heatmap') && <Heatmap7x24 />}
              {(focusedModule === 'all' || focusedModule === 'runway') && <StockCoverageRunway />}
              {focusedModule === 'all' && <WhatIfSimulator />}
            </BIContext.Provider>
          </div>
        </div>
      ) : (
        /* Single Tab View */
        <div>
          {activeTab === 'periodA' ? (
            <div className="space-y-6">
              {(focusedModule === 'all' || focusedModule === 'cockpit') && <KPICockpit />}
              {(focusedModule === 'all' || focusedModule === 'bcg') && <BCGMatrix />}
              {(focusedModule === 'all' || focusedModule === 'granel') && <GranelVsSaco />}
              {(focusedModule === 'all' || focusedModule === 'heatmap') && <Heatmap7x24 />}
              {(focusedModule === 'all' || focusedModule === 'runway') && <StockCoverageRunway />}
              {focusedModule === 'all' && <WhatIfSimulator />}
            </div>
          ) : (
            <BIContext.Provider value={periodBContextValue}>
              <div className="space-y-6">
                {(focusedModule === 'all' || focusedModule === 'cockpit') && <KPICockpit />}
                {(focusedModule === 'all' || focusedModule === 'bcg') && <BCGMatrix />}
                {(focusedModule === 'all' || focusedModule === 'granel') && <GranelVsSaco />}
                {(focusedModule === 'all' || focusedModule === 'heatmap') && <Heatmap7x24 />}
                {(focusedModule === 'all' || focusedModule === 'runway') && <StockCoverageRunway />}
                {focusedModule === 'all' && <WhatIfSimulator />}
              </div>
            </BIContext.Provider>
          )}
        </div>
      )}
    </div>
  );
};
