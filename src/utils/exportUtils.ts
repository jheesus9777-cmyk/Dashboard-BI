import { Sale, Product, KardexEntry, Expense, KPISummary, GranelVsSacoComparison } from '../types/bi';

/**
 * Generates an Excel-compatible CSV with UTF-8 BOM encoding and clean Spanish formatting
 */
export function exportToExcel(
  sales: Sale[],
  products: Product[],
  kardex: KardexEntry[],
  expenses: Expense[],
  kpis: KPISummary,
  granelVsSaco: GranelVsSacoComparison
) {
  const sections: string[] = [];

  // Executive KPI Summary Section
  sections.push('=== PETSTOCK BI - RESUMEN EJECUTIVO DIRECTIVO ===');
  sections.push(`Fecha de Exportación;${new Date().toLocaleString('es-CL')}`);
  sections.push(`Usuario Autorizado;jheesus.9777@gmail.com`);
  sections.push(`Modo de Acceso;Estrictamente Solo Lectura (Firestore)`);
  sections.push('');

  sections.push('KPIs CLAVE;VALOR;BENCHMARK / NOTA');
  sections.push(`GMROI (Retorno de Margen sobre Inv);${kpis.gmroi}x;${kpis.gmroiStatus === 'optimal' ? 'Saludable (> 2.0x)' : 'Requiere optimización'}`);
  sections.push(`Ticket Promedio (AOV);$${kpis.aov.toLocaleString('es-CL')};Venta promedio por cliente`);
  sections.push(`Margen Bruto Ponderado Real;${kpis.weightedGrossMarginPct}%;Margen neto sobre COGS`);
  sections.push(`Ventas Netas Totales;$${kpis.totalSales.toLocaleString('es-CL')};Total facturado`);
  sections.push(`Costo Total de Ventas (COGS);$${kpis.totalCogs.toLocaleString('es-CL')};Costo de reposición`);
  sections.push(`Margen Bruto Total;$${kpis.grossMarginAmount.toLocaleString('es-CL')};Ganancia bruta`);
  sections.push(`Gastos Operativos (Expenses);$${kpis.totalExpenses.toLocaleString('es-CL')};Arriendo, Sueldos, Servicios`);
  sections.push(`EBITDA Operativo Estimado;$${kpis.operatingEbitda.toLocaleString('es-CL')};Margen EBITDA: ${kpis.ebitdaMarginPct}%`);
  sections.push(`Valor de Inventario Actual;$${kpis.inventoryValue.toLocaleString('es-CL')};Valor a costo`);
  sections.push(`Días de Inventario (DSI);${kpis.daysSalesInventory} días;Rotación: ${kpis.inventoryTurnoverRatio}x`);
  sections.push('');

  // Granel vs Saco Summary
  sections.push('=== ANÁLISIS RENDIMIENTO GRANEL VS SACO ===');
  sections.push('FORMATO;VENTAS TOTALES;UNIDADES / KG;MARGEN BRUTO;MARGEN %;PRECIO PROMEDIO');
  sections.push(`Granel;$${granelVsSaco.granel.revenue.toLocaleString('es-CL')};${granelVsSaco.granel.unitsKg} kg;$${granelVsSaco.granel.grossMarginAmount.toLocaleString('es-CL')};${granelVsSaco.granel.marginPct}%;$${granelVsSaco.granel.avgPricePerKg}/kg`);
  sections.push(`Saco Cerrado;$${granelVsSaco.saco.revenue.toLocaleString('es-CL')};${granelVsSaco.saco.unitsSacos} sacos;$${granelVsSaco.saco.grossMarginAmount.toLocaleString('es-CL')};${granelVsSaco.saco.marginPct}%;$${granelVsSaco.saco.avgPricePerUnit}/saco`);
  sections.push(`Delta de Margen a favor de Granel;+${granelVsSaco.marginDeltaPct}%;;;;`);
  sections.push(`Pérdidas por Merma Granel (Kardex);$${granelVsSaco.shrinkageTotalCost.toLocaleString('es-CL')};${granelVsSaco.shrinkageKg} kg;Tasa: ${granelVsSaco.shrinkageRatePct}%;;`);
  sections.push('');

  // Products Portfolio
  sections.push('=== PORTAFOLIO DE PRODUCTOS ===');
  sections.push('ID;SKU;PRODUCTO;CATEGORÍA;FORMATO;STOCK;COSTO;PRECIO;MARGEN TEÓRICO %;VALOR INVENTARIO');
  products.forEach((p) => {
    const margin = p.salePrice > 0 ? (((p.salePrice - p.costPrice) / p.salePrice) * 100).toFixed(1) : '0';
    const val = (p.stock || 0) * (p.costPrice || 0);
    sections.push(`"${p.id}";"${p.sku}";"${p.name}";"${p.category}";"${p.formatType}";${p.stock};$${p.costPrice};$${p.salePrice};${margin}%;$${val}`);
  });
  sections.push('');

  // Kardex Mermas
  sections.push('=== REGISTRO DE MERMAS Y AJUSTES (KARDEX) ===');
  sections.push('ID;FECHA;PRODUCTO;TIPO;MOTIVO;CANTIDAD;COSTO UNITARIO;TOTAL MERMA');
  kardex.forEach((k) => {
    sections.push(`"${k.id}";"${k.date}";"${k.productName}";"${k.type}";"${k.reason || '-'}";${k.quantity};$${k.unitCost};$${k.totalCost}`);
  });

  const csvContent = '\uFEFF' + sections.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PetStock_BI_Informe_Ejecutivo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerExecutivePDFPrint() {
  window.print();
}
