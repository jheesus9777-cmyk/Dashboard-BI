import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Layers,
  Sparkles,
  Award,
  HelpCircle,
  AlertOctagon,
  Search,
  ExternalLink,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useBI } from '../context/BIContext';
import { BCGQuadrant, CoverageStatus, KardexMovementType } from '../types/bi';

export const ProductDrilldownModal: React.FC = () => {
  const {
    selectedProductId,
    setSelectedProductId,
    products,
    sales,
    kardex,
    bcgMetrics,
    stockCoverage,
    associationRules,
    activeDateRange,
  } = useBI();

  const [activeTab, setActiveTab] = useState<'overview' | 'kardex' | 'basket'>('overview');
  const [productSearch, setProductSearch] = useState('');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProductId(null);
      }
    };
    if (selectedProductId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProductId, setSelectedProductId]);

  const currentProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, products]);

  const bcg = useMemo(() => {
    if (!currentProduct) return null;
    return (
      bcgMetrics.find(
        (b) => b.productId === currentProduct.id || b.sku === currentProduct.sku
      ) || null
    );
  }, [currentProduct, bcgMetrics]);

  const coverage = useMemo(() => {
    if (!currentProduct) return null;
    return (
      stockCoverage.find(
        (c) => c.productId === currentProduct.id || c.sku === currentProduct.sku
      ) || null
    );
  }, [currentProduct, stockCoverage]);

  // Product sales in active period
  const productSalesMetrics = useMemo(() => {
    if (!currentProduct) return { units: 0, revenue: 0, marginAmount: 0, ticketsCount: 0 };

    let units = 0;
    let revenue = 0;
    let ticketsCount = 0;

    sales.forEach((s) => {
      let matchedInTicket = false;
      s.items.forEach((item) => {
        if (
          item.productId === currentProduct.id ||
          item.sku === currentProduct.sku ||
          item.productName.toLowerCase() === currentProduct.name.toLowerCase()
        ) {
          units += item.quantity;
          revenue += item.subtotal;
          matchedInTicket = true;
        }
      });
      if (matchedInTicket) ticketsCount++;
    });

    const cogs = units * currentProduct.costPrice;
    const marginAmount = revenue - cogs;

    return { units, revenue, marginAmount, ticketsCount };
  }, [currentProduct, sales]);

  // Kardex history for this product
  const productKardex = useMemo(() => {
    if (!currentProduct) return [];
    return kardex
      .filter(
        (k) =>
          k.productId === currentProduct.id ||
          k.productName.toLowerCase().includes(currentProduct.name.toLowerCase()) ||
          currentProduct.name.toLowerCase().includes(k.productName.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentProduct, kardex]);

  // Cross-selling rules involving this product
  const crossSellingRules = useMemo(() => {
    if (!currentProduct) return [];
    const pName = currentProduct.name.toLowerCase();

    return associationRules
      .filter((rule) => {
        const matchesA =
          rule.itemA.toLowerCase().includes(pName) ||
          pName.includes(rule.itemA.toLowerCase()) ||
          rule.skuA === currentProduct.sku;
        const matchesB =
          rule.itemB.toLowerCase().includes(pName) ||
          pName.includes(rule.itemB.toLowerCase()) ||
          rule.skuB === currentProduct.sku;
        return matchesA || matchesB;
      })
      .slice(0, 6);
  }, [currentProduct, associationRules]);

  // Search results for quick switcher
  const filteredProductOptions = useMemo(() => {
    if (!productSearch) return [];
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5);
  }, [products, productSearch]);

  if (!selectedProductId || !currentProduct) return null;

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  const unitGrossMargin = currentProduct.salePrice - currentProduct.costPrice;
  const unitGrossMarginPct =
    currentProduct.salePrice > 0
      ? ((unitGrossMargin / currentProduct.salePrice) * 100).toFixed(1)
      : '0.0';

  const inventoryCostValuation = currentProduct.stock * currentProduct.costPrice;
  const inventoryRetailValuation = currentProduct.stock * currentProduct.salePrice;

  const getBcgBadge = (quadrant?: BCGQuadrant) => {
    switch (quadrant) {
      case 'star':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Estrella (Alta Rotación / Alto Margen)</span>
          </span>
        );
      case 'cash_cow':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vaca Lechera (Alta Rotación / Margen Medio)</span>
          </span>
        );
      case 'question_mark':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-800 border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Interrogante (Baja Rotación / Alto Margen)</span>
          </span>
        );
      case 'dog':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
            <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
            <span>Hueso / Baja Rentabilidad</span>
          </span>
        );
    }
  };

  const getCoverageBadge = (status?: CoverageStatus, days?: number) => {
    switch (status) {
      case 'critical_stockout':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>Quiebre Inminente ({days || 0} días de cobertura)</span>
          </span>
        );
      case 'reorder_point':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Punto de Reorden ({days || 0} días)</span>
          </span>
        );
      case 'overstock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Sobre-stock ({days || 0} días)</span>
          </span>
        );
      case 'healthy':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Stock Saludable ({days || 0} días)</span>
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drilldown-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={() => setSelectedProductId(null)}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  SKU: {currentProduct.sku}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {currentProduct.category}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 capitalize">
                  Formato: {currentProduct.formatType === 'granel' ? 'Granel (Kg)' : currentProduct.formatType === 'saco' ? 'Saco Cerrado' : 'Unidad'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Unidad: {currentProduct.unitOfMeasure}
                </span>
              </div>

              <h2
                id="drilldown-title"
                className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight truncate"
              >
                {currentProduct.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                aria-label="Cerrar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Strategic Classification Badges */}
          <div className="mt-4 flex items-center gap-2.5 flex-wrap">
            {getBcgBadge(bcg?.quadrant)}
            {getCoverageBadge(coverage?.status, coverage?.daysOfCoverage)}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ficha Ejecutiva 360°
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('basket')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'basket'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Venta Cruzada</span>
            {crossSellingRules.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-blue-50 text-blue-700 rounded-full font-mono">
                {crossSellingRules.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kardex')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'kardex'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Auditoría Kardex</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-600 rounded-full font-mono">
              {productKardex.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <>
              {/* 4 Core Financial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Unit Economics */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Unit Economics</span>
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {formatCurrency(currentProduct.salePrice)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      PVP por {currentProduct.formatType === 'granel' ? 'Kg' : 'Unidad'}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Costo compra:</span>
                      <span className="font-mono">{formatCurrency(currentProduct.costPrice)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-blue-700">
                      <span>Margen Bruto:</span>
                      <span className="font-mono">{unitGrossMarginPct}% (+{formatCurrency(unitGrossMargin)})</span>
                    </div>
                  </div>
                </div>

                {/* 2. Stock Valuation */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Stock en Bodega</span>
                    <Package className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {currentProduct.stock}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {currentProduct.formatType === 'granel' ? 'Kilogramos' : 'Unidades'} físicas
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Valor a Costo:</span>
                      <span className="font-mono">{formatCurrency(inventoryCostValuation)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Valor a PVP:</span>
                      <span className="font-mono">{formatCurrency(inventoryRetailValuation)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Runway & Velocity */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Runway & Velocidad</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {coverage ? `${coverage.daysOfCoverage}d` : 'N/D'}
                    </span>
                    <span className="text-xs text-slate-500 block">Cobertura proyectada</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Venta diaria:</span>
                      <span className="font-mono">
                        {coverage ? `${coverage.dailyVelocity} ${currentProduct.formatType === 'granel' ? 'kg/d' : 'u/d'}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Reposición (30d):</span>
                      <span className="font-mono font-semibold text-rose-700">
                        {coverage && coverage.reorderUnitsNeeded > 0
                          ? `+${coverage.reorderUnitsNeeded} u`
                          : 'Cubierto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Sales in Period */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Ventas ({activeDateRange.formattedLabel})</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {formatCurrency(productSalesMetrics.revenue)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {productSalesMetrics.units} {currentProduct.formatType === 'granel' ? 'kg' : 'unidades'} vendidas
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Tickets donde aparece:</span>
                      <span className="font-mono">{productSalesMetrics.ticketsCount} compras</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Ganancia bruta per.:</span>
                      <span className="font-mono">{formatCurrency(productSalesMetrics.marginAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Analysis & Recommendation Card */}
              {bcg && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Dictamen Estratégico & Recomendación Directiva
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      Matriz BCG PetStock
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {bcg.recommendation}
                  </p>
                </div>
              )}

              {/* Quick SKU Switcher within modal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">
                      Inspeccionar otro SKU sin salir:
                    </span>
                  </div>
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full px-3 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                    {filteredProductOptions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                        {filteredProductOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedProductId(opt.id);
                              setProductSearch('');
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800 truncate">{opt.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                              {opt.sku}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'basket' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Reglas de Asociación y Canasta Cruzada
                  </h3>
                  <p className="text-xs text-slate-500">
                    Artículos que los clientes compran con mayor frecuencia junto a este producto
                  </p>
                </div>
              </div>

              {crossSellingRules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {crossSellingRules.map((rule, idx) => {
                    const otherItem =
                      rule.itemA.toLowerCase() === currentProduct.name.toLowerCase()
                        ? rule.itemB
                        : rule.itemA;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Lift: {rule.lift.toFixed(2)}x
                          </span>
                          <span className="text-slate-500">
                            Confianza: {rule.confidencePct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-800">
                          <span className="text-slate-500">Producto asociado: </span>
                          <strong className="text-blue-700 block mt-0.5">{otherItem}</strong>
                        </div>
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                          {rule.strategicAction}
                        </p>
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Ocurrencias: {rule.coOccurrenceCount} tickets</span>
                          <span className="text-emerald-700 font-medium">Sinergia Probada</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>No se encontraron reglas de asociación con soporte mínimo para este SKU.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kardex' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Auditoría de Movimientos en Kardex
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro inmutable de compras/entradas, despachos y mermas
                  </p>
                </div>
              </div>

              {productKardex.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3">Tipo Movimiento</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                        <th className="py-2.5 px-3 text-right">Costo Total</th>
                        <th className="py-2.5 px-3">Glosa / Observación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productKardex.map((mov) => {
                        const isMerma = mov.type === 'MERMA';
                        const isEntrada = mov.type === 'ENTRADA' || mov.quantity > 0;

                        return (
                          <tr
                            key={mov.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isMerma ? 'bg-rose-50/40' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                              {new Date(mov.date).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                  isMerma
                                    ? 'bg-rose-100 text-rose-800'
                                    : isEntrada
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {mov.type}
                              </span>
                            </td>
                            <td
                              className={`py-2.5 px-3 font-mono font-semibold text-right tabular-nums ${
                                mov.quantity < 0 ? 'text-slate-900' : 'text-emerald-700'
                              }`}
                            >
                              {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}{' '}
                              {currentProduct.formatType === 'granel' ? 'kg' : 'u'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-right text-slate-600 tabular-nums">
                              {formatCurrency(mov.unitCost)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-right text-slate-900 font-semibold tabular-nums">
                              {formatCurrency(mov.totalCost)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                              <span>{mov.reason || 'Sin glosa registrada'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p>No hay registros de movimientos en kardex para este SKU en la base auditada.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auditoría en Solo Lectura · ID: {currentProduct.id}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProductId(null)}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
