import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Activity,
  Sliders,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Layers,
  Check,
  ChevronRight,
  BarChart3,
  Percent,
  Receipt,
  DollarSign,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import { useBI } from '../context/BIContext';
import {
  PredictiveMetricKey,
  PredictiveModelConfig,
  SensitivityLevel,
} from '../types/predictive';
import { KPIThresholdConfig } from '../types/thresholds';
import {
  calculateSeasonalVariancePredictions,
  buildDynamicThresholdConfigFromPredictions,
  DEFAULT_PREDICTIVE_CONFIG,
} from '../utils/seasonalVariancePredictor';
import { saveKPIThresholdConfig } from '../utils/kpiThresholds';

interface PredictiveKPIThresholdsProps {
  onApplyDynamicThresholds?: (config: KPIThresholdConfig) => void;
  currentThresholdConfig?: KPIThresholdConfig;
}

export const PredictiveKPIThresholds: React.FC<PredictiveKPIThresholdsProps> = ({
  onApplyDynamicThresholds,
  currentThresholdConfig,
}) => {
  const { sales, expenses, activeDateRange } = useBI();

  const [selectedMetric, setSelectedMetric] = useState<PredictiveMetricKey>('sales');
  const [modelConfig, setModelConfig] = useState<PredictiveModelConfig>(DEFAULT_PREDICTIVE_CONFIG);
  const [showAppliedToast, setShowAppliedToast] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Calculate predictive seasonal decomposition and dynamic threshold limits
  const predictions = useMemo(() => {
    return calculateSeasonalVariancePredictions(sales, expenses, modelConfig, currentThresholdConfig);
  }, [sales, expenses, modelConfig, currentThresholdConfig]);

  const activeStats = predictions.stats[selectedMetric];
  const activePoints = predictions.dailyPoints[selectedMetric] || [];

  const formatValue = (val: number, key: PredictiveMetricKey) => {
    if (key === 'margin') return `${val.toFixed(1)}%`;
    if (key === 'tickets') return `${Math.round(val)} tickets`;
    return '$' + Math.round(val).toLocaleString('es-CL');
  };

  const handleSensitivityChange = (level: SensitivityLevel) => {
    if (level === 'strict') {
      setModelConfig((prev) => ({
        ...prev,
        sensitivity: 'strict',
        sigmaMultiplierWarning: 0.75,
        sigmaMultiplierCritical: 1.5,
      }));
    } else if (level === 'moderate') {
      setModelConfig((prev) => ({
        ...prev,
        sensitivity: 'moderate',
        sigmaMultiplierWarning: 1.0,
        sigmaMultiplierCritical: 2.0,
      }));
    } else {
      setModelConfig((prev) => ({
        ...prev,
        sensitivity: 'tolerant',
        sigmaMultiplierWarning: 1.5,
        sigmaMultiplierCritical: 2.5,
      }));
    }
  };

  const handleApplyToCockpit = () => {
    const dynamicConfig = buildDynamicThresholdConfigFromPredictions(predictions, currentThresholdConfig);
    saveKPIThresholdConfig(dynamicConfig);
    if (onApplyDynamicThresholds) {
      onApplyDynamicThresholds(dynamicConfig);
    }
    setShowAppliedToast(true);
    setTimeout(() => setShowAppliedToast(false), 3500);
  };

  // SVG Chart Dimensions & Computations
  const chartWidth = 840;
  const chartHeight = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const yValues = activePoints.flatMap((p) => [
    p.actualValue,
    p.expectedSeasonalValue,
    p.dynamicTarget,
    p.dynamicCritical,
    p.staticCritical,
  ]);
  const yMin = Math.max(0, Math.min(...yValues) * 0.85);
  const yMax = Math.max(...yValues) * 1.15 || 100;

  const getX = (index: number) => {
    if (activePoints.length <= 1) return padding.left;
    return padding.left + (index / (activePoints.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    if (yMax === yMin) return padding.top + graphHeight / 2;
    return padding.top + graphHeight - ((val - yMin) / (yMax - yMin)) * graphHeight;
  };

  // Build SVG path lines
  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const actualPointsCoord = activePoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.actualValue),
  }));
  const expectedPointsCoord = activePoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.expectedSeasonalValue),
  }));
  const targetPointsCoord = activePoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.dynamicTarget),
  }));
  const criticalPointsCoord = activePoints.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.dynamicCritical),
  }));

  const actualPath = buildSmoothPath(actualPointsCoord);
  const expectedPath = buildSmoothPath(expectedPointsCoord);
  const targetPath = buildSmoothPath(targetPointsCoord);
  const criticalPath = buildSmoothPath(criticalPointsCoord);

  // Dynamic envelope area polygon between Target and Critical
  let envelopePath = '';
  if (targetPointsCoord.length > 0 && criticalPointsCoord.length > 0) {
    envelopePath = `M ${targetPointsCoord[0].x} ${targetPointsCoord[0].y}`;
    for (let i = 1; i < targetPointsCoord.length; i++) {
      const cpX = (targetPointsCoord[i - 1].x + targetPointsCoord[i].x) / 2;
      envelopePath += ` C ${cpX} ${targetPointsCoord[i - 1].y}, ${cpX} ${targetPointsCoord[i].y}, ${targetPointsCoord[i].x} ${targetPointsCoord[i].y}`;
    }
    // Return via critical path in reverse
    for (let i = criticalPointsCoord.length - 1; i >= 0; i--) {
      envelopePath += ` L ${criticalPointsCoord[i].x} ${criticalPointsCoord[i].y}`;
    }
    envelopePath += ' Z';
  }

  // Horizontal Grid Lines
  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Análisis Predictivo & Umbrales Dinámicos Estacionales
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Varianza Estacional ±σ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sustituye umbrales estáticos planos por límites adaptativos calibrados según la estacionalidad semanal (lunes vs sábado), quincenas y bandas residuales de dispersión estadística.
          </p>
        </div>

        {/* Global Model Telemetry Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-400">Confianza:</span>
            <strong className="text-blue-700 font-bold">{predictions.summary.overallPredictiveConfidencePct}%</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{predictions.summary.totalFalseAlarmsAvoided} Falsas Alarmas Evitadas</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{predictions.summary.totalLeaksDetected} Fugas de Fin de Semana Detectadas</span>
          </div>
        </div>
      </div>

      {/* Model Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
        {/* Metric Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedMetric('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedMetric === 'sales'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Facturación ($)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('margin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedMetric === 'margin'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Margen Real (%)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('aov')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedMetric === 'aov'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Ticket Promedio ($)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('ebitda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedMetric === 'ebitda'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>EBITDA ($)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('tickets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedMetric === 'tickets'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tickets</span>
          </button>
        </div>

        {/* Model Calibration Sensitivity */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Sensibilidad σ:</span>
          <div className="flex items-center p-0.5 rounded-lg bg-white border border-slate-200">
            <button
              type="button"
              onClick={() => handleSensitivityChange('strict')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                modelConfig.sensitivity === 'strict'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sensibilidad estricta: bandas estrechas (0.75σ / 1.5σ)"
            >
              Estricta
            </button>
            <button
              type="button"
              onClick={() => handleSensitivityChange('moderate')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                modelConfig.sensitivity === 'moderate'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sensibilidad moderada (Recomendada): bandas a 1.0σ / 2.0σ"
            >
              Moderada
            </button>
            <button
              type="button"
              onClick={() => handleSensitivityChange('tolerant')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                modelConfig.sensitivity === 'tolerant'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sensibilidad flexible: tolera mayor dispersión (1.5σ / 2.5σ)"
            >
              Flexible
            </button>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApplyToCockpit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all"
            title="Aplica los umbrales dinámicos calibrados al Cockpit de KPIs y los guarda en storage"
          >
            {showAppliedToast ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Umbrales Aplicados!</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Adoptar en Cockpit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Predictive Chart Container */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">{activeStats.label}</span>
            <span className="text-slate-400">·</span>
            <span>Media: <strong className="font-mono text-slate-700">{formatValue(activeStats.mean, selectedMetric)}</strong></span>
            <span className="text-slate-400">·</span>
            <span>Varianza Residual (CV): <strong className="font-mono text-blue-700">{activeStats.coefficientOfVariationPct}%</strong></span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Real</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-sm bg-indigo-400 inline-block" />
              <span>Esperado Estacional</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-sm bg-emerald-500 inline-block" />
              <span>Meta Dinámica</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-sm bg-rose-500 border-dashed inline-block" />
              <span>Piso Crítico (Alarma)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-sm bg-slate-400 inline-block border-t border-dashed" />
              <span>Estático Antiguo</span>
            </span>
          </div>
        </div>

        {/* SVG Visualization Canvas */}
        <div className="relative border border-slate-200 rounded-xl bg-slate-50/50 p-2 overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible select-none"
            aria-label="Gráfico de predicción y bandas dinámicas"
          >
            <defs>
              <linearGradient id="envelopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {gridTicks.map((ratio, idx) => {
              const yVal = yMin + ratio * (yMax - yMin);
              const yPos = getY(yVal);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={chartWidth - padding.right}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray="4,4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 3}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {formatValue(yVal, selectedMetric)}
                  </text>
                </g>
              );
            })}

            {/* Static Critical Threshold Reference Line (Old Flat Line) */}
            {activeStats.staticCritical > 0 && (
              <g>
                <line
                  x1={padding.left}
                  y1={getY(activeStats.staticCritical)}
                  x2={chartWidth - padding.right}
                  y2={getY(activeStats.staticCritical)}
                  stroke="#94a3b8"
                  strokeDasharray="5,5"
                  strokeWidth="1.5"
                />
                <text
                  x={chartWidth - padding.right}
                  y={getY(activeStats.staticCritical) - 4}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-slate-500 font-semibold"
                >
                  Umbral Estático Plano: {formatValue(activeStats.staticCritical, selectedMetric)}
                </text>
              </g>
            )}

            {/* Dynamic Confidence Envelope Area (Target -> Critical) */}
            {envelopePath && (
              <path d={envelopePath} fill="url(#envelopeGrad)" />
            )}

            {/* Dynamic Target Upper Curve */}
            {targetPath && (
              <path
                d={targetPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.8"
              />
            )}

            {/* Dynamic Critical Floor Curve */}
            {criticalPath && (
              <path
                d={criticalPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.9"
              />
            )}

            {/* Expected Seasonal Baseline Curve */}
            {expectedPath && (
              <path
                d={expectedPath}
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                opacity="0.75"
              />
            )}

            {/* Actual Performance Curve */}
            {actualPath && (
              <path
                d={actualPath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Points & Anomaly Indicators */}
            {activePoints.map((p, idx) => {
              const cx = getX(idx);
              const cy = getY(p.actualValue);
              const isHovered = hoveredPointIndex === idx;

              return (
                <g key={idx}>
                  {/* Subtle data dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : p.isDynamicAnomaly ? 5 : 3}
                    className={`transition-all ${
                      p.isDynamicAnomaly
                        ? 'fill-rose-600 stroke-2 stroke-white shadow-md'
                        : isHovered
                        ? 'fill-blue-600 stroke-2 stroke-white'
                        : 'fill-blue-600'
                    }`}
                  />

                  {/* Anomaly warning halo if breached dynamic threshold */}
                  {p.isDynamicAnomaly && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* X-Axis Day Labels (Show every 3rd or 4th tick for clarity) */}
                  {(idx % Math.ceil(activePoints.length / 10) === 0 || idx === activePoints.length - 1) && (
                    <text
                      x={cx}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-500"
                    >
                      {p.dayShort} {p.date.getDate()}
                    </text>
                  )}

                  {/* Interactive invisible hit target */}
                  <rect
                    x={cx - graphWidth / (activePoints.length * 2)}
                    y={padding.top}
                    width={graphWidth / activePoints.length}
                    height={graphHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                </g>
              );
            })}

            {/* Crosshair on hover */}
            {hoveredPointIndex !== null && activePoints[hoveredPointIndex] && (
              <g>
                <line
                  x1={getX(hoveredPointIndex)}
                  y1={padding.top}
                  x2={getX(hoveredPointIndex)}
                  y2={chartHeight - padding.bottom}
                  stroke="#3b82f6"
                  strokeDasharray="2,2"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>

          {/* Floating Hover Context Card */}
          {hoveredPointIndex !== null && activePoints[hoveredPointIndex] && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1.5 pointer-events-none max-w-xs z-10 font-sans">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-900">
                  {activePoints[hoveredPointIndex].dayName} {activePoints[hoveredPointIndex].dateStr}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                    activePoints[hoveredPointIndex].status === 'optimal'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activePoints[hoveredPointIndex].status === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {activePoints[hoveredPointIndex].status === 'optimal'
                    ? '🟢 En Objetivo'
                    : activePoints[hoveredPointIndex].status === 'warning'
                    ? '🟡 Alerta Preventiva'
                    : '🔴 Alerta Crítica'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                <span className="text-slate-500">Real Logrado:</span>
                <strong className="text-blue-700 text-right">
                  {formatValue(activePoints[hoveredPointIndex].actualValue, selectedMetric)}
                </strong>

                <span className="text-slate-500">Esperado Estacional:</span>
                <span className="text-slate-700 text-right">
                  {formatValue(activePoints[hoveredPointIndex].expectedSeasonalValue, selectedMetric)}
                </span>

                <span className="text-slate-500">Piso Crítico (Rojo):</span>
                <span className="text-rose-600 text-right font-semibold">
                  {formatValue(activePoints[hoveredPointIndex].dynamicCritical, selectedMetric)}
                </span>

                <span className="text-slate-500">Desvío Estacional:</span>
                <span
                  className={`text-right font-semibold ${
                    activePoints[hoveredPointIndex].residualError >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {activePoints[hoveredPointIndex].residualError >= 0 ? '+' : ''}
                  {formatValue(activePoints[hoveredPointIndex].residualError, selectedMetric)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day-of-Week Seasonality Decomposition Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Índices de Estacionalidad Semanal (Día a Día)</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Pico de ventas: <strong className="text-slate-800">{predictions.summary.highestSeasonalityDay}</strong> (+{predictions.summary.weekendSurgePct}% en fin de semana)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {activeStats.dayOfWeekSeasonality.map((dow) => {
            const isAboveMean = dow.variancePct >= 0;
            const barPct = Math.min(100, Math.max(15, (dow.seasonalityIndex / 1.5) * 100));

            return (
              <div
                key={dow.dayIndex}
                className={`p-3 rounded-xl border transition-all ${
                  dow.dayName === predictions.summary.highestSeasonalityDay
                    ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-300/40'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{dow.dayShort}</span>
                  <span
                    className={`font-mono text-[10px] font-semibold ${
                      isAboveMean ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {isAboveMean ? '+' : ''}{dow.variancePct}%
                  </span>
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-sm font-extrabold font-mono text-slate-900">
                    {dow.seasonalityIndex}x
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {dow.sampleCount} días
                  </span>
                </div>

                <div className="w-full bg-slate-200/70 rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isAboveMean ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                  Prom: {formatValue(dow.averageValue, selectedMetric)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic vs Static Comparison Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between font-semibold text-slate-800">
          <span>Comparativa: Umbrales Estáticos Tradicionales vs Dinámicos Estacionales</span>
          <span className="font-mono text-[11px] text-slate-500 font-normal">
            Calibrado sobre {predictions.summary.totalDaysAnalyzed} días históricos
          </span>
        </div>

        <div className="divide-y divide-slate-100 bg-white">
          {(['sales', 'margin', 'aov', 'ebitda'] as PredictiveMetricKey[]).map((key) => {
            const s = predictions.stats[key];
            const isSelected = selectedMetric === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 sm:w-1/3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900">{s.label}</span>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Media: {formatValue(s.mean, key)} · Varianza Residual: ±{formatValue(s.residualSeasonalStdDev, key)}
                    </p>
                  </div>
                </div>

                {/* Static Threshold */}
                <div className="sm:w-1/4">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Umbral Estático Plano:
                  </span>
                  <div className="font-mono text-slate-700 text-[11px] mt-0.5">
                    Obj: {formatValue(s.staticTarget, key)} | Crit: {formatValue(s.staticCritical, key)}
                  </div>
                </div>

                {/* Dynamic Suggested Threshold */}
                <div className="sm:w-1/4">
                  <span className="text-[10px] text-blue-700 uppercase font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-600" />
                    <span>Dinámico Sugerido:</span>
                  </span>
                  <div className="font-mono font-semibold text-slate-900 text-[11px] mt-0.5">
                    Obj: <span className="text-emerald-700">{formatValue(s.suggestedDynamicTarget, key)}</span> | Crit: <span className="text-rose-700">{formatValue(s.suggestedDynamicCritical, key)}</span>
                  </div>
                </div>

                {/* CFO Benefit */}
                <div className="sm:w-1/6 text-right">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    +{s.falseAlarmsAvoidedCount} Falsas Alarmas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Recommendation Note */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <p>
            <strong>Criterio Directivo CFO:</strong> Los umbrales dinámicos protegen la caja evitando castigar días de menor afluencia natural (lunes-miércoles) y exigiendo el máximo potencial en días pico de alta rentabilidad (viernes-domingo y quincenas).
          </p>
        </div>
        <button
          type="button"
          onClick={handleApplyToCockpit}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0 shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Adoptar Umbrales en Cockpit</span>
        </button>
      </div>
    </div>
  );
};
