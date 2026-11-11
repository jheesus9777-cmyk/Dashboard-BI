import React, { useState } from 'react';
import { BIProvider, useBI } from './context/BIContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DateRangeSelector } from './components/DateRangeSelector';
import { KPICockpit } from './components/KPICockpit';
import { BCGMatrix } from './components/BCGMatrix';
import { Heatmap7x24 } from './components/Heatmap7x24';
import { MarketBasketAnalysis } from './components/MarketBasketAnalysis';
import { GranelVsSaco } from './components/GranelVsSaco';
import { ExecutiveRadar } from './components/ExecutiveRadar';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { StockCoverageRunway } from './components/StockCoverageRunway';
import { CFOExecutiveAdvisor } from './components/CFOExecutiveAdvisor';
import { ProductDrilldownModal } from './components/ProductDrilldownModal';
import { WidgetCustomizerModal } from './components/WidgetCustomizerModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { CompareSplitScreen } from './components/CompareSplitScreen';
import { PredictiveKPIThresholds } from './components/PredictiveKPIThresholds';
import { ShieldCheck, Database, Info } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { widgets, isAuthorized, user, isCompareMode } = useBI();
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Widget rendering registry
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'cfo_advisor':
        return <CFOExecutiveAdvisor key={widgetId} />;
      case 'kpi_cockpit':
        return <KPICockpit key={widgetId} />;
      case 'predictive_thresholds':
        return <PredictiveKPIThresholds key={widgetId} />;
      case 'executive_radar':
        return <ExecutiveRadar key={widgetId} />;
      case 'bcg_matrix':
        return <BCGMatrix key={widgetId} />;
      case 'what_if_simulator':
        return <WhatIfSimulator key={widgetId} />;
      case 'stock_coverage':
        return <StockCoverageRunway key={widgetId} />;
      case 'heatmap_7x24':
        return <Heatmap7x24 key={widgetId} />;
      case 'market_basket':
        return <MarketBasketAnalysis key={widgetId} />;
      case 'granel_vs_saco':
        return <GranelVsSaco key={widgetId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Read-Only Status Banner */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">Conexión Segura Firestore:</span>
            <span className="font-mono text-slate-600 truncate max-w-xs md:max-w-md">
              gen-lang-client-0982055042 · ai-studio-petstockprogesti-6d3a6858
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Solo Lectura (getDocs / onSnapshot) · Modificaciones Bloqueadas</span>
          </div>
        </div>

        {/* Executive Date Range Selector & Global Data Synchronization */}
        <DateRangeSelector />

        {/* Dynamic Widgets Layout or Split-Screen Comparative View */}
        {isCompareMode ? (
          <CompareSplitScreen />
        ) : (
          <div className="space-y-6">
            {widgets
              .filter((w) => w.enabled)
              .map((w) => renderWidget(w.id))}
          </div>
        )}
      </main>

      {/* Quiet Nordic Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">PetStock BI</span>
            <span>·</span>
            <span>Plataforma de Analítica Directiva</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-slate-400">Colecciones: sales, products, kardex, expenses</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Acceso Autorizado: jheesus.9777@gmail.com
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal />
      <ProductDrilldownModal />
      <WidgetCustomizerModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
      />
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BIProvider>
      <DashboardContent />
    </BIProvider>
  );
}
