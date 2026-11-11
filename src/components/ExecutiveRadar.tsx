import React from 'react';
import {
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useBI } from '../context/BIContext';

export const ExecutiveRadar: React.FC = () => {
  const { executiveInsights, setSelectedProductId } = useBI();

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  const risks = executiveInsights.filter((i) => i.type === 'risk');
  const opportunities = executiveInsights.filter((i) => i.type === 'opportunity');

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-slate-950">
                Radar de Alertas Directivas & Detección de Anomalías
              </h2>
              <span className="text-[11px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Diagnóstico Automático
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Auditoría en tiempo real sobre riesgos de merma, quiebres de stock y oportunidades de margen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{risks.length} Riesgos Críticos</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            <span>{opportunities.length} Oportunidades</span>
          </span>
        </div>
      </div>

      {/* Grid of Actionable Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {executiveInsights.map((insight) => {
          const isRisk = insight.type === 'risk';
          const isCritical = insight.severity === 'critical';

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isRisk
                  ? isCritical
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <div>
                {/* Top Row: Type, Category and Metric Label */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {isRisk ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>RIESGO AUDITADO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>OPORTUNIDAD DE RETORNO</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    {insight.metricLabel}: <strong className="text-slate-900">{insight.metricValue}</strong>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-slate-950 mb-1.5">
                  {insight.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {insight.description}
                </p>
              </div>

              {/* Action and Financial Impact */}
              <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Acción:</span>
                  <span className="text-[11px] font-medium text-slate-800 line-clamp-2">
                    {insight.recommendedAction}
                  </span>
                </div>

                {insight.financialImpact > 0 && (
                  <div className="shrink-0 font-mono text-[11px] font-semibold text-right">
                    <span className="text-slate-400 font-normal">Impacto: </span>
                    <span className={isRisk ? 'text-rose-700' : 'text-emerald-700'}>
                      {isRisk ? '-' : '+'}{formatCurrency(insight.financialImpact)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
