import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Zap, Target, Search, PackageCheck } from 'lucide-react';
import { useBI } from '../context/BIContext';
import { AssociationRule } from '../types/bi';

export const MarketBasketAnalysis: React.FC = () => {
  const { associationRules, sales } = useBI();
  const [filterQuery, setFilterQuery] = useState('');

  const multiItemSalesCount = sales.filter((s) => s.items && s.items.length > 1).length;
  const multiItemRatioPct = sales.length > 0 ? ((multiItemSalesCount / sales.length) * 100).toFixed(1) : '0';

  const filteredRules = associationRules.filter((r) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      r.itemA.toLowerCase().includes(q) ||
      r.itemB.toLowerCase().includes(q) ||
      r.skuA.toLowerCase().includes(q) ||
      r.skuB.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Análisis de Venta Cruzada (Market Basket)</span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
              Afinidad de Compra
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección de co-ocurrencia transaccional, soporte, confianza y lift para estrategias de bundling
          </p>
        </div>

        {/* Global Multi-item metric & Search */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-mono">
            <span>Tickets Compuestos:</span>
            <strong className="text-slate-900 font-semibold">{multiItemRatioPct}%</strong>
            <span className="text-slate-400">({multiItemSalesCount} de {sales.length})</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar producto..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Featured Strategic Bundles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {associationRules.slice(0, 3).map((rule, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-700" />
                  Pack Recomendado #{idx + 1}
                </span>
                <span className="font-mono text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                  Lift: {rule.lift}x
                </span>
              </div>

              <div className="space-y-1 my-2">
                <div className="text-xs font-semibold text-slate-900 truncate" title={rule.itemA}>
                  {rule.itemA}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <ArrowRight className="w-3 h-3 text-blue-600" /> Co-ocurre habitualmente con:
                </div>
                <div className="text-xs font-semibold text-blue-800 truncate" title={rule.itemB}>
                  {rule.itemB}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>Confianza: <strong className="font-mono text-slate-900">{rule.confidencePct}%</strong></span>
              <span>En <strong className="font-mono text-slate-900">{rule.coOccurrenceCount}</strong> tickets</span>
            </div>
          </div>
        ))}
      </div>

      {/* Association Rules Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Producto Primario (A)</th>
              <th className="py-2.5 px-3">Producto Asociado (B)</th>
              <th className="py-2.5 px-3 text-center">Frecuencia</th>
              <th className="py-2.5 px-3 text-right">Soporte</th>
              <th className="py-2.5 px-3 text-right">Confianza</th>
              <th className="py-2.5 px-3 text-right">Lift</th>
              <th className="py-2.5 px-3">Acción Estratégica en Tienda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRules.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-900">
                  <span className="block truncate max-w-[200px]" title={r.itemA}>{r.itemA}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{r.skuA}</span>
                </td>
                <td className="py-2.5 px-3 font-medium text-blue-900">
                  <span className="block truncate max-w-[200px]" title={r.itemB}>{r.itemB}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{r.skuB}</span>
                </td>
                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-900">
                  {r.coOccurrenceCount}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                  {r.supportPct}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-700">
                  {r.confidencePct}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {r.lift}x
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-tight">
                  {r.strategicAction}
                </td>
              </tr>
            ))}
            {filteredRules.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No se encontraron reglas de asociación coincidentes con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
