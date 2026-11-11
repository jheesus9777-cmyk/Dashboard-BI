import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  Receipt,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { useBI } from '../context/BIContext';

export type TrendMetricType = 'sales' | 'margin' | 'aov' | 'ebitda' | 'tickets';

interface DailyTrendPoint {
  date: Date;
  dateStr: string;
  shortLabel: string;
  fullDateLabel: string;
  dayName: string;
  sales: number;
  cogs: number;
  grossMarginAmount: number;
  grossMarginPct: number;
  ticketCount: number;
  aov: number;
  expenses: number;
  ebitda: number;
}

export const KPITrendChart: React.FC = () => {
  const { sales, expenses, activeDateRange, periodComparison } = useBI();

  const [selectedMetric, setSelectedMetric] = useState<TrendMetricType>('sales');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [granularity, setGranularity] = useState<'daily' | 'weekly'>('daily');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) => {
    return '$' + Math.round(val).toLocaleString('es-CL');
  };

  // Group and aggregate data across the active date range
  const dailyData = useMemo<DailyTrendPoint[]>(() => {
    const pointsMap = new Map<string, {
      sales: number;
      cogs: number;
      ticketCount: number;
      expenses: number;
      date: Date;
    }>();

    // Initialize every calendar date within the active range
    const start = new Date(activeDateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(activeDateRange.endDate);
    end.setHours(23, 59, 59, 999);

    const curr = new Date(start);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      pointsMap.set(key, {
        sales: 0,
        cogs: 0,
        ticketCount: 0,
        expenses: 0,
        date: new Date(curr),
      });
      curr.setDate(curr.getDate() + 1);
    }

    // Accumulate Sales
    sales.forEach((s) => {
      if (!s.date) return;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return;
      if (d < start || d > end) return;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;

      const existing = pointsMap.get(key);
      const cogs = s.items.reduce((acc, it) => acc + (it.unitCost || 0) * (it.quantity || 1), 0);

      if (existing) {
        existing.sales += s.totalAmount;
        existing.cogs += cogs;
        existing.ticketCount += 1;
      } else {
        pointsMap.set(key, {
          sales: s.totalAmount,
          cogs,
          ticketCount: 1,
          expenses: 0,
          date: new Date(d),
        });
      }
    });

    // Accumulate Expenses
    expenses.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return;
      if (d < start || d > end) return;

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;

      const existing = pointsMap.get(key);
      if (existing) {
        existing.expenses += e.amount;
      }
    });

    // Convert map into sorted array of DailyTrendPoints
    const rawPoints = Array.from(pointsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateStr, item]) => {
        const grossMarginAmount = item.sales - item.cogs;
        const grossMarginPct = item.sales > 0 ? Number(((grossMarginAmount / item.sales) * 100).toFixed(2)) : 0;
        const aov = item.ticketCount > 0 ? Math.round(item.sales / item.ticketCount) : 0;
        const ebitda = grossMarginAmount - item.expenses;

        const dayName = item.date.toLocaleDateString('es-CL', { weekday: 'short' });
        const shortLabel = item.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
        const fullDateLabel = item.date.toLocaleDateString('es-CL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        return {
          date: item.date,
          dateStr,
          shortLabel,
          fullDateLabel,
          dayName,
          sales: item.sales,
          cogs: item.cogs,
          grossMarginAmount,
          grossMarginPct,
          ticketCount: item.ticketCount,
          aov,
          expenses: item.expenses,
          ebitda,
        };
      });

    // Handle weekly grouping if requested
    if (granularity === 'weekly' && rawPoints.length > 14) {
      const weeklyPoints: DailyTrendPoint[] = [];
      const chunkSize = 7;
      for (let i = 0; i < rawPoints.length; i += chunkSize) {
        const chunk = rawPoints.slice(i, i + chunkSize);
        const totalSales = chunk.reduce((acc, p) => acc + p.sales, 0);
        const totalCogs = chunk.reduce((acc, p) => acc + p.cogs, 0);
        const totalTickets = chunk.reduce((acc, p) => acc + p.ticketCount, 0);
        const totalExpenses = chunk.reduce((acc, p) => acc + p.expenses, 0);
        const grossMarginAmount = totalSales - totalCogs;
        const grossMarginPct = totalSales > 0 ? Number(((grossMarginAmount / totalSales) * 100).toFixed(2)) : 0;
        const aov = totalTickets > 0 ? Math.round(totalSales / totalTickets) : 0;
        const ebitda = grossMarginAmount - totalExpenses;

        const first = chunk[0];
        const last = chunk[chunk.length - 1];

        weeklyPoints.push({
          date: first.date,
          dateStr: `${first.dateStr}_w`,
          shortLabel: `${first.date.getDate()} - ${last.shortLabel}`,
          fullDateLabel: `Semana: ${first.shortLabel} al ${last.shortLabel}`,
          dayName: 'Sem',
          sales: totalSales,
          cogs: totalCogs,
          grossMarginAmount,
          grossMarginPct,
          ticketCount: totalTickets,
          aov,
          expenses: totalExpenses,
          ebitda,
        });
      }
      return weeklyPoints;
    }

    return rawPoints;
  }, [sales, expenses, activeDateRange, granularity]);

  // Extract selected metric values
  const metricValues = useMemo(() => {
    return dailyData.map((d) => {
      switch (selectedMetric) {
        case 'sales':
          return d.sales;
        case 'margin':
          return d.grossMarginPct;
        case 'aov':
          return d.aov;
        case 'ebitda':
          return d.ebitda;
        case 'tickets':
          return d.ticketCount;
      }
    });
  }, [dailyData, selectedMetric]);

  // Calculate 7-period moving average
  const movingAverageValues = useMemo(() => {
    return metricValues.map((val, idx, arr) => {
      const windowSize = 5;
      const start = Math.max(0, idx - windowSize + 1);
      const slice = arr.slice(start, idx + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      return sum / slice.length;
    });
  }, [metricValues]);

  // Telemetry summaries
  const telemetry = useMemo(() => {
    if (metricValues.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0, peakIndex: 0, valleyIndex: 0, trendPct: 0 };
    }
    const total = metricValues.reduce((a, b) => a + b, 0);
    const avg = total / metricValues.length;
    let min = metricValues[0];
    let max = metricValues[0];
    let peakIndex = 0;
    let valleyIndex = 0;

    metricValues.forEach((val, i) => {
      if (val > max) {
        max = val;
        peakIndex = i;
      }
      if (val < min) {
        min = val;
        valleyIndex = i;
      }
    });

    // Trend comparison: first half vs second half
    const half = Math.floor(metricValues.length / 2);
    const firstHalfAvg = half > 0 ? metricValues.slice(0, half).reduce((a, b) => a + b, 0) / half : avg;
    const secondHalfAvg = half > 0 ? metricValues.slice(half).reduce((a, b) => a + b, 0) / (metricValues.length - half) : avg;
    const trendPct = firstHalfAvg > 0 ? Number((((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1)) : 0;

    return { min, max, avg, total, peakIndex, valleyIndex, trendPct };
  }, [metricValues]);

  // Chart Geometry & SVG Dimensioning
  const svgWidth = 840;
  const svgHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Min and Max scale bounds with comfortable headroom
  const yBounds = useMemo(() => {
    if (metricValues.length === 0) return { min: 0, max: 100 };
    let rawMax = Math.max(...metricValues, ...movingAverageValues);
    let rawMin = Math.min(...metricValues, ...movingAverageValues);

    if (selectedMetric === 'margin') {
      return {
        min: Math.max(0, Math.floor((rawMin - 5) / 5) * 5),
        max: Math.min(100, Math.ceil((rawMax + 5) / 5) * 5),
      };
    }

    if (selectedMetric === 'tickets') {
      return {
        min: 0,
        max: Math.max(5, Math.ceil(rawMax * 1.2)),
      };
    }

    // Currency metrics (sales, aov, ebitda)
    if (rawMin >= 0) {
      rawMin = 0;
    } else {
      rawMin = Math.floor(rawMin * 1.1);
    }
    rawMax = Math.max(1, rawMax * 1.15);

    return { min: rawMin, max: rawMax };
  }, [metricValues, movingAverageValues, selectedMetric]);

  const getYCoord = (val: number) => {
    const range = yBounds.max - yBounds.min || 1;
    const normalized = (val - yBounds.min) / range;
    return padding.top + plotHeight * (1 - normalized);
  };

  const getXCoord = (index: number) => {
    if (dailyData.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (dailyData.length - 1)) * plotWidth;
  };

  // Coordinates array for primary metric points
  const points = useMemo(() => {
    return metricValues.map((val, idx) => ({
      x: getXCoord(idx),
      y: getYCoord(val),
      val,
      data: dailyData[idx],
    }));
  }, [metricValues, dailyData, yBounds]);

  // Coordinates array for moving average
  const maPoints = useMemo(() => {
    return movingAverageValues.map((val, idx) => ({
      x: getXCoord(idx),
      y: getYCoord(val),
      val,
    }));
  }, [movingAverageValues, yBounds]);

  // Construct curved path
  const curvePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }, [points]);

  // Construct area fill path
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + plotHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${curvePath} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  }, [curvePath, points, plotHeight]);

  // Construct Moving Average Polyline
  const maPath = useMemo(() => {
    if (maPoints.length === 0) return '';
    return maPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  }, [maPoints]);

  // Y-Axis Ticks (4 ticks)
  const yTicks = useMemo(() => {
    const ticksCount = 4;
    const ticks: { val: number; y: number; label: string }[] = [];
    for (let i = 0; i < ticksCount; i++) {
      const ratio = i / (ticksCount - 1);
      const val = yBounds.min + ratio * (yBounds.max - yBounds.min);
      const y = padding.top + plotHeight * (1 - ratio);

      let label = '';
      if (selectedMetric === 'margin') {
        label = `${val.toFixed(0)}%`;
      } else if (selectedMetric === 'tickets') {
        label = `${Math.round(val)}`;
      } else {
        if (Math.abs(val) >= 1_000_000) {
          label = `$${(val / 1_000_000).toFixed(1)}M`;
        } else if (Math.abs(val) >= 1_000) {
          label = `$${Math.round(val / 1_000)}k`;
        } else {
          label = `$${Math.round(val)}`;
        }
      }

      ticks.push({ val, y, label });
    }
    return ticks;
  }, [yBounds, selectedMetric, plotHeight]);

  // X-Axis Ticks (sample dates without collision)
  const xTicks = useMemo(() => {
    if (dailyData.length === 0) return [];
    const maxTicks = 7;
    const step = Math.max(1, Math.ceil(dailyData.length / maxTicks));
    const ticks: { index: number; x: number; label: string }[] = [];

    for (let i = 0; i < dailyData.length; i += step) {
      ticks.push({
        index: i,
        x: getXCoord(i),
        label: dailyData[i].shortLabel,
      });
    }

    // Always ensure the last item is represented
    const lastIdx = dailyData.length - 1;
    if (ticks.length > 0 && ticks[ticks.length - 1].index !== lastIdx) {
      ticks.push({
        index: lastIdx,
        x: getXCoord(lastIdx),
        label: dailyData[lastIdx].shortLabel,
      });
    }

    return ticks;
  }, [dailyData]);

  // Active hovered point details
  const activeHoverPoint = hoveredPointIndex !== null && points[hoveredPointIndex] ? points[hoveredPointIndex] : null;

  const metricConfigs: Record<
    TrendMetricType,
    { label: string; unit: string; color: string; stroke: string; fillGradient: string }
  > = {
    sales: {
      label: 'Facturación ($)',
      unit: '$',
      color: 'text-blue-700',
      stroke: '#2563eb', // cobalt
      fillGradient: '#3b82f6',
    },
    margin: {
      label: 'Margen Bruto (%)',
      unit: '%',
      color: 'text-emerald-700',
      stroke: '#059669', // emerald
      fillGradient: '#10b981',
    },
    aov: {
      label: 'Ticket Promedio ($)',
      unit: '$',
      color: 'text-slate-800',
      stroke: '#475569', // slate
      fillGradient: '#64748b',
    },
    ebitda: {
      label: 'EBITDA Operativo ($)',
      unit: '$',
      color: 'text-indigo-700',
      stroke: '#4f46e5', // indigo
      fillGradient: '#6366f1',
    },
    tickets: {
      label: 'Transacciones (Tickets)',
      unit: 'tks',
      color: 'text-amber-700',
      stroke: '#d97706', // amber
      fillGradient: '#f59e0b',
    },
  };

  const activeConfig = metricConfigs[selectedMetric];

  const formatPointValue = (val: number, metric: TrendMetricType) => {
    if (metric === 'margin') return `${val.toFixed(2)}%`;
    if (metric === 'tickets') return `${Math.round(val)} tickets`;
    return formatCurrency(val);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Chart Header Bar: Metric Switcher & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center justify-center">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </span>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Curva de Tendencia Histórica del Período</span>
              <span className="text-[11px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                {activeDateRange.formattedLabel}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Evolución diaria y velocidad de retorno sobre la operación comercial auditada en el rango seleccionado.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { key: 'sales' as const, label: 'Ventas ($)', icon: DollarSign },
              { key: 'margin' as const, label: 'Margen (%)', icon: Percent },
              { key: 'aov' as const, label: 'AOV ($)', icon: Receipt },
              { key: 'ebitda' as const, label: 'EBITDA ($)', icon: Layers },
              { key: 'tickets' as const, label: 'Tickets', icon: Activity },
            ]
          ).map((m) => {
            const isSelected = selectedMetric === m.key;
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setSelectedMetric(m.key);
                  setHoveredPointIndex(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}

          {/* Granularity & Moving Average Controls */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              title="Mostrar o esconder la línea de Media Móvil para identificar la tendencia central"
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                showMovingAverage
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Media Móvil
            </button>

            {dailyData.length >= 14 && (
              <button
                type="button"
                onClick={() => setGranularity(granularity === 'daily' ? 'weekly' : 'daily')}
                className="px-2 py-1 rounded text-[11px] font-mono bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                {granularity === 'daily' ? 'Diario' : 'Semanal'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Strip: Key Benchmark Figures */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
            Promedio {granularity === 'daily' ? 'Diario' : 'Semanal'}
          </span>
          <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
            {formatPointValue(telemetry.avg, selectedMetric)}
          </span>
        </div>

        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Día Pico Máximo
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              Máx
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
              {formatPointValue(telemetry.max, selectedMetric)}
            </span>
            {dailyData[telemetry.peakIndex] && (
              <span className="text-[10px] text-slate-500 font-mono truncate">
                {dailyData[telemetry.peakIndex].shortLabel}
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Día Mínimo
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center">
              <ArrowDownRight className="w-3 h-3 text-slate-400" />
              Mín
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-0.5">
            <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
              {formatPointValue(telemetry.min, selectedMetric)}
            </span>
            {dailyData[telemetry.valleyIndex] && (
              <span className="text-[10px] text-slate-500 font-mono truncate">
                {dailyData[telemetry.valleyIndex].shortLabel}
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
            Dirección del Período
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                telemetry.trendPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {telemetry.trendPct >= 0 ? '+' : ''}
              {telemetry.trendPct}%
            </span>
            <span className="text-[10px] text-slate-400">
              {telemetry.trendPct >= 0 ? 'Expansión 2ª mitad' : 'Desaceleración'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Trend Line Chart Container */}
      <div className="relative bg-white rounded-lg border border-slate-100 p-2 select-none overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 overflow-visible"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <defs>
            {/* Linear Area Gradient */}
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeConfig.fillGradient} stopOpacity="0.28" />
              <stop offset="100%" stopColor={activeConfig.fillGradient} stopOpacity="0.01" />
            </linearGradient>

            {/* Drop shadow for active dot */}
            <filter id="dotShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={svgWidth - padding.right}
                y2={t.y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={t.y + 3.5}
                textAnchor="end"
                className="text-[10px] font-mono fill-slate-400"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#trendGradient)" className="transition-all duration-300" />
          )}

          {/* Moving Average Line (Secondary) */}
          {showMovingAverage && maPath && (
            <path
              d={maPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              strokeLinecap="round"
              className="opacity-70"
            />
          )}

          {/* Primary Metric Line */}
          {curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke={activeConfig.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-200"
            />
          )}

          {/* Peak and Valley Annotation Markers */}
          {points.length > 2 && (
            <>
              {/* Peak Marker */}
              {points[telemetry.peakIndex] && (
                <g transform={`translate(${points[telemetry.peakIndex].x}, ${points[telemetry.peakIndex].y})`}>
                  <circle r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" filter="url(#dotShadow)" />
                </g>
              )}
            </>
          )}

          {/* X-Axis Ticks & Labels */}
          {xTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x}
                y1={padding.top + plotHeight}
                x2={t.x}
                y2={padding.top + plotHeight + 4}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x={t.x}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-400"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Interactive Hover Guides & Slices */}
          {points.map((p, idx) => {
            const sliceWidth = plotWidth / points.length;
            const isHovered = hoveredPointIndex === idx;

            return (
              <g key={idx}>
                {/* Invisible hover hitbox */}
                <rect
                  x={p.x - sliceWidth / 2}
                  y={padding.top}
                  width={sliceWidth}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                />

                {/* Vertical Crosshair Line */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={padding.top}
                    x2={p.x}
                    y2={padding.top + plotHeight}
                    stroke="#64748b"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}

                {/* Highlight Dot */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5.5"
                    fill={activeConfig.stroke}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    filter="url(#dotShadow)"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {activeHoverPoint && (
          <div
            className="absolute top-3 pointer-events-none z-30 bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-lg shadow-xl border border-slate-800 text-xs transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(16, (activeHoverPoint.x / svgWidth) * 100 - 15),
                70
              )}%`,
            }}
          >
            <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] font-mono border-b border-slate-800 pb-1 mb-1.5">
              <span className="capitalize">{activeHoverPoint.data.fullDateLabel}</span>
              <span className="text-slate-500">{activeHoverPoint.data.dayName}</span>
            </div>

            <div className="flex items-baseline justify-between gap-4 font-mono">
              <span className="text-slate-300">{activeConfig.label}:</span>
              <span className="font-bold text-sm text-white tabular-nums">
                {formatPointValue(activeHoverPoint.val, selectedMetric)}
              </span>
            </div>

            {/* Contextual Metric Details */}
            <div className="mt-1 pt-1 border-t border-slate-800/80 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-400 font-mono">
              <div>
                <span>Ventas: </span>
                <span className="text-slate-200">{formatCurrency(activeHoverPoint.data.sales)}</span>
              </div>
              <div>
                <span>Margen: </span>
                <span className="text-slate-200">{activeHoverPoint.data.grossMarginPct}%</span>
              </div>
              <div>
                <span>Tickets: </span>
                <span className="text-slate-200">{activeHoverPoint.data.ticketCount} u</span>
              </div>
              <div>
                <span>Ticket Prom.: </span>
                <span className="text-slate-200">{formatCurrency(activeHoverPoint.data.aov)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend / Guide */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-500 pt-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-1 rounded-full"
              style={{ backgroundColor: activeConfig.stroke }}
            />
            <span className="font-medium text-slate-700">{activeConfig.label}</span>
          </div>

          {showMovingAverage && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b border-dashed border-slate-400" />
              <span>Media Móvil (Tendencia Base)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pico Máximo</span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-slate-400">
          {dailyData.length} intervalos cronológicos analizados · Desliza sobre la curva para auditar
        </span>
      </div>
    </div>
  );
};
