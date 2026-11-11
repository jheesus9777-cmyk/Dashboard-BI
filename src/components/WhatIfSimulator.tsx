import React from 'react';
import {
  Sliders,
  TrendingUp,
  RotateCcw,
  Sparkles,
  DollarSign,
  Scale,
  Percent,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';
import { useBI } from '../context/BIContext';

export const WhatIfSimulator: React.FC = () => {
  const {
    whatIfSimulation,
    setWhatIfSimulation,
    resetWhatIfSimulation,
    whatIfResult,
    kpis,
    granelVsSaco,
  } = useBI();

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  const hasAdjustments =
    whatIfSimulation.bulkPriceChangePct !== 0 ||
    whatIfSimulation.shrinkageReductionPct !== 0 ||
    whatIfSimulation.supplierDiscountPct !== 0 ||
    whatIfSimulation.crossSellingAovIncreasePct !== 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
            <Sliders className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-slate-950">
                Simulador Directivo de Escenarios (What-If)
              </h2>
              <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% Reactivo Local
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Laboratorio interactivo para proyectar el impacto en EBITDA y margen bruto anual ante decisiones de precio y mermas
            </p>
          </div>
        </div>

        {hasAdjustments && (
          <button
            type="button"
            onClick={resetWhatIfSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer Escenario Base</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: 4 Executive Strategic Levers (Sliders) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Palancas Estratégicas de Decisión
          </h3>

          {/* Lever 1: Granel Price Change */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                Ajuste de Precio en Alimentos a Granel
              </span>
              <span className="font-mono font-bold text-blue-700 tabular-nums">
                {whatIfSimulation.bulkPriceChangePct >= 0 ? '+' : ''}
                {whatIfSimulation.bulkPriceChangePct}%
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="15"
              step="1"
              value={whatIfSimulation.bulkPriceChangePct}
              onChange={(e) => setWhatIfSimulation({ bulkPriceChangePct: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>-5% (Deflación)</span>
              <span>0% (Base actual)</span>
              <span>+15% (Premium)</span>
            </div>
          </div>

          {/* Lever 2: Shrinkage Reduction */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                Reducción de Mermas en Almacén y Tolvas
              </span>
              <span className="font-mono font-bold text-amber-700 tabular-nums">
                -{whatIfSimulation.shrinkageReductionPct}% merma
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={whatIfSimulation.shrinkageReductionPct}
              onChange={(e) => setWhatIfSimulation({ shrinkageReductionPct: Number(e.target.value) })}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0% (Merma actual 9.92%)</span>
              <span>-40% (Meta intermedia)</span>
              <span>-80% (Cero mermas)</span>
            </div>
          </div>

          {/* Lever 3: Supplier Discount Negotiation */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Descuento Negociado en Costo de Mercadería (COGS)
              </span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                +{whatIfSimulation.supplierDiscountPct}% ahorro
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={whatIfSimulation.supplierDiscountPct}
              onChange={(e) => setWhatIfSimulation({ supplierDiscountPct: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0% (Costo actual)</span>
              <span>+3% (Descuento volumen)</span>
              <span>+8% (Alianza estratégica)</span>
            </div>
          </div>

          {/* Lever 4: Cross-Selling Lift in AOV */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                Incremento de Ticket Promedio (AOV) por Venta Cruzada
              </span>
              <span className="font-mono font-bold text-purple-700 tabular-nums">
                +{whatIfSimulation.crossSellingAovIncreasePct}% AOV
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={whatIfSimulation.crossSellingAovIncreasePct}
              onChange={(e) => setWhatIfSimulation({ crossSellingAovIncreasePct: Number(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0% (Sin venta sugerida)</span>
              <span>+5% (Sugerencia en caja)</span>
              <span>+12% (Bundling agresivo)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Projections & Impact Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Impacto Anual Proyectado en Resultados
            </h3>

            {/* Main Result Card: Incremental EBITDA */}
            <div className="p-4 bg-linear-to-br from-blue-700 to-blue-900 text-white rounded-xl shadow-xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs text-blue-200 font-medium">
                <span>Ganancia Neta Adicional Estimada</span>
                <span className="bg-blue-600/60 px-2 py-0.5 rounded text-[11px] font-mono">
                  +{whatIfResult.marginIncreasePct}% sobre base
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums flex items-baseline gap-1.5">
                <span>+{formatCurrency(whatIfResult.marginIncreaseAmount)}</span>
                <span className="text-xs font-medium text-blue-200">/ año</span>
              </div>
              <p className="text-[11px] text-blue-200 leading-snug">
                Flujo de caja libre directo derivado de la combinación de precios, control de mermas y eficiencia en compras.
              </p>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  Margen Bruto Anual
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums block">
                  {formatCurrency(whatIfResult.projectedAnnualGrossMargin)}
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Base: {formatCurrency(whatIfResult.baseAnnualGrossMargin)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  EBITDA Operativo Anual
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums block">
                  {formatCurrency(whatIfResult.projectedAnnualEbitda)}
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Base: {formatCurrency(whatIfResult.baseAnnualEbitda)}
                </span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span>· Desvío precio granel:</span>
                <strong className="font-mono text-slate-900 tabular-nums">
                  +{formatCurrency(whatIfResult.bulkRevenueGain)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>· Mermas recuperadas:</span>
                <strong className="font-mono text-slate-900 tabular-nums">
                  +{formatCurrency(whatIfResult.shrinkageRecoveredAmount)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>· Ahorro proveedores:</span>
                <strong className="font-mono text-slate-900 tabular-nums">
                  +{formatCurrency(whatIfResult.costSavingsAmount)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>· Venta cruzada sugerida:</span>
                <strong className="font-mono text-slate-900 tabular-nums">
                  +{formatCurrency(whatIfResult.basketAovGain)}
                </strong>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/60 text-[11px] text-blue-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Simulación directiva confidencial · Cero impacto en Firestore.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
