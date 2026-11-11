import React, { useState, useId } from 'react';
import { useBI } from '../context/BIContext';
import {
  Briefcase,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Send,
  RefreshCw,
  Sliders,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';

import { BCGProductMetrics } from '../types/bi';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const CFOExecutiveAdvisor: React.FC = () => {
  const {
    kpis,
    periodComparison,
    granelVsSaco,
    stockCoverage,
    bcgMetrics,
    activeDateRange,
    dateFilter,
  } = useBI();

  const [inputPrompt, setInputPrompt] = useState('');
  const [includeLiveData, setIncludeLiveData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();

  // Initial welcome message from the CFO
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      text: `**Dirección Financiera Ejecutiva de PetStock BI activada.**

Mentalidad de dueño: **priorizo caja sobre utilidad contable, rentabilidad sostenible sobre volumen sin margen y decisiones ejecutables en pesos y días.**

He sincronizado las cifras de ventas, margen ponderado (${kpis.weightedGrossMarginPct.toFixed(1)}%), mermas de granel (${granelVsSaco.shrinkageRatePct.toFixed(1)}%) y rotación de inventario del período actual.

Puedes seleccionar uno de los escenarios preconfigurados abajo o plantear cualquier dilema de liquidez, pricing, CAPEX o reestructura. Entregaré siempre el dictamen en 6 puntos con la tabla de semáforo oficial (🟢 🟡 🔴).`,
      timestamp: 'Ahora',
    },
  ]);

  // Executive strategic presets
  const presets = [
    {
      label: '🩺 Diagnóstico Integral & Semáforo',
      prompt:
        'Realiza una auditoría financiera y diagnóstico integral de PetStock con base en los números actuales. Entrega el semáforo completo con los 11 KPIs estándar para PYME en México, los 3 escenarios y el plan de choque a 30-60-90 días.',
    },
    {
      label: '🏷️ Pricing: Subida de Precios vs Elasticidad',
      prompt:
        'Evalúa el impacto de subir un 7% el precio en la categoría de alimentos para perro y granel. Simula los 3 escenarios con caídas de volumen del 5%, 10% y 20%. Demuestra si la utilidad y la caja quedan mejor que hoy.',
    },
    {
      label: '🏢 Evaluación CAPEX: 2ª Sucursal PetStock',
      prompt:
        'Evalúa un proyecto de inversión para abrir una segunda sucursal PetStock con inversión estimada de $850,000 MXN (obra, inventario inicial, permisos y 3 meses de gasto). Calcula Payback, VPN con WACC del 16%, TIR, punto de equilibrio y emite veredicto claro de SÍ o NO.',
    },
    {
      label: '💧 Plan de Choque de Caja a 13 Semanas',
      prompt:
        'Elabora un plan de estabilización de liquidez inmediata a 13 semanas para PetStock, enfocado en contener mermas en granel, liquidar inventario hueso/perro y estirar capital de trabajo.',
    },
    {
      label: '📦 Optimización Granel vs Saco & Mermas',
      prompt:
        'Analiza la brecha de margen entre granel y saco cerrado. Con la tasa actual de mermas, ¿conviene seguir fraccionando sacos o enfocar la estrategia comercial en sacos sellados de alta rotación?',
    },
  ];

  // Prepare live context payload to feed the CFO
  const getLiveContext = () => {
    const criticalStockouts = stockCoverage.filter((s) => s.status === 'critical_stockout').length;
    const starCount = bcgMetrics.filter((p: BCGProductMetrics) => p.quadrant === 'star').length;
    const cowCount = bcgMetrics.filter((p: BCGProductMetrics) => p.quadrant === 'cash_cow').length;
    const questionCount = bcgMetrics.filter((p: BCGProductMetrics) => p.quadrant === 'question_mark').length;
    const dogCount = bcgMetrics.filter((p: BCGProductMetrics) => p.quadrant === 'dog').length;

    return {
      dateRange: `${activeDateRange.startDate.toLocaleDateString('es-CL')} — ${activeDateRange.endDate.toLocaleDateString('es-CL')} (${dateFilter})`,
      totalSales: kpis.totalSales,
      totalCogs: kpis.totalCogs,
      grossMarginAmount: kpis.grossMarginAmount,
      weightedGrossMarginPct: kpis.weightedGrossMarginPct,
      totalExpenses: kpis.totalExpenses,
      operatingEbitda: kpis.operatingEbitda,
      ebitdaMarginPct: kpis.ebitdaMarginPct,
      aov: kpis.aov,
      ticketCount: kpis.ticketCount,
      inventoryValue: kpis.inventoryValue,
      gmroi: kpis.gmroi,
      inventoryTurnoverRatio: kpis.inventoryTurnoverRatio,
      daysSalesInventory: kpis.daysSalesInventory,
      revenueDeltaPct: periodComparison.revenueDeltaPct,
      ticketsDeltaPct: periodComparison.ticketsDeltaPct,
      marginDeltaPts: periodComparison.marginDeltaPts,
      granelMarginPct: granelVsSaco.granel.marginPct,
      sacoMarginPct: granelVsSaco.saco.marginPct,
      granelDeltaMarginPct: granelVsSaco.marginDeltaPct,
      shrinkageCost: granelVsSaco.shrinkageTotalCost,
      shrinkageRatePct: granelVsSaco.shrinkageRatePct,
      bcgSummary: `${starCount} Estrellas, ${cowCount} Vacas Lecheras, ${questionCount} Interrogantes, ${dogCount} Huesos`,
      criticalStockoutsCount: criticalStockouts,
    };
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const liveContext = includeLiveData ? getLiveContext() : null;

      // Extract conversation history (exclude welcome message)
      const conversationHistory = newMessages
        .filter((m) => m.id !== 'msg_welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/cfo/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          contextData: liveContext,
          conversationHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al comunicarse con el CFO');
      }

      const modelMessage: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('CFO consultation error:', err);
      setErrorMessage(err.message || 'Error al procesar la consulta con el Director Financiero.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to format text with Markdown bold, code, and tables
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];

    const flushTable = (keyPrefix: number) => {
      if (tableBuffer.length === 0) return null;
      const rows = tableBuffer.map((line) =>
        line
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => c.trim())
      );
      tableBuffer = [];

      if (rows.length < 2) return null;

      const header = rows[0];
      const dataRows = rows.slice(1).filter((r) => !r.every((c) => /^[-:]+$/.test(c)));

      return (
        <div key={`table_${keyPrefix}`} className="my-3 overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="p-2.5 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50">
                  {row.map((cell, cIdx) => {
                    const isGreen = cell.includes('🟢') || cell.toLowerCase().includes('verde');
                    const isYellow = cell.includes('🟡') || cell.toLowerCase().includes('amarillo');
                    const isRed = cell.includes('🔴') || cell.toLowerCase().includes('rojo');

                    return (
                      <td
                        key={cIdx}
                        className={`p-2.5 text-slate-700 ${
                          cIdx > 0 ? 'tabular-nums' : 'font-medium'
                        } ${isGreen ? 'bg-emerald-50/50 text-emerald-900 font-semibold' : ''} ${
                          isYellow ? 'bg-amber-50/50 text-amber-900 font-semibold' : ''
                        } ${isRed ? 'bg-rose-50/50 text-rose-900 font-semibold' : ''}`}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    lines.forEach((line, index) => {
      // Check if line is part of a markdown table
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableBuffer.push(line);
        return;
      }

      if (tableBuffer.length > 0) {
        elements.push(flushTable(index));
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="text-sm font-bold text-slate-900 mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <span className="w-1.5 h-3.5 bg-blue-600 rounded-xs inline-block" />
            {line.replace('### ', '')}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="text-base font-bold text-slate-900 mt-5 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const bulletText = line.substring(2);
        elements.push(
          <li key={index} className="ml-4 list-disc text-xs text-slate-700 my-1 leading-relaxed">
            {renderInlineMarkdown(bulletText)}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-1.5" />);
      } else {
        elements.push(
          <p key={index} className="text-xs text-slate-700 my-1 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    });

    if (tableBuffer.length > 0) {
      elements.push(flushTable(9999));
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic bold **text** replacement
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div id="cfo_advisor" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Director Financiero IA (CFO Ejecutivo)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  <Sparkles className="w-3 h-3 text-blue-300" />
                  Gemini 3.8 Flash
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  Mentalidad de Dueño (Caja &gt; Utilidad)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                20 años de experiencia directiva en PYMEs LATAM / México. Diagnóstico con semáforo temprano, pricing con elasticidad, CAPEX con WACC/TIR y reestructura con flujo a 13 semanas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowDataPreview(!showDataPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Cifras En Vivo</span>
              {showDataPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
              title="Imprimir dictamen financiero"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Live Data Context Collapsible Drawer */}
        {showDataPreview && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Ventas Período</span>
              <span className="font-bold text-white tabular-nums">${kpis.totalSales.toLocaleString('es-MX')}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Margen Ponderado</span>
              <span className="font-bold text-emerald-400 tabular-nums">{kpis.weightedGrossMarginPct.toFixed(2)}%</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">EBITDA Estimado</span>
              <span className="font-bold text-blue-300 tabular-nums">${kpis.operatingEbitda.toLocaleString('es-MX')}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Ticket Promedio (AOV)</span>
              <span className="font-bold text-white tabular-nums">${kpis.aov.toLocaleString('es-MX')}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Inventario (DSI)</span>
              <span className="font-bold text-amber-300 tabular-nums">{kpis.daysSalesInventory.toFixed(1)} días</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block">Mermas Granel</span>
              <span className="font-bold text-rose-300 tabular-nums">{granelVsSaco.shrinkageRatePct.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Strategic 1-Click Presets */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Consultas Directivas Preconfiguradas (1 Clic)
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset.prompt)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 transition-all shadow-2xs flex items-center gap-1.5 text-left disabled:opacity-50"
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Consultation Chat Feed */}
      <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-semibold text-slate-500">
                {msg.role === 'user' ? 'Dirección General' : 'CFO Virtual (Dictamen Ejecutivo)'}
              </span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              {msg.role === 'model' && (
                <button
                  onClick={() => copyToClipboard(msg.text, msg.id)}
                  className="text-slate-400 hover:text-blue-600 transition-colors ml-2 flex items-center gap-1 text-[10px]"
                  title="Copiar respuesta"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div
              className={`rounded-xl p-4 text-xs max-w-4xl border ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white text-slate-800 border-slate-200 shadow-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.text}</p>
              ) : (
                <div className="prose-xs space-y-1">{renderFormattedText(msg.text)}</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-pulse max-w-md">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                El CFO está analizando estados financieros y proyectando escenarios...
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculando semáforos de liquidez, matrices de sensibilidad y plan 30-60-90 días.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <span className="font-semibold">Error en la consulta: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Plantea un dilema de caja, pricing, CAPEX o reestructura... Ej: ¿Conviene abrir sucursal en San Pedro con $850k de inversión y 18 meses de payback?"
              rows={2}
              className="w-full text-xs p-3 pr-12 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none bg-white text-slate-800 placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="absolute right-2.5 bottom-3.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-2xs"
              title="Enviar consulta"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <label htmlFor={formId} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id={formId}
                type="checkbox"
                checked={includeLiveData}
                onChange={(e) => setIncludeLiveData(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>Inyectar métricas del período activo de PetStock BI automáticamente</span>
            </label>
            <span className="text-slate-400 text-[10px]">
              Presiona Enter para enviar · Shift+Enter para salto de línea
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
