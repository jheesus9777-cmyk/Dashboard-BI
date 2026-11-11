import React from 'react';
import {
  Scale,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useBI } from '../context/BIContext';

export const GranelVsSaco: React.FC = () => {
  const { granelVsSaco } = useBI();
  const { granel, saco, marginDeltaPct, shrinkageTotalCost, shrinkageKg, shrinkageRatePct, shrinkageBreakdown } = granelVsSaco;

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Rendimiento Granel vs. Saco Cerrado & Tasa de Mermas</span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
              Eficiencia Operativa
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diferencial de margen por fraccionamiento y auditoría de pérdidas en el inventario Kardex
          </p>
        </div>

        {/* Delta Callout */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
          <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          <span>Delta Margen Granel: <strong className="font-mono font-bold">+{marginDeltaPct}%</strong></span>
        </div>
      </div>

      {/* Comparison Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Granel (Venta Fraccionada) */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-700" />
                Venta a Granel (Tolvas Fraccionadas)
              </span>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Margen {granel.marginPct}%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Alimento pesado por kilo al cliente. Mayor retorno por kilo a cambio de gestión de merma en báscula.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-100 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Facturación</span>
              <strong className="font-mono text-slate-950 font-bold block">{formatCurrency(granel.revenue)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Kilos Vendidos</span>
              <strong className="font-mono text-slate-950 font-bold block">{granel.unitsKg} kg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Precio Prom./Kg</span>
              <strong className="font-mono text-blue-700 font-bold block">{formatCurrency(granel.avgPricePerKg)}</strong>
            </div>
          </div>
        </div>

        {/* Saco Cerrado (Bolsas de Fábrica) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-600" />
                Saco Cerrado Sellado (15kg / 20kg)
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                Margen {saco.marginPct}%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Venta de empaque original completo. Menor margen porcentual, pero cero merma por manipulación y alto ticket.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Facturación</span>
              <strong className="font-mono text-slate-950 font-bold block">{formatCurrency(saco.revenue)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Sacos Vendidos</span>
              <strong className="font-mono text-slate-950 font-bold block">{saco.unitsSacos} sacos</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Ticket Prom./Saco</span>
              <strong className="font-mono text-slate-950 font-bold block">{formatCurrency(saco.avgPricePerUnit)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Shrinkage (Mermas) Section */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950">
                Auditoría de Mermas & Pérdidas de Inventario (Kardex)
              </h3>
              <p className="text-[11px] text-slate-600">
                Tasa de merma actual s/ costo de granel: <strong className="font-mono text-amber-900">{shrinkageRatePct}%</strong> (Objetivo directivo &le; 2.5%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span>Pérdida Financiera: <strong className="text-amber-900 font-bold">{formatCurrency(shrinkageTotalCost)}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Masa Perdida: <strong className="text-amber-900 font-bold">{shrinkageKg} kg/u</strong></span>
          </div>
        </div>

        {/* Reasons breakdown list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
          {shrinkageBreakdown.map((item, idx) => (
            <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-200/80 text-xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                <span>{item.pct}% de la merma</span>
                <span className="font-mono">{item.quantity} kg</span>
              </div>
              <strong className="text-slate-900 font-semibold block truncate" title={item.reason}>
                {item.reason}
              </strong>
              <span className="text-xs font-mono font-bold text-amber-800 block mt-0.5">
                {formatCurrency(item.cost)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
