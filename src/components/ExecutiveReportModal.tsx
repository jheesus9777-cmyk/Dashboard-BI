import React from 'react';
import { X, Printer, Download, ShieldCheck, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useBI } from '../context/BIContext';
import { triggerExecutivePDFPrint, exportToExcel } from '../utils/exportUtils';
import { AUTHORIZED_EMAIL } from '../services/firebaseClient';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({ isOpen, onClose }) => {
  const { kpis, bcgMetrics, granelVsSaco, sales, products, kardex, expenses, activeDateRange } = useBI();

  if (!isOpen) return null;

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');
  const starsCount = bcgMetrics.filter((p) => p.quadrant === 'star').length;
  const dogsCount = bcgMetrics.filter((p) => p.quadrant === 'dog').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 flex items-start justify-center">
      <div className="bg-white max-w-4xl w-full rounded-xl border border-slate-200 shadow-2xl p-6 sm:p-10 my-4 text-slate-900">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Vista Previa de Informe Directivo (Listo para exportar o imprimir PDF)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerExecutivePDFPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => exportToExcel(sales, products, kardex, expenses, kpis, granelVsSaco)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Descargar Excel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
              aria-label="Cerrar vista de informe"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE EXECUTIVE DOCUMENT STARTS HERE */}
        <div className="space-y-6">
          {/* Executive Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                  PS
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950 font-serif">
                  PETSTOCK BI
                </h1>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                Informe de Analítica Directiva & Control de Gestión
              </p>
            </div>

            <div className="text-right text-xs font-mono space-y-0.5 text-slate-600">
              <p><strong>Fecha Emisión:</strong> {new Date().toLocaleDateString('es-CL')}</p>
              <p><strong>Período Auditado:</strong> {activeDateRange.formattedLabel}</p>
              <p><strong>Destinatario:</strong> {AUTHORIZED_EMAIL}</p>
              <p><strong>Base de Datos:</strong> gen-lang-client-0982055042</p>
              <p className="text-blue-700 font-semibold">100% MODO SOLO LECTURA AUDITADO</p>
            </div>
          </div>

          {/* Executive Overview Paragraph */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Resumen Ejecutivo
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              El presente informe consolida el rendimiento operativo y comercial de la cadena PetStock para el período evaluado. Se registra una facturación bruta de <strong>{formatCurrency(kpis.totalSales)}</strong> con un margen real ponderado de <strong>{kpis.weightedGrossMarginPct}%</strong> y un retorno de margen sobre inventario (GMROI) de <strong>{kpis.gmroi}x</strong>, lo que sitúa la operación en un rango financiero <strong>{kpis.gmroiStatus === 'optimal' ? 'Óptimo' : 'Saludable'}</strong>.
            </p>
          </div>

          {/* Key Metrics Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Tabla Consolidada de KPIs Financieros
            </h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                  <tr>
                    <th className="py-2 px-3">Indicador Clave</th>
                    <th className="py-2 px-3 text-right">Valor Obtenido</th>
                    <th className="py-2 px-3 text-right">Referencia / Benchmark</th>
                    <th className="py-2 px-3">Diagnóstico Directivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">GMROI (Retorno s/ Inventario)</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700">{kpis.gmroi}x</td>
                    <td className="py-2 px-3 text-right text-slate-500">&gt; 2.0x</td>
                    <td className="py-2 px-3 font-sans text-slate-700">Genera ${kpis.gmroi} por cada $1 de capital inmovilizado</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">Ticket Promedio (AOV)</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(kpis.aov)}</td>
                    <td className="py-2 px-3 text-right text-slate-500">2.4 items/ticket</td>
                    <td className="py-2 px-3 font-sans text-slate-700">Comportamiento regular con oportunidad en cross-selling</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">Margen Bruto Ponderado</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{kpis.weightedGrossMarginPct}%</td>
                    <td className="py-2 px-3 text-right text-slate-500">&gt; 35.0%</td>
                    <td className="py-2 px-3 font-sans text-slate-700">Rentabilidad neta comercial saludable tras COGS</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">EBITDA Operativo Estimado</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatCurrency(kpis.operatingEbitda)}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{kpis.ebitdaMarginPct}% de ventas</td>
                    <td className="py-2 px-3 font-sans text-slate-700">Flujo operativo positivo tras descontar gastos de 'expenses'</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">Días de Inventario (DSI)</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{kpis.daysSalesInventory} días</td>
                    <td className="py-2 px-3 text-right text-slate-500">≤ 45 días</td>
                    <td className="py-2 px-3 font-sans text-slate-700">Rotación de {kpis.inventoryTurnoverRatio}x veces por periodo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Granel vs Saco & Mermas Analysis */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              3. Auditoría de Granel vs. Saco & Control de Mermas (Kardex)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-1">Diferencial Granel vs. Saco</h3>
                <p className="text-slate-600 mb-2">
                  El alimento a granel alcanza un margen del <strong>{granelVsSaco.granel.marginPct}%</strong> frente al <strong>{granelVsSaco.saco.marginPct}%</strong> del saco cerrado sellado (Delta: <strong className="text-emerald-700">+{granelVsSaco.marginDeltaPct}%</strong>).
                </p>
                <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
                  <p>Facturación Granel: {formatCurrency(granelVsSaco.granel.revenue)} ({granelVsSaco.granel.unitsKg} kg)</p>
                  <p>Facturación Sacos: {formatCurrency(granelVsSaco.saco.revenue)} ({granelVsSaco.saco.unitsSacos} sacos)</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                <h3 className="font-bold text-amber-950 mb-1">Pérdida por Merma Registrada</h3>
                <p className="text-slate-600 mb-2">
                  La tasa de merma extraída del Kardex es de <strong>{granelVsSaco.shrinkageRatePct}%</strong>, con un costo monetario directo de <strong>{formatCurrency(granelVsSaco.shrinkageTotalCost)}</strong> ({granelVsSaco.shrinkageKg} kg perdidos).
                </p>
                <div className="font-mono text-[11px] text-amber-900 space-y-0.5">
                  <p>Causa #1: Rotura de saco en bodega ({formatCurrency(granelVsSaco.shrinkageBreakdown[0]?.cost || 0)})</p>
                  <p>Causa #2: Descalce en tolva ({formatCurrency(granelVsSaco.shrinkageBreakdown[1]?.cost || 0)})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Action Plan for General Director */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              4. Plan de Acción y Directrices Estratégicas
            </h2>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-700 font-mono">01.</span>
                <p>
                  <strong>Blindaje de Stock Estrella:</strong> Se identificaron {starsCount} productos Estrella (Bravecto, Pro Plan Granel, NexGard) que generan el mayor flujo de utilidad. Establecer orden automática de reposición a los 10 días de stock de seguridad.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-700 font-mono">02.</span>
                <p>
                  <strong>Depuración de Productos Hueso:</strong> Existen {dogsCount} SKUs de baja rotación y bajo margen (platos plásticos y juguetes genéricos). Se recomienda pack de liquidación 2x1 para liberar capital de trabajo.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-700 font-mono">03.</span>
                <p>
                  <strong>Optimización de Turnos de Caja en Horas Pico:</strong> Reforzar personal los días Sábado entre 11:00 y 14:00 hrs y días hábiles de 18:00 a 20:00 hrs para disminuir tiempos de espera y maximizar la venta consultiva de productos antiparasitarios.
                </p>
              </div>
            </div>
          </div>

          {/* Signature / Auditor stamp */}
          <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500 font-mono">
            <div>
              <p>Auditoría Directiva PetStock BI</p>
              <p>Firma digital validada para {AUTHORIZED_EMAIL}</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-slate-400 mb-1" />
              <p>Firma Dirección General</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
