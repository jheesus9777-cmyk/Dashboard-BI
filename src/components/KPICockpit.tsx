import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  Percent,
  DollarSign,
  PackageCheck,
  RotateCw,
  Info,
  ShieldCheck,
  LineChart,
  SlidersHorizontal,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useBI } from '../context/BIContext';
import { KPITrendChart } from './KPITrendChart';
import { KPIThresholdModal } from './KPIThresholdModal';
import { PredictiveKPIThresholds } from './PredictiveKPIThresholds';
import { KPIThresholdConfig, KPIEvaluation } from '../types/thresholds';
import {
  loadKPIThresholdConfig,
  evaluateAllCockpitKPIs,
} from '../utils/kpiThresholds';
import {
  calculateSeasonalVariancePredictions,
  buildDynamicThresholdConfigFromPredictions,
} from '../utils/seasonalVariancePredictor';

type AlertFilterType = 'all' | 'alerts_only' | 'critical_only';

export const KPICockpit: React.FC = () => {
  const { kpis, sales, expenses, dateFilter, activeDateRange, periodComparison } = useBI();
  const [showTrendChart, setShowTrendChart] = useState<boolean>(true);
  const [showPredictiveModule, setShowPredictiveModule] = useState<boolean>(false);
  const [isDynamicMode, setIsDynamicMode] = useState<boolean>(true);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [thresholdConfig, setThresholdConfig] = useState<KPIThresholdConfig>(() =>
    loadKPIThresholdConfig()
  );
  const [alertFilter, setAlertFilter] = useState<AlertFilterType>('all');

  const formatCurrency = (val: number) => {
    return '$' + Math.round(val).toLocaleString('es-CL');
  };

  const daysCount = activeDateRange?.daysCount || 30;

  // Calculate seasonal variance predictions from historical time series
  const seasonalPredictions = useMemo(() => {
    return calculateSeasonalVariancePredictions(sales, expenses, undefined, thresholdConfig);
  }, [sales, expenses, thresholdConfig]);

  // Compute effective thresholds depending on dynamic vs static mode
  const effectiveThresholdConfig = useMemo(() => {
    if (isDynamicMode) {
      return buildDynamicThresholdConfigFromPredictions(seasonalPredictions, thresholdConfig);
    }
    return thresholdConfig;
  }, [isDynamicMode, seasonalPredictions, thresholdConfig]);

  // Run evaluations against active thresholds
  const evaluations = useMemo(() => {
    return evaluateAllCockpitKPIs(kpis, effectiveThresholdConfig, daysCount);
  }, [kpis, effectiveThresholdConfig, daysCount]);

  const renderDeltaBadge = (delta: number, isPoints = false, suffix = '') => {
    if (!periodComparison.hasPreviousData) {
      return (
        <span
          className="inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200"
          title="Período inicial: sin datos previos para calcular variación"
        >
          Base
        </span>
      );
    }

    const isPositive = delta > 0;
    const isNeutral = delta === 0;
    const sign = isPositive ? '+' : '';
    const text = isPoints ? `${sign}${delta} pts` : `${sign}${delta}%`;

    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
          isNeutral
            ? 'bg-slate-100 text-slate-600 border border-slate-200'
            : isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
        title="Comparado con período anterior equivalente"
      >
        <span>{text}</span>
        {suffix && <span className="font-normal text-[10px] text-slate-500">{suffix}</span>}
      </span>
    );
  };

  /**
   * Visual status badge for the top of each KPI card
   */
  const renderStatusBadge = (evalResult: KPIEvaluation) => {
    if (evalResult.status === 'optimal') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
          title="Rendimiento en o por encima del objetivo"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>En Objetivo</span>
        </span>
      );
    }

    if (evalResult.status === 'warning') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs animate-pulse"
          title="Rendimiento bajo objetivo - Monitoreo preventivo"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>Alerta Preventiva</span>
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs"
        title="Umbral crítico vulnerado - Requiere acción en 48 horas"
      >
        <AlertCircle className="w-3 h-3 text-rose-600" />
        <span>Crítico (48h)</span>
      </span>
    );
  };

  /**
   * Visual Progress Gauge Bar towards Target
   */
  const renderTargetGauge = (evalResult: KPIEvaluation, unit: string) => {
    const isCritical = evalResult.status === 'critical';
    const isWarning = evalResult.status === 'warning';
    const isOptimal = evalResult.status === 'optimal';

    const clampedPct = Math.min(100, Math.max(5, evalResult.pctOfTarget));

    const barColor = isCritical
      ? 'bg-rose-500'
      : isWarning
      ? 'bg-amber-500'
      : 'bg-emerald-500';

    return (
      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-500 flex items-center gap-1">
            <span>Meta:</span>
            <strong className="text-slate-800 font-semibold">
              {unit === '$' ? formatCurrency(evalResult.effectiveTarget) : `${evalResult.effectiveTarget}${unit}`}
            </strong>
            {isDynamicMode && (
              <span
                className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold"
                title="Meta ajustada automáticamente por varianza estacional del período"
              >
                ±σ
              </span>
            )}
          </span>
          <span
            className={`font-semibold ${
              isCritical
                ? 'text-rose-600'
                : isWarning
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {evalResult.pctOfTarget}% {isOptimal ? 'logrado' : 'del objetivo'}
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>

        {/* Action Directive Callout when not optimal */}
        {(isCritical || isWarning) && (
          <div
            className={`text-[10px] px-2 py-1 rounded flex items-start gap-1.5 mt-1 border ${
              isCritical
                ? 'bg-rose-50/70 text-rose-800 border-rose-200'
                : 'bg-amber-50/70 text-amber-900 border-amber-200'
            }`}
          >
            <span className="font-bold shrink-0">
              {isCritical ? '🚨 48h:' : '⚠️ 7d:'}
            </span>
            <span className="line-clamp-2 leading-tight">{evalResult.recommendation}</span>
          </div>
        )}
      </div>
    );
  };

  /**
   * Helper to determine card container styling based on threshold status
   */
  const getCardClasses = (evalResult: KPIEvaluation) => {
    const base = 'rounded-xl p-5 shadow-xs relative overflow-hidden transition-all';
    if (evalResult.status === 'critical') {
      return `${base} bg-white border-2 border-rose-300 ring-2 ring-rose-300/30 hover:border-rose-400`;
    }
    if (evalResult.status === 'warning') {
      return `${base} bg-white border-2 border-amber-300 ring-1 ring-amber-300/30 hover:border-amber-400`;
    }
    return `${base} bg-white border border-slate-200 hover:border-slate-300`;
  };

  const revenueDeltaAmount = kpis.totalSales - periodComparison.previousRevenue;

  // Filter cards based on alert filter
  const isCardVisible = (evalResult: KPIEvaluation) => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'alerts_only') return evalResult.status !== 'optimal';
    if (alertFilter === 'critical_only') return evalResult.status === 'critical';
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Cockpit de KPIs Ejecutivos</span>
            <span className="text-xs font-mono text-slate-500 font-normal">
              · Métricas de Retorno & Rentabilidad
            </span>
            {isDynamicMode && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <Zap className="w-3 h-3 text-blue-600" />
                <span>Dinámico Estacional</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDynamicMode
              ? 'Indicadores evaluados contra umbrales dinámicos calibrados por varianza estacional semanal (±σ)'
              : 'Indicadores evaluados contra umbrales estáticos fijos predeterminados'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 font-mono flex-wrap">
          <div className="flex items-center gap-1.5">
            <span>Tickets: <strong className="text-slate-800 font-semibold">{kpis.ticketCount}</strong></span>
            {renderDeltaBadge(periodComparison.ticketsDeltaPct)}
          </div>
          <span aria-hidden="true">·</span>
          <span>Unidades: <strong className="text-slate-800 font-semibold">{kpis.itemsSold.toLocaleString('es-CL')}</strong></span>
          <span aria-hidden="true">·</span>

          {/* Mode Switcher: Static vs Dynamic */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-sans">
            <button
              type="button"
              onClick={() => setIsDynamicMode(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                isDynamicMode
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Activar umbrales dinámicos calibrados por varianza estacional"
            >
              <Zap className="w-3 h-3" />
              <span>Dinámicos</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDynamicMode(false)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                !isDynamicMode
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Activar umbrales estáticos fijos tradicionales"
            >
              <span>Estáticos</span>
            </button>
          </div>

          {/* Toggle Predictive Module */}
          <button
            type="button"
            onClick={() => setShowPredictiveModule(!showPredictiveModule)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-sans font-medium transition-colors ${
              showPredictiveModule
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
            }`}
            title="Alternar vista del módulo de análisis predictivo de varianza estacional"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showPredictiveModule ? 'Ocultar Predictivo' : 'Análisis Predictivo'}</span>
          </button>

          {/* Threshold Config Button */}
          <button
            type="button"
            onClick={() => setIsThresholdModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-sans font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
            title="Configurar metas, semáforos y umbrales críticos de alarma"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Configurar</span>
          </button>

          {/* Trend Chart Toggle Button */}
          <button
            type="button"
            onClick={() => setShowTrendChart(!showTrendChart)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-sans font-medium transition-colors ${
              showTrendChart
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Alternar visibilidad de la curva de tendencia temporal"
          >
            <LineChart className="w-3.5 h-3.5 text-blue-600" />
            <span>{showTrendChart ? 'Ocultar Curva' : 'Ver Tendencia'}</span>
          </button>
        </div>
      </div>

      {/* Critical Threshold Status & Semaphore Summary Banner */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Semáforo CFO:</span>
          </span>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 font-mono font-semibold text-[11px] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{evaluations.optimalCount} en Objetivo</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] border ${
              evaluations.warningCount > 0
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${evaluations.warningCount > 0 ? 'bg-amber-600 animate-pulse' : 'bg-slate-400'}`} />
              <span>{evaluations.warningCount} Preventivos</span>
            </span>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] border ${
              evaluations.criticalCount > 0
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${evaluations.criticalCount > 0 ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
              <span>{evaluations.criticalCount} Críticos (48h)</span>
            </span>

            {isDynamicMode && (
              <span className="text-[11px] font-mono text-slate-500 ml-1 hidden sm:inline">
                · {seasonalPredictions.summary.totalFalseAlarmsAvoided} falsas alarmas evitadas
              </span>
            )}
          </div>
        </div>

        {/* Filter Alert Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <span className="text-[10px] text-slate-400 uppercase font-semibold px-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Filtro:</span>
          </span>
          <button
            type="button"
            onClick={() => setAlertFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              alertFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({evaluations.totalCount})
          </button>
          <button
            type="button"
            onClick={() => setAlertFilter('alerts_only')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              alertFilter === 'alerts_only'
                ? 'bg-amber-500 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Solo Alertas ({evaluations.warningCount + evaluations.criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setAlertFilter('critical_only')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              alertFilter === 'critical_only'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Solo Críticos ({evaluations.criticalCount})
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: GMROI */}
        {isCardVisible(evaluations.gmroi) && (
          <div className={getCardClasses(evaluations.gmroi)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>GMROI (Retorno s/ Stock)</span>
                  {isDynamicMode && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Dinámico
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums text-slate-950">
                    {kpis.gmroi}x
                  </span>
                  {renderStatusBadge(evaluations.gmroi)}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  evaluations.gmroi.status === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : evaluations.gmroi.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Margen: {formatCurrency(kpis.grossMarginAmount)}</span>
              <span aria-hidden="true">/</span>
              <span>Inv. Costo: {formatCurrency(kpis.inventoryValue)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Por cada $1.0 en stock, el negocio genera ${kpis.gmroi} en margen bruto.
            </p>

            {/* Target Progress Gauge */}
            {renderTargetGauge(evaluations.gmroi, 'x')}
          </div>
        )}

        {/* KPI 2: Ticket Promedio (AOV) */}
        {isCardVisible(evaluations.aov) && (
          <div className={getCardClasses(evaluations.aov)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Ticket Promedio (AOV)</span>
                  {isDynamicMode && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Dinámico
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums text-slate-950">
                    {formatCurrency(kpis.aov)}
                  </span>
                  {renderStatusBadge(evaluations.aov)}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  evaluations.aov.status === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : evaluations.aov.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Tickets: {kpis.ticketCount}</span>
              <span aria-hidden="true">·</span>
              <span>Prom. Items: {(kpis.itemsSold / Math.max(1, kpis.ticketCount)).toFixed(1)} u/ticket</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Monto promedio facturado por cliente en cada compra física o digital.
            </p>

            {/* Target Progress Gauge */}
            {renderTargetGauge(evaluations.aov, '$')}
          </div>
        )}

        {/* KPI 3: Margen Bruto Ponderado Real */}
        {isCardVisible(evaluations.weightedGrossMarginPct) && (
          <div className={getCardClasses(evaluations.weightedGrossMarginPct)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Margen Bruto Ponderado</span>
                  {isDynamicMode && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Dinámico
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-bold tracking-tight tabular-nums ${
                      evaluations.weightedGrossMarginPct.status === 'critical'
                        ? 'text-rose-600'
                        : evaluations.weightedGrossMarginPct.status === 'warning'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {kpis.weightedGrossMarginPct}%
                  </span>
                  {renderStatusBadge(evaluations.weightedGrossMarginPct)}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  evaluations.weightedGrossMarginPct.status === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : evaluations.weightedGrossMarginPct.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Ventas: {formatCurrency(kpis.totalSales)}</span>
              <span aria-hidden="true">·</span>
              <span>COGS: {formatCurrency(kpis.totalCogs)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Calculado sobre costo real de mercadería vendida (sin desvíos de catálogo).
            </p>

            {/* Target Progress Gauge */}
            {renderTargetGauge(evaluations.weightedGrossMarginPct, '%')}
          </div>
        )}

        {/* KPI 4: Ventas Netas Totales */}
        {isCardVisible(evaluations.totalSales) && (
          <div className={getCardClasses(evaluations.totalSales)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Facturación Neta Total</span>
                  {isDynamicMode && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Dinámico
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums text-slate-950">
                    {formatCurrency(kpis.totalSales)}
                  </span>
                  {renderStatusBadge(evaluations.totalSales)}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  evaluations.totalSales.status === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : evaluations.totalSales.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Ganancia Bruta: {formatCurrency(kpis.grossMarginAmount)}</span>
              {periodComparison.hasPreviousData && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500 text-[11px]">
                    Δ {revenueDeltaAmount >= 0 ? '+' : ''}{formatCurrency(revenueDeltaAmount)}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isDynamicMode
                ? 'Meta ajustada según el mix de días hábiles y fines de semana del período.'
                : 'Ingreso total contabilizado dentro del periodo seleccionado.'}
            </p>

            {/* Target Progress Gauge */}
            {renderTargetGauge(evaluations.totalSales, '$')}
          </div>
        )}

        {/* KPI 5: EBITDA Operativo Estimado */}
        {isCardVisible(evaluations.operatingEbitda) && (
          <div className={getCardClasses(evaluations.operatingEbitda)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>EBITDA Operativo</span>
                  {isDynamicMode && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Dinámico
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-bold tracking-tight tabular-nums ${
                      kpis.operatingEbitda >= 0 ? 'text-slate-950' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(kpis.operatingEbitda)}
                  </span>
                  {renderStatusBadge(evaluations.operatingEbitda)}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  evaluations.operatingEbitda.status === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : evaluations.operatingEbitda.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-purple-50 text-purple-700'
                }`}
              >
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Margen Bruto: {formatCurrency(kpis.grossMarginAmount)}</span>
              <span aria-hidden="true">-</span>
              <span>Gastos: {formatCurrency(kpis.totalExpenses)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Margen bruto descontando arriendo, nómina y servicios operativos.
            </p>

            {/* Target Progress Gauge */}
            {renderTargetGauge(evaluations.operatingEbitda, '$')}
          </div>
        )}

        {/* KPI 6: Rotación y DSI */}
        {isCardVisible(evaluations.daysSalesInventory) && (
          <div className={getCardClasses(evaluations.daysSalesInventory)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Días Inventario (DSI)</span>
                  {isDynamicMode && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Dinámico
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums text-slate-950">
                    {kpis.daysSalesInventory} días
                  </span>
                  {renderStatusBadge(evaluations.daysSalesInventory)}
                </div>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  evaluations.daysSalesInventory.status === 'critical'
                    ? 'bg-rose-100 text-rose-700'
                    : evaluations.daysSalesInventory.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <RotateCw className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Rotación: {kpis.inventoryTurnoverRatio}x</span>
              <span aria-hidden="true">·</span>
              <span>Stock Costo: {formatCurrency(kpis.inventoryValue)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Velocidad con la que el stock rota y se convierte en efectivo en caja (menor días = mayor liquidez).
            </p>

            {/* Target Progress Gauge */}
            {renderTargetGauge(evaluations.daysSalesInventory, ' días')}
          </div>
        )}
      </div>

      {/* Empty State when filter yields 0 cards */}
      {alertFilter !== 'all' &&
        ((alertFilter === 'alerts_only' &&
          evaluations.warningCount + evaluations.criticalCount === 0) ||
          (alertFilter === 'critical_only' && evaluations.criticalCount === 0)) && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-emerald-900 mt-2">
              ¡Excelente! No hay KPIs en estado de alarma crítica
            </h4>
            <p className="text-xs text-emerald-700 mt-1">
              Todos los indicadores financieros evaluados cumplen o superan los umbrales configurados para el período activo.
            </p>
            <button
              type="button"
              onClick={() => setAlertFilter('all')}
              className="mt-3 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Ver Todos los KPIs
            </button>
          </div>
        )}

      {/* Historical Trend Line Chart within Selected Date Range */}
      {showTrendChart && <KPITrendChart />}

      {/* Predictive Seasonal Variance Module (Expandable or via dedicated widget) */}
      {showPredictiveModule && (
        <PredictiveKPIThresholds
          currentThresholdConfig={thresholdConfig}
          onApplyDynamicThresholds={(newConfig) => {
            setThresholdConfig(newConfig);
            setIsDynamicMode(true);
          }}
        />
      )}

      {/* Threshold Configuration Modal */}
      <KPIThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        currentConfig={thresholdConfig}
        onSave={(newConfig) => setThresholdConfig(newConfig)}
        daysCount={daysCount}
      />
    </div>
  );
};
