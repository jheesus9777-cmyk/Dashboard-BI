import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  Package,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Eye,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useBI } from '../context/BIContext';
import { CoverageStatus, StockCoverageMetric } from '../types/bi';

export const StockCoverageRunway: React.FC = () => {
  const { stockCoverage, setSelectedProductId, activeDateRange } = useBI();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'reorder' | 'healthy' | 'overstock'>('all');

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  // Status Counts
  const criticalCount = stockCoverage.filter((m) => m.status === 'critical_stockout').length;
  const reorderCount = stockCoverage.filter((m) => m.status === 'reorder_point').length;
  const healthyCount = stockCoverage.filter((m) => m.status === 'healthy').length;
  const overstockCount = stockCoverage.filter((m) => m.status === 'overstock').length;

  const totalCapitalNeeded = stockCoverage
    .filter((m) => m.status === 'critical_stockout' || m.status === 'reorder_point')
    .reduce((acc, m) => acc + m.capitalNeeded, 0);

  const totalDailyLossRisk = stockCoverage
    .filter((m) => m.status === 'critical_stockout')
    .reduce((acc, m) => acc + m.riskDailyRevenueLoss, 0);

  // Filtered List
  const filteredMetrics = stockCoverage.filter((m) => {
    if (statusFilter === 'critical' && m.status !== 'critical_stockout') return false;
    if (statusFilter === 'reorder' && m.status !== 'reorder_point') return false;
    if (statusFilter === 'healthy' && m.status !== 'healthy') return false;
    if (statusFilter === 'overstock' && m.status !== 'overstock') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.productName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: CoverageStatus, days: number) => {
    switch (status) {
      case 'critical_stockout':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Quiebre Inminente ({days}d)</span>
          </span>
        );
      case 'reorder_point':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Punto Reorden ({days}d)</span>
          </span>
        );
      case 'overstock':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Sobre-stock ({days > 180 ? '>180' : days}d)</span>
          </span>
        );
      case 'healthy':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Saludable ({days}d)</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-slate-950">
                Días de Cobertura (Runway) & Alerta de Quiebres
              </h2>
              <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {activeDateRange.daysCount} días auditados
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Proyección de quiebres según velocidad diaria de venta para garantizar reposición oportuna de stock
            </p>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Capital Reposición:</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatCurrency(totalCapitalNeeded)}
            </span>
          </div>
          {totalDailyLossRisk > 0 && (
            <div className="text-right pl-3 border-l border-slate-200">
              <span className="text-rose-500 block text-[10px]">Riesgo Fuga Diario:</span>
              <span className="font-semibold text-rose-700 tabular-nums">
                -{formatCurrency(totalDailyLossRisk)}/día
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'critical'
              ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300'
              : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-700 font-medium mb-1">
            <span>Quiebre Inminente</span>
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {criticalCount} <span className="text-xs font-normal text-slate-400 font-sans">SKUs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Menos de 4 días de stock</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'reorder' ? 'all' : 'reorder')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'reorder'
              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
              : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-medium mb-1">
            <span>Punto Reorden</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {reorderCount} <span className="text-xs font-normal text-slate-400 font-sans">SKUs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">4 a 10 días o bajo mínimo</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'healthy'
              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium mb-1">
            <span>Cobertura Óptima</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {healthyCount} <span className="text-xs font-normal text-slate-400 font-sans">SKUs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">11 a 45 días de stock</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'overstock' ? 'all' : 'overstock')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'overstock'
              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
              : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-blue-700 font-medium mb-1">
            <span>Sobre-stock</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {overstockCount} <span className="text-xs font-normal text-slate-400 font-sans">SKUs</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Más de 45 días de stock</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({stockCoverage.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('critical')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              statusFilter === 'critical'
                ? 'bg-rose-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quiebres ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('reorder')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              statusFilter === 'reorder'
                ? 'bg-amber-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Reorden ({reorderCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('overstock')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              statusFilter === 'overstock'
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sobre-stock ({overstockCount})
          </button>
        </div>
      </div>

      {/* Runway Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs divide-y divide-slate-200">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 tracking-wider uppercase font-mono">
            <tr>
              <th className="py-2.5 px-3">Producto / SKU</th>
              <th className="py-2.5 px-3">Stock Físico</th>
              <th className="py-2.5 px-3">Velocidad Venta</th>
              <th className="py-2.5 px-3">Días Cobertura</th>
              <th className="py-2.5 px-3">Estado Directivo</th>
              <th className="py-2.5 px-3 text-right">Reposición Sugerida</th>
              <th className="py-2.5 px-3 text-center">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredMetrics.map((item) => {
              const coverageWidth = Math.min(100, Math.max(5, (item.daysOfCoverage / 45) * 100));

              return (
                <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(item.productId)}
                      className="font-medium text-slate-900 hover:text-blue-700 text-left block line-clamp-1"
                    >
                      {item.productName}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.sku} · {item.category}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                    <strong>{item.stock}</strong>{' '}
                    <span className="text-slate-400 text-[10px]">
                      {item.formatType === 'granel' ? 'kg' : 'u'} (Mín: {item.minStock})
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                    {item.dailyVelocity} {item.formatType === 'granel' ? 'kg/día' : 'u/día'}
                  </td>

                  <td className="py-2.5 px-3 w-44">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                        <span className="font-bold text-slate-900">
                          {item.daysOfCoverage > 180 ? '>180 días' : `${item.daysOfCoverage} días`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'critical_stockout'
                              ? 'bg-rose-500'
                              : item.status === 'reorder_point'
                              ? 'bg-amber-500'
                              : item.status === 'overstock'
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${coverageWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getStatusBadge(item.status, item.daysOfCoverage)}
                  </td>

                  <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                    {item.reorderUnitsNeeded > 0 ? (
                      <div>
                        <span className="font-semibold text-slate-900">
                          +{item.reorderUnitsNeeded} {item.formatType === 'granel' ? 'kg' : 'u'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({formatCurrency(item.capitalNeeded)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">Stock cubierto</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedProductId(item.productId)}
                      title="Abrir Ficha Ejecutiva 360°"
                      className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      aria-label="Ver ficha del producto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
