import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  KPIThresholdConfig,
  KPIThresholdRule,
  ThresholdPresetId,
} from '../types/thresholds';
import {
  DEFAULT_CFO_THRESHOLDS,
  THRESHOLD_PRESETS,
  saveKPIThresholdConfig,
} from '../utils/kpiThresholds';
import { useBI } from '../context/BIContext';
import {
  calculateSeasonalVariancePredictions,
  buildDynamicThresholdConfigFromPredictions,
} from '../utils/seasonalVariancePredictor';
import { Zap } from 'lucide-react';

interface KPIThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: KPIThresholdConfig;
  onSave: (newConfig: KPIThresholdConfig) => void;
  daysCount?: number;
}

export const KPIThresholdModal: React.FC<KPIThresholdModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
  daysCount = 30,
}) => {
  const { sales, expenses } = useBI();
  const [formData, setFormData] = useState<KPIThresholdConfig>(currentConfig);
  const [activePreset, setActivePreset] = useState<ThresholdPresetId | 'dynamic_seasonal' | 'custom'>('custom');
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(currentConfig);
      setSavedFeedback(false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleApplyDynamicSuggestions = () => {
    const predictions = calculateSeasonalVariancePredictions(sales, expenses);
    const dynamicConfig = buildDynamicThresholdConfigFromPredictions(predictions, currentConfig);
    setFormData(dynamicConfig);
    setActivePreset('dynamic_seasonal');
  };

  const handlePresetSelect = (presetId: ThresholdPresetId) => {
    const found = THRESHOLD_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setFormData(found.config);
      setActivePreset(presetId);
    }
  };

  const handleInputChange = (
    key: keyof KPIThresholdConfig,
    field: 'target' | 'warning' | 'critical',
    value: number
  ) => {
    setActivePreset('custom');
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_CFO_THRESHOLDS);
    setActivePreset('cfo_sme_retail');
  };

  const handleSave = () => {
    saveKPIThresholdConfig(formData);
    onSave(formData);
    setSavedFeedback(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const metricKeys: (keyof KPIThresholdConfig)[] = [
    'weightedGrossMarginPct',
    'gmroi',
    'aov',
    'daysSalesInventory',
    'totalSales',
    'operatingEbitda',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="threshold-modal-title"
    >
      <div className="bg-white max-w-3xl w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 id="threshold-modal-title" className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Configuración de Umbrales Críticos & Semáforos</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  CFO Cockpit
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Define las metas (🟢), advertencias preventivas (🟡) y umbrales críticos de alarma (🔴)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {/* Executive CFO Policy Note */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Reglas de Acción del Sistema de Alertas Tempranas
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <strong>Verde:</strong> Seguir y monitorear ritmo
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <strong>Amarillo:</strong> Vigilar semanal (plan de corrección en 7 días)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    <strong>Rojo:</strong> Actuar en 48 horas (impacto en caja directo)
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 transition-colors"
              title="Restablecer a valores de referencia sugeridos por CFO"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer CFO</span>
            </button>
          </div>

          {/* Dynamic Seasonal Prediction Banner */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-2xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <span>Sugerencia Predictiva por Varianza Estacional</span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-800">
                    Auto-Calibrado ±σ
                  </span>
                </p>
                <p className="text-[11px] text-blue-800/80 mt-0.5">
                  Calcula metas y límites dinámicos deduciendo la estacionalidad semanal y dispersión residual de los datos históricos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyDynamicSuggestions}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                activePreset === 'dynamic_seasonal'
                  ? 'bg-blue-700 text-white shadow-xs ring-2 ring-blue-400'
                  : 'bg-white hover:bg-blue-100/70 text-blue-800 border border-blue-300 shadow-2xs'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>{activePreset === 'dynamic_seasonal' ? '¡Sugerencias Cargadas!' : 'Cargar Sugerencias Dinámicas'}</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Plantillas Rápidas de la Industria:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {THRESHOLD_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric Threshold Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Parámetros Individuales por Métrica
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Período actual activo: {daysCount} días
              </span>
            </div>

            <div className="space-y-3">
              {metricKeys.map((key) => {
                const rule = formData[key];
                const isLowerBetter = rule.lowerIsBetter;

                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 transition-colors hover:border-slate-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{rule.label}</span>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Unidad: {rule.unit}
                          </span>
                          {rule.isRevenueDailyRate && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Base diaria escalable
                            </span>
                          )}
                          {isLowerBetter && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Menor = Mejor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                      </div>
                    </div>

                    {/* Threshold Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Verde: Objetivo */}
                      <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40">
                        <label className="block text-[11px] font-medium text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Objetivo (🟢 Verde)</span>
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="number"
                            step={rule.unit === '%' ? '0.5' : rule.unit === 'x' ? '0.1' : '100'}
                            value={rule.target}
                            onChange={(e) =>
                              handleInputChange(key, 'target', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs font-mono font-semibold text-slate-900 px-2 py-1 bg-white border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                          <span className="ml-1.5 text-xs font-mono text-emerald-700">{rule.unit}</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 mt-1">
                          {isLowerBetter ? `Menor o igual a ${rule.target}` : `Mayor o igual a ${rule.target}`}
                        </p>
                      </div>

                      {/* Amarillo: Alerta Preventiva */}
                      <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40">
                        <label className="block text-[11px] font-medium text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Alerta (🟡 Amarillo)</span>
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="number"
                            step={rule.unit === '%' ? '0.5' : rule.unit === 'x' ? '0.1' : '100'}
                            value={rule.warning}
                            onChange={(e) =>
                              handleInputChange(key, 'warning', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs font-mono font-semibold text-slate-900 px-2 py-1 bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <span className="ml-1.5 text-xs font-mono text-amber-700">{rule.unit}</span>
                        </div>
                        <p className="text-[10px] text-amber-700 mt-1">
                          {isLowerBetter ? `Entre ${rule.target} y ${rule.warning}` : `Entre ${rule.warning} y ${rule.target}`}
                        </p>
                      </div>

                      {/* Rojo: Crítico */}
                      <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40">
                        <label className="block text-[11px] font-medium text-rose-800 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Crítico (🔴 Rojo)</span>
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="number"
                            step={rule.unit === '%' ? '0.5' : rule.unit === 'x' ? '0.1' : '100'}
                            value={rule.critical}
                            onChange={(e) =>
                              handleInputChange(key, 'critical', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-xs font-mono font-semibold text-slate-900 px-2 py-1 bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                          />
                          <span className="ml-1.5 text-xs font-mono text-rose-700">{rule.unit}</span>
                        </div>
                        <p className="text-[10px] text-rose-700 mt-1">
                          {isLowerBetter ? `Superior a ${rule.warning}` : `Inferior a ${rule.critical}`}
                        </p>
                      </div>
                    </div>

                    {/* Scale note if daily rate */}
                    {rule.isRevenueDailyRate && daysCount > 1 && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/80 flex items-center justify-between">
                        <span>Meta total proyectada para {daysCount} días:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          ${Math.round(rule.target * daysCount).toLocaleString('es-CL')} (Objetivo) · ${Math.round(rule.critical * daysCount).toLocaleString('es-CL')} (Crítico)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Los umbrales se guardan localmente y se aplican a todas las vistas del cockpit.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar Umbrales</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
