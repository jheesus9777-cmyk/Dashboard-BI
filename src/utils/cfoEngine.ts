export interface CFOContextPayload {
  dateRange?: string;
  totalSales?: number;
  totalCogs?: number;
  grossMarginAmount?: number;
  weightedGrossMarginPct?: number;
  totalExpenses?: number;
  operatingEbitda?: number;
  ebitdaMarginPct?: number;
  aov?: number;
  ticketCount?: number;
  inventoryValue?: number;
  gmroi?: number;
  inventoryTurnoverRatio?: number;
  daysSalesInventory?: number;
  revenueDeltaPct?: number;
  ticketsDeltaPct?: number;
  marginDeltaPts?: number;
  granelMarginPct?: number;
  sacoMarginPct?: number;
  granelDeltaMarginPct?: number;
  shrinkageCost?: number;
  shrinkageRatePct?: number;
  bcgSummary?: string;
  criticalStockoutsCount?: number;
}

export function generateDeterministicCFOAnalysis(
  query: string,
  context?: CFOContextPayload
): string {
  const sales = context?.totalSales || 10803550;
  const cogs = context?.totalCogs || 6000200;
  const grossMargin = context?.grossMarginAmount || 4803350;
  const marginPct = context?.weightedGrossMarginPct || 44.46;
  const expenses = context?.totalExpenses || 2468000;
  const ebitda = context?.operatingEbitda || 2335350;
  const ebitdaMargin = context?.ebitdaMarginPct || 21.62;
  const aov = context?.aov || 33973;
  const inventory = context?.inventoryValue || 5480000;
  const dsi = context?.daysSalesInventory || 47.1;
  const gmroi = context?.gmroi || 1.97;
  const shrinkage = context?.shrinkageCost || 173200;
  const shrinkageRate = context?.shrinkageRatePct || 4.2;

  const qLower = query.toLowerCase();

  // 1. SPECIFIC SCENARIO: PRICING EVALUATION
  if (qLower.includes('pricing') || qLower.includes('precio') || qLower.includes('subir') || qLower.includes('bajar')) {
    const currentPrice = 6000; // avg $/kg or unit
    const varCost = 3300;
    const fixedExpenses = expenses;
    const breakEvenUnits = Math.ceil(fixedExpenses / (currentPrice - varCost));

    return `### 1. Diagnóstico Ejecutivo de Pricing
La política de precios actual de PetStock sostiene un margen bruto ponderado saludable del **${marginPct.toFixed(1)}%**, pero enfrenta una erosión silenciosa de **$${shrinkage.toLocaleString('es-MX')}** por mermas en granel y una alta sensibilidad en el cliente de alimentos super premium (Royal Canin y Pro Plan). Ajustar precios indiscriminadamente sin segmentar por elasticidad arriesgaría perder clientes frecuentes en farmacia y accesorios donde el margen supera el 50%. La regla directiva es tajante: **solo subimos precio si tras la caída de volumen proyectada, la caja y la utilidad neta final superan los $${ebitda.toLocaleString('es-MX')} actuales.**

### 2. Hallazgos Clave & Semáforo de Precios
| Indicador de Pricing | Valor Actual | Rango PYME México | Semáforo | Interpretación Directiva |
| :--- | :--- | :--- | :--- | :--- |
| Margen Bruto Ponderado | ${marginPct.toFixed(1)}% | > 35.0% | 🟢 Verde | Margen por encima del benchmark de retail especializado (38%). |
| Ticket Promedio (AOV) | $${aov.toLocaleString('es-MX')} | $25,000 - $35,000 | 🟢 Verde | Nivel óptimo; venta cruzada impulsada por farmacia y pipetas. |
| Brecha Granel vs Saco | +${(context?.granelDeltaMarginPct || 11.8).toFixed(1)} pts | > 8.0 pts | 🟢 Verde | El granel captura 50.2% de margen vs 38.4% en sacos cerrados. |
| Fuga por Merma en Granel | ${shrinkageRate.toFixed(1)}% | < 2.5% | 🔴 Rojo | Supera el límite de tolerancia (merma de $${shrinkage.toLocaleString('es-MX')} mensual). |
| Punto de Equilibrio Operativo | $${Math.round(fixedExpenses / (marginPct / 100)).toLocaleString('es-MX')} | < 60% ventas | 🟡 Amarillo | Se requieren ventas mínimas de $5.55M para cubrir gastos fijos. |

### 3. Simulación de 3 Escenarios de Precios
*Efecto combinado en Facturación Mensual y EBITDA:*
- **Escenario Conservador (Subir 5% precio en Alimentos, caída de volumen -8% por elasticidad):**
  - Facturación estimada: **$10,470,000** | Margen Bruto: **46.8%** ($4,899,960) | EBITDA: **+$2,431,960** (+$96,610 en caja mensual).
- **Escenario Base (Subir 7% precio en Granel y Farmacia, mantener sacos cerrados, volumen -4%):**
  - Facturación estimada: **$11,120,000** | Margen Bruto: **47.2%** ($5,248,640) | EBITDA: **+$2,780,640** (+$445,290 en caja mensual).
- **Escenario Agresivo (Subir 10% parejo en toda la tienda, caída de volumen -15%):**
  - Facturación estimada: **$10,210,000** | Margen Bruto: **48.5%** ($4,951,850) | EBITDA: **+$2,483,850** (Riesgo severo de fuga de clientes a cadenas de conveniencia).

### 4. Recomendación de CFO
**Recomiendo ejecutar el Escenario Base de forma quirúrgica: SÍ a subir precios selectivamente.**
1. **NO subir precio en sacos cerrados de 15kg:** Son productos tipo "Vaca Lechera" con altísima visibilidad de precio en internet; perderíamos volumen de tracción.
2. **SÍ subir entre 6% y 8% en Alimentos a Granel y Farmacia:** El cliente valora la conveniencia por kilo y la inmediatez de la pipeta/antipulgas. Esto inyecta **$445,290 adicionales directos a caja cada 30 días**.
3. **Poner candado inmediato a las mermas de granel:** Exigir balanza calibrada y dispensadores herméticos para recuperar el 2% de merma ($82,000/mes).

### 5. Plan de Acción 30-60-90 Días
- **Días 1 a 30 (Inmediato):** Reprecio en sistema POS del catálogo granel (+7%) y pipetas (+5%). Responsable: Gerente de Tienda. KPI: Margen granel > 52%.
- **Días 31 a 60:** Lanzamiento de combos cerrados ("Saco 15kg + Pipeta antipulgas con 5% de descuento bundle"). Responsable: Encargado Comercial. KPI: AOV > $36,000.
- **Días 61 a 90:** Auditoría de elasticidad cruzada y renegociación de costo con proveedores con base en volumen consolidado. Responsable: Dirección. KPI: COGS reducido en 1.5%.

### 6. Riesgos y Qué Vigilar
- **Tipo de Cambio USD/MXN:** Royal Canin y Pro Plan ajustan lista cuando el dólar sube más de 4%; vigilar cobertura cambiaria.
- **Inflación y Tasas Banxico (~10.5%):** Evitar financiar compras de stock a crédito bancario de corto plazo con CAT > 28%.`;
  }

  // 2. SPECIFIC SCENARIO: CAPEX / 2ND STORE EXPANSION
  if (qLower.includes('capex') || qLower.includes('sucursal') || qLower.includes('inversion') || qLower.includes('abrir') || qLower.includes('expansion')) {
    return `### 1. Diagnóstico Ejecutivo de Inversión (CAPEX)
La apertura de una segunda sucursal para PetStock exige **$850,000 MXN de inversión inicial total** (obra y mobiliario $320k, inventario inicial $280k, depósitos y permisos $100k, y colchón de capital de trabajo para 3 meses de gasto fijo $150k). Con la tienda matriz generando un EBITDA mensual de **$2,335,350**, el negocio cuenta con capacidad de tracción, pero **en ningún caso debe fondearse desangrando la caja operativa ni contratando deuda cara a tasas de Banxico del 11% + spread bancario (costo financiero real > 22% anual).**

### 2. Hallazgos Clave & Semáforo Financiero del Proyecto
| Métrica Financiera del CAPEX | Valor Proyectado | Criterio de Aprobación CFO | Semáforo | Veredicto Técnico |
| :--- | :--- | :--- | :--- | :--- |
| Inversión Inicial Total | $850,000 MXN | Presupuesto delimitado | 🟢 Verde | Incluye 3 meses de capital de trabajo para absorción de curva. |
| Payback (Periodo de Recuperación) | 16.4 meses | < 36 meses (3 años) | 🟢 Verde | Recuperación rápida con flujo estimado de $52,000/mes. |
| WACC (Tasa de Descuento México) | 16.5% anual | Referencia PYME México (15-18%) | 🟡 Amarillo | Refleja CETES ~10.5% + 6 pts de prima de riesgo comercial. |
| VPN a 3 Años (Flujos Descontados) | +$318,450 MXN | VPN > 0 | 🟢 Verde | El proyecto genera valor económico agregado sobre el costo de capital. |
| TIR del Proyecto | 28.4% anual | > WACC + 5 pts (> 21.5%) | 🟢 Verde | Rentabilidad interna atractiva para retail de mascotas. |
| Punto de Equilibrio Nueva Sucursal | $385,000 / mes | < 65% de ventas objetivo ($600k) | 🟢 Verde | Con 18 tickets diarios de $700 MXN la sucursal no pierde dinero. |

### 3. Simulación de 3 Escenarios de Desempeño
- **Escenario Conservador (Ventas 25% abajo de la meta, atraso de 2 meses en permisos):**
  - Facturación mensual: **$450,000** | EBITDA mensual: **$28,000** | Payback: **30.4 meses** | VPN: **+$42,000**. Proyecto no quiebra pero deja retorno modesto.
- **Escenario Base (Ventas de $620,000 al mes 6, margen bruto 42%):**
  - Facturación mensual: **$620,000** | EBITDA mensual: **$64,000** | Payback: **16.4 meses** | VPN: **+$318,450**.
- **Escenario Agresivo (Adopción inmediata, ventas $820,000/mes con peluquería/veterinaria):**
  - Facturación mensual: **$820,000** | EBITDA mensual: **$112,000** | Payback: **10.5 meses** | VPN: **+$680,000**.

### 4. Recomendación de CFO
**Veredicto Oficial: SÍ APROBADO, pero bajo 2 condiciones no negociables de financiamiento:**
1. **Estructura de Capital 70/30:** Aportar $600,000 de flujo acumulado propio y financiar máximo $250,000 mediante crédito de proveedores a 60 días para el inventario inicial (costo financiero 0%). **Cero deuda bancaria a tasa variable.**
2. **Punto de aborto (Gatillo de salida):** Si al mes 6 la sucursal no factura al menos $385,000 mensuales (punto de equilibrio) y acumula un déficit de caja superior a $120,000, se liquida el inventario, se traspasa el local y se frena la pérdida.

### 5. Plan de Ejecución 30-60-90 Días
- **Días 1 a 30:** Firma de contrato de arrendamiento con periodo de gracia de 60 días de renta para adecuaciones. Responsable: Director General. KPI: Costo de renta < $25,000/mes.
- **Días 31 a 60:** Adecuación física de piso y recepción de inventario matriz (replicar top 20% de productos Estrella de la matriz BCG). Responsable: Operaciones. KPI: Desviación de obra < 5%.
- **Días 61 a 90:** Apertura comercial y lanzamiento de volanteo geolocalizado en un radio de 2 km. Responsable: Marketing. KPI: 15 tickets diarios desde semana 2.

### 6. Riesgos Críticos y Qué Vigilar
- **Canibalización de Tienda Matriz:** Asegurar que la nueva sucursal esté a más de 3.5 km para capturar clientes nuevos y no dividir a los actuales.
- **Riesgo de Inventario Ocioso:** No abastecer productos categoría "Hueso"; operar con reposición diaria "just-in-time" desde la bodega central.`;
  }

  // 3. DEFAULT: GENERAL EXECUTIVE AUDIT & 11-RATIO SEMAPHORE
  return `### 1. Diagnóstico Financiero Ejecutivo
PetStock opera con un modelo de negocio comercialmente rentable, generando **$${sales.toLocaleString('es-MX')}** en ventas y un margen EBITDA robusto del **${ebitdaMargin.toFixed(1)}% ($${ebitda.toLocaleString('es-MX')})**, pero la **salud de caja está expuesta por ineficiencias de capital de trabajo**: tenemos **$${inventory.toLocaleString('es-MX')} inmovilizados en inventario (DSI de ${dsi.toFixed(1)} días)** y una pérdida mensual de **$${shrinkage.toLocaleString('es-MX')} por mermas en granel (${shrinkageRate.toFixed(1)}%)**. Con tasas de interés en México al 10.5-11% (Banxico/CETES), mantener stock lento equivale a quemar dinero vivo. La prioridad directiva es liberar liquidez atrapada en bodega antes de buscar crecimiento en volumen.

### 2. Hallazgos Clave & Semáforo de Ratios Financieros
| Indicador Clave (KPI) | Cifra PetStock | Rango Base PYME México | Semáforo | Diagnóstico del CFO |
| :--- | :--- | :--- | :--- | :--- |
| Caja en Meses de Gasto Fijo | 2.2 meses | Verde > 3.0m \| Amarillo 1.5-3.0m | 🟡 Amarillo | Colchón suficiente para 65 días de nómina y rentas; vigilar semanal. |
| Razón Circulante (Activo/Pasivo) | 1.85x | Verde > 1.5x \| Rojo < 1.0x | 🟢 Verde | Buena solvencia de corto plazo para responder a compromisos comerciales. |
| Prueba Ácida ((Act-Inv)/Pasivo) | 0.88x | Verde > 1.0x \| Amarillo 0.7-1.0x | 🟡 Amarillo | Alta dependencia de liquidar inventario para pagar pasivos corrientes. |
| Ciclo Conversión Efectivo (CCC) | 44.1 días | Verde < 45d \| Amarillo 46-75d | 🟢 Verde | En rango óptimo gracias a cobro inmediato en punto de venta (DSO 0d). |
| Días de Cobro (DSO) | 0.0 días | Verde < 35d \| Rojo > 50d | 🟢 Verde | Excelencia de retail físico: 100% cobro de contado o tarjeta (caja inmediata). |
| Margen Bruto Ponderado | ${marginPct.toFixed(1)}% | Verde > 38% \| Amarillo 33-38% | 🟢 Verde | Muy superior al promedio de retail (35-38%), impulsado por granel (50.2%). |
| Margen Operativo (EBITDA) | ${ebitdaMargin.toFixed(1)}% | Verde > 15% \| Rojo < 8% | 🟢 Verde | Sobresaliente; estructura ligera de gastos operativos fijos ($${expenses.toLocaleString('es-MX')}). |
| Deuda Neta / EBITDA | 0.8x | Verde < 2.5x \| Rojo > 3.5x | 🟢 Verde | Nivel de apalancamiento sumamente sano y sin riesgo de insolvencia. |
| Cobertura de Intereses | 5.2x | Verde > 3.0x \| Rojo < 2.0x | 🟢 Verde | Capacidad holgada para servir cualquier línea de crédito operativa. |
| LTV / CAC Estimado | 3.6x | Verde > 3.0x \| Rojo < 2.0x | 🟢 Verde | Clientes recurrentes con compras mensuales de alimento amortizan rápido el costo. |
| Churn Mensual de Clientes | 4.8% | Verde < 3% \| Amarillo 3-6% | 🟡 Amarillo | Pérdida de 5 de cada 100 clientes frecuentes; requiere programa de lealtad. |

### 3. Simulación de 3 Escenarios Financieros a 90 Días
- **Escenario Conservador (Estancamiento de ventas 0%, mermas se mantienen en 4.2%):**
  - Facturación mensual: **$10,800,000** | EBITDA: **$2,335,000** | Generación de caja libre: **+$1,850,000/mes**.
- **Escenario Base (Reducción de mermas al 2.0% + rotación de stock hueso, ventas +4%):**
  - Facturación mensual: **$11,230,000** | EBITDA: **$2,580,000** | Generación de caja libre: **+$2,190,000/mes** (+$340,000 en caja).
- **Escenario Agresivo (Optimización de granel + aumento de 6% en ticket promedio por cross-selling):**
  - Facturación mensual: **$11,850,000** | EBITDA: **$2,890,000** | Generación de caja libre: **+$2,540,000/mes** (+$690,000 en caja).

### 4. Recomendación de CFO
**Dictamen Directivo: CERO EXPANSIONES HASTA BLINDAR CAPITAL DE TRABAJO.**
1. **Atacar la merma en granel de inmediato (Regla 48h):** El KPI de merma (${shrinkageRate.toFixed(1)}%) drena $173,200 mensuales. Se debe auditar el fraccionamiento diario de sacos y calibrar básculas; reducirlo a 1.5% inyecta **$110,000 netos al mes a la cuenta bancaria**.
2. **Bajar DSI de 47 a 35 días:** Rematar con descuento del 15% los productos categoría "Hueso" de la matriz BCG para liberar **$1,400,000 en efectivo líquido**.
3. **Mantener caja disponible en más de 3 meses de gasto ($7.5M):** Crear fondo de contingencia ante volatilidad cambiaria.

### 5. Plan de Acción 30-60-90 Días
- **Días 1 a 30 (Choque de Caja):**
  - Implementar bitácora obligatoria de mermas por turno y pesaje ciego. Responsable: Jefe de Bodega. KPI: Merma < 2.5%.
  - Liquidación de inventario con rotación menor a 0.5x. Responsable: Gerente de Ventas. KPI: Liberar $600,000 en caja.
- **Días 31 a 60 (Margen & Cobranza):**
  - Negociar con proveedores líderes (Royal Canin / Mars) descuento de pronto pago del 3% a 15 días. Responsable: CFO / Compras. KPI: Ahorro de $180,000 en COGS.
  - Implementar bundles automáticos de venta cruzada en POS (Alimento + Antipulgas). Responsable: TI / POS. KPI: AOV > $36,000.
- **Días 61 a 90 (Institucionalización):**
  - Consolidar flujo de caja proyectado a 13 semanas móvil. Responsable: Tesorería. KPI: 100% pagos a proveedores cubiertos sin sobregiro.

### 6. Riesgos Críticos y Qué Vigilar
- **Concentración de Proveedores:** Más del 45% del volumen depende de 2 distribuidores de alimentos premium; desarrollar alternativas de segundas marcas.
- **Tasa de Interés Banxico:** Si se toma factoraje o crédito de inventario, verificar que el CAT no rebase el 18% anual.`;
}
