import React, { useState } from 'react';
import { Clock, Flame, Users, DollarSign, Calendar } from 'lucide-react';
import { useBI } from '../context/BIContext';
import { HeatmapCell } from '../types/bi';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' },
];

export const Heatmap7x24: React.FC = () => {
  const { heatmap } = useBI();
  const [metric, setMetric] = useState<'sales' | 'tickets'>('sales');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const { cells, maxSales, maxTickets } = heatmap;

  // Find max value depending on active metric
  const maxValue = metric === 'sales' ? maxSales : maxTickets;

  // Build cell lookup map
  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach((c) => {
    cellMap.set(`${c.dayOfWeek}-${c.hour}`, c);
  });

  // Calculate cell intensity (0 to 1)
  const getIntensity = (val: number) => {
    if (maxValue <= 0 || val <= 0) return 0;
    return Math.min(1, val / maxValue);
  };

  // Color mapping Nordic cobalt
  const getCellColor = (intensity: number, isPeak: boolean) => {
    if (intensity === 0) return 'bg-slate-50 border-slate-100 text-slate-300';
    if (intensity < 0.25) return 'bg-blue-50 border-blue-100 text-blue-900';
    if (intensity < 0.5) return 'bg-blue-100 border-blue-200 text-blue-900 font-medium';
    if (intensity < 0.75) return 'bg-blue-300 border-blue-400 text-blue-950 font-semibold';
    if (isPeak) return 'bg-blue-700 border-blue-800 text-white font-bold ring-1 ring-blue-500';
    return 'bg-blue-600 border-blue-700 text-white font-semibold';
  };

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  // Identify golden operational windows
  const peakWindows = [
    { window: 'Sábados 11:00 - 14:00', type: 'Pico Comercial Máximo', desc: 'Concentración de compra mensual de alimentos y sacos' },
    { window: 'Lun - Vie 17:30 - 20:00', type: 'Flujo Retorno Oficinas', desc: 'Venta rápida de antipulgas, snacks y granel' },
    { window: 'Domingos 10:30 - 13:00', type: 'Paseo & Mascotas', desc: 'Compra de accesorios, juguetes y arenas sanitarias' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Mapa de Calor Horario (7x24)</span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
              Afluencia & Patrones de Venta
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Densidad transaccional horaria para optimizar dotación de personal y turnos de caja
          </p>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMetric('sales')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              metric === 'sales'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>Ingresos ($)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('tickets')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              metric === 'tickets'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Tickets (Afluencia)</span>
          </button>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          {/* Hour Headers (00 to 23) */}
          <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-1 text-[10px] font-mono text-slate-400">
            <div className="text-left font-sans text-slate-500 font-medium">Día / Hora</div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-center">
                {h.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* 7 Days Rows */}
          <div className="space-y-1">
            {DAYS.map((day) => (
              <div key={day.id} className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 items-center">
                <span className="text-xs font-medium text-slate-700 truncate pr-2">
                  {day.name}
                </span>

                {Array.from({ length: 24 }).map((_, hour) => {
                  const key = `${day.id}-${hour}`;
                  const cell = cellMap.get(key) || {
                    dayOfWeek: day.id,
                    dayName: day.name,
                    hour,
                    salesAmount: 0,
                    ticketCount: 0,
                    isPeak: false,
                  };

                  const val = metric === 'sales' ? cell.salesAmount : cell.ticketCount;
                  const intensity = getIntensity(val);
                  const colorClass = getCellColor(intensity, cell.isPeak);

                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-7 rounded-sm border flex items-center justify-center text-[10px] font-mono transition-all cursor-pointer hover:scale-110 hover:z-20 ${colorClass}`}
                      title={`${day.name} ${hour}:00 hrs: ${formatCurrency(cell.salesAmount)} (${cell.ticketCount} tickets)`}
                    >
                      {val > 0 ? (metric === 'sales' ? Math.round(val / 1000) + 'k' : val) : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Inspection / Active Golden Hour Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Detalle Celda Seleccionada</span>
          </div>
          {hoveredCell ? (
            <div className="space-y-1 text-slate-600">
              <p>
                <strong>{hoveredCell.dayName} a las {hoveredCell.hour}:00 hrs</strong>
              </p>
              <p className="font-mono text-slate-900">
                Facturación: <strong>{formatCurrency(hoveredCell.salesAmount)}</strong>
              </p>
              <p className="font-mono text-slate-900">
                Afluencia: <strong>{hoveredCell.ticketCount} órdenes</strong> (AOV: {formatCurrency(hoveredCell.salesAmount / Math.max(1, hoveredCell.ticketCount))})
              </p>
              {hoveredCell.isPeak && (
                <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded mt-1">
                  Franja de Alta Densidad
                </span>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic">Pasa el cursor sobre cualquier casilla para auditar la franja horaria.</p>
          )}
        </div>

        {/* Franjas de Oro Comercial */}
        <div className="md:col-span-2 p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-blue-950 mb-2">
            <Flame className="w-4 h-4 text-blue-700" />
            <span>Franjas de Oro Comercial (Directrices de Personal)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {peakWindows.map((pw, i) => (
              <div key={i} className="bg-white p-2 rounded border border-blue-100 text-[11px]">
                <strong className="text-blue-900 block font-semibold">{pw.window}</strong>
                <span className="text-blue-700 font-medium block">{pw.type}</span>
                <span className="text-slate-500 block mt-0.5 leading-snug">{pw.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
