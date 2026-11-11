import React from 'react';
import {
  TrendingUp,
  Download,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Database,
  Calendar,
  Sparkles,
  Columns2,
} from 'lucide-react';
import { useBI, DateFilterOption } from '../context/BIContext';
import { exportToExcel } from '../utils/exportUtils';

interface NavbarProps {
  onOpenWidgetModal: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWidgetModal, onOpenReportModal }) => {
  const {
    user,
    isAuthorized,
    dataSource,
    isFirestoreLoading,
    refreshData,
    dateFilter,
    setDateFilter,
    activeDateRange,
    sales,
    products,
    kardex,
    expenses,
    kpis,
    granelVsSaco,
    logout,
    isCompareMode,
    toggleCompareMode,
  } = useBI();

  const handleExcelExport = () => {
    exportToExcel(sales, products, kardex, expenses, kpis, granelVsSaco);
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-950">PetStock BI</span>
                <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  SOLO LECTURA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Analítica Directiva & Business Intelligence
              </p>
            </div>
          </div>

          {/* Central: Active Period Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-400 font-medium">Período:</span>
            <span className="font-mono font-semibold text-slate-800">{activeDateRange.formattedLabel}</span>
          </div>

          {/* Right Action Island */}
          <div className="flex items-center gap-2">
            {/* Sync / Firestore Status Indicator */}
            <button
              type="button"
              onClick={refreshData}
              disabled={isFirestoreLoading}
              title="Sincronizar datos (Modo Solo Lectura Firestore)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFirestoreLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline font-medium">
                {isFirestoreLoading ? 'Sincronizando...' : dataSource === 'firestore' ? 'Firestore Live' : 'Datos Demo'}
              </span>
            </button>

            {/* Compare Split-Screen Toggle */}
            <button
              type="button"
              onClick={toggleCompareMode}
              title="Activar o desactivar vista comparativa en pantalla dividida"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs ${
                isCompareMode
                  ? 'bg-blue-600 text-white border border-blue-700 ring-2 ring-blue-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Columns2 className={`w-3.5 h-3.5 ${isCompareMode ? 'text-white' : 'text-blue-600'}`} />
              <span className="hidden sm:inline">Comparar</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isCompareMode ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isCompareMode ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Customize Dashboard Widgets */}
            <button
              type="button"
              onClick={onOpenWidgetModal}
              title="Personalizar Widgets del Dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Widgets</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExcelExport}
              title="Exportar base consolidada a Excel (CSV tabulado)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Excel</span>
            </button>

            {/* CFO Virtual IA Quick Launcher */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('cfo_advisor');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              title="Ir al Director Financiero IA (CFO Ejecutivo)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">CFO IA</span>
            </button>

            {/* Executive PDF Report */}
            <button
              type="button"
              onClick={onOpenReportModal}
              title="Generar Resumen Ejecutivo en PDF e imprimir"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Informe PDF</span>
            </button>

            {/* User status & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 ml-1">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-mono font-medium text-slate-900">
                    {user.email}
                  </span>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Autorizado</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar sesión ejecutiva"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
