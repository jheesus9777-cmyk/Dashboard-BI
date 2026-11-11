import React from 'react';
import { X, Check, ArrowUp, ArrowDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useBI } from '../context/BIContext';
import { DEFAULT_WIDGETS } from '../services/mockSeedData';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { widgets, toggleWidget, reorderWidgets } = useBI();

  if (!isOpen) return null;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newWidgets = [...widgets];
    const temp = newWidgets[index - 1];
    newWidgets[index - 1] = newWidgets[index];
    newWidgets[index] = temp;
    reorderWidgets(newWidgets);
  };

  const moveDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const newWidgets = [...widgets];
    const temp = newWidgets[index + 1];
    newWidgets[index + 1] = newWidgets[index];
    newWidgets[index] = temp;
    reorderWidgets(newWidgets);
  };

  const resetDefaults = () => {
    reorderWidgets(DEFAULT_WIDGETS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white max-w-lg w-full rounded-xl border border-slate-200 shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Personalizar Widgets del Dashboard</h3>
              <p className="text-xs text-slate-500">Configura el orden y visibilidad de los módulos de analítica</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Widgets List */}
        <div className="space-y-2 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                widget.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    widget.enabled
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}
                  aria-label={`Activar o desactivar ${widget.title}`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">{widget.title}</h4>
                  <p className="text-[11px] text-slate-500">{widget.description}</p>
                </div>
              </div>

              {/* Order Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                  title="Mover arriba"
                  aria-label="Mover arriba"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === widgets.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                  title="Mover abajo"
                  aria-label="Mover abajo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer orden predeterminado</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Guardar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
