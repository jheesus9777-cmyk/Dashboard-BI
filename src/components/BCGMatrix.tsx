import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Award,
  HelpCircle,
  AlertOctagon,
  Search,
  Filter,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { useBI } from '../context/BIContext';
import { BCGProductMetrics, BCGQuadrant } from '../types/bi';

export const BCGMatrix: React.FC = () => {
  const { bcgMetrics, setSelectedProductId } = useBI();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<BCGProductMetrics | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    bcgMetrics.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [bcgMetrics]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return bcgMetrics.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [bcgMetrics, selectedCategory, searchQuery]);

  // Quadrant aggregations
  const stars = filteredProducts.filter((p) => p.quadrant === 'star');
  const cows = filteredProducts.filter((p) => p.quadrant === 'cash_cow');
  const questions = filteredProducts.filter((p) => p.quadrant === 'question_mark');
  const dogs = filteredProducts.filter((p) => p.quadrant === 'dog');

  const formatCurrency = (val: number) => '$' + Math.round(val).toLocaleString('es-CL');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Matriz BCG de Portafolio</span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
              Estrategia de Stock
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación dinámica según rotación de unidades y porcentaje de margen bruto ponderado
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU o producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded transition-colors truncate max-w-[110px] ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={cat}
              >
                {cat.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Quadrants Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Estrellas */}
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
          <div className="flex items-center justify-between text-blue-900">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Estrellas ({stars.length})</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-blue-700">Alta Rot. / Alto Margen</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Prioridad directiva: Garantizar stock cero quiebres e inversión continua.
          </p>
        </div>

        {/* Vacas Lecheras */}
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Vacas Lecheras ({cows.length})</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-emerald-700">Alta Rot. / Bajo Margen</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Prioridad directiva: Ordeñar liquidez, optimizar costos con proveedores.
          </p>
        </div>

        {/* Interrogantes */}
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between text-amber-900">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Interrogantes ({questions.length})</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-amber-700">Baja Rot. / Alto Margen</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Prioridad directiva: Evaluar precio, aplicar venta consultiva o cross-selling.
          </p>
        </div>

        {/* Huesos */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <AlertOctagon className="w-4 h-4 text-slate-500" />
              <span>Huesos / Perros ({dogs.length})</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-500">Baja Rot. / Bajo Margen</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Prioridad directiva: Liquidar remanentes, reasignar espacio a items estrella.
          </p>
        </div>
      </div>

      {/* 2x2 Matrix Graphic Layout */}
      <div className="relative border border-slate-200 rounded-xl bg-slate-50/40 p-4 min-h-[380px] flex flex-col justify-between">
        {/* Axes Guides */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-300 pointer-events-none" />
        <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 border-l border-dashed border-slate-300 pointer-events-none" />

        {/* Axis Labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 z-10 whitespace-nowrap">
          Margen Bruto Elevado (≥32%) ↑
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 z-10 whitespace-nowrap">
          Margen Bruto Bajo (&lt;32%) ↓
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 z-10 whitespace-nowrap">
          Alta Rotación →
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 z-10 whitespace-nowrap">
          ← Baja Rotación
        </div>

        {/* Four Visual Quadrants Grid */}
        <div className="grid grid-cols-2 gap-4 h-full min-h-[320px]">
          {/* Top Left: Interrogantes */}
          <div className="p-3 rounded-lg border border-transparent hover:border-amber-200 transition-colors flex flex-col">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Interrogantes
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5 overflow-y-auto max-h-36">
              {questions.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  onDoubleClick={() => setSelectedProductId(p.productId)}
                  title={`${p.productName} · Clic para detalles o doble clic para Ficha 360°`}
                  className={`text-left p-1.5 rounded-md border text-xs transition-all ${
                    selectedProduct?.productId === p.productId
                      ? 'bg-amber-100 border-amber-400 shadow-xs ring-2 ring-amber-300'
                      : 'bg-white border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <p className="font-medium text-slate-900 truncate max-w-[170px]">{p.productName}</p>
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 font-mono mt-0.5">
                    <span>{p.marginPct}% mrg</span>
                    <span>·</span>
                    <span>{p.unitsSold} u</span>
                  </div>
                </button>
              ))}
              {questions.length === 0 && (
                <span className="text-xs text-slate-400 italic">Sin SKUs en este cuadrante</span>
              )}
            </div>
          </div>

          {/* Top Right: Estrellas */}
          <div className="p-3 rounded-lg border border-transparent hover:border-blue-200 transition-colors flex flex-col">
            <span className="text-xs font-semibold text-blue-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Estrellas (Líderes)
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5 overflow-y-auto max-h-36">
              {stars.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  onDoubleClick={() => setSelectedProductId(p.productId)}
                  title={`${p.productName} · Clic para detalles o doble clic para Ficha 360°`}
                  className={`text-left p-1.5 rounded-md border text-xs transition-all ${
                    selectedProduct?.productId === p.productId
                      ? 'bg-blue-100 border-blue-400 shadow-xs ring-2 ring-blue-300'
                      : 'bg-white border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-slate-900 truncate max-w-[170px]">{p.productName}</p>
                  <div className="flex items-center gap-1 text-[10px] text-blue-700 font-mono mt-0.5">
                    <span>{p.marginPct}% mrg</span>
                    <span>·</span>
                    <span>{p.unitsSold} u</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Left: Huesos */}
          <div className="p-3 rounded-lg border border-transparent hover:border-slate-300 transition-colors flex flex-col">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" /> Huesos / Perros
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5 overflow-y-auto max-h-36">
              {dogs.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  onDoubleClick={() => setSelectedProductId(p.productId)}
                  title={`${p.productName} · Clic para detalles o doble clic para Ficha 360°`}
                  className={`text-left p-1.5 rounded-md border text-xs transition-all ${
                    selectedProduct?.productId === p.productId
                      ? 'bg-slate-200 border-slate-400 shadow-xs ring-2 ring-slate-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900 truncate max-w-[170px]">{p.productName}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{p.marginPct}% mrg</span>
                    <span>·</span>
                    <span>{p.unitsSold} u</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Right: Vacas Lecheras */}
          <div className="p-3 rounded-lg border border-transparent hover:border-emerald-200 transition-colors flex flex-col">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Vacas Lecheras
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5 overflow-y-auto max-h-36">
              {cows.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  onDoubleClick={() => setSelectedProductId(p.productId)}
                  title={`${p.productName} · Clic para detalles o doble clic para Ficha 360°`}
                  className={`text-left p-1.5 rounded-md border text-xs transition-all ${
                    selectedProduct?.productId === p.productId
                      ? 'bg-emerald-100 border-emerald-400 shadow-xs ring-2 ring-emerald-300'
                      : 'bg-white border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  <p className="font-medium text-slate-900 truncate max-w-[170px]">{p.productName}</p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono mt-0.5">
                    <span>{p.marginPct}% mrg</span>
                    <span>·</span>
                    <span>{p.unitsSold} u</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Product Detail Card */}
      {selectedProduct && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 animate-fadeIn">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{selectedProduct.productName}</h3>
                <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  SKU: {selectedProduct.sku}
                </span>
                <span className="text-xs font-mono font-semibold text-blue-700 uppercase">
                  {selectedProduct.quadrant.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Recomendación Ejecutiva:</strong> {selectedProduct.recommendation}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductId(selectedProduct.productId)}
                className="text-xs font-medium text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>Ficha 360°</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t border-blue-100 text-xs">
            <div>
              <span className="text-slate-500 block">Venta Período</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedProduct.revenue)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Unidades / Kg</span>
              <span className="font-mono font-bold text-slate-900">{selectedProduct.unitsSold}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Margen Bruto</span>
              <span className="font-mono font-bold text-blue-700">{selectedProduct.marginPct}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">Ganancia Bruta</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedProduct.grossMarginAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Stock en Bodega</span>
              <span className="font-mono font-bold text-slate-900">{selectedProduct.stock} ({formatCurrency(selectedProduct.stockValue)})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
