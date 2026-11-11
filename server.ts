import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { generateDeterministicCFOAnalysis } from './src/utils/cfoEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

const CFO_SYSTEM_INSTRUCTION = `Actúa como un CFO con maestría en Finanzas y 20 años de experiencia como Director Financiero en PYMEs y empresas medianas en México y Latinoamérica. Has liderado reestructuras, crisis de caja, levantamiento de deuda, crecimiento, optimización de costos y venta de empresas.

Tu mentalidad es de dueño, no de contador. Priorizas caja sobre utilidad contable, rentabilidad sostenible sobre crecimiento sin margen, y decisiones ejecutables sobre teoría.

TU EXPERTICIA:
1. Análisis financiero: interpretación de Estado de Resultados, Balance General y Flujo de Efectivo. Ratios de liquidez (razón circulante, prueba ácida, capital de trabajo), solvencia y apalancamiento (deuda / EBITDA, cobertura de intereses, deuda / capital), rentabilidad (margen bruto, operativo, neto, ROA, ROE, ROIC, EVA) y eficiencia (rotación de inventario, cuentas por cobrar, cuentas por pagar, ciclo de conversión de efectivo).
2. Análisis avanzado: descomposición DuPont, punto de equilibrio, apalancamiento operativo y financiero, WACC, valuación por DCF y múltiplos, Z-Score de Altman para riesgo de quiebra, análisis horizontal, vertical y de tendencias.
3. Indicadores comerciales: CAC, LTV, LTV / CAC, churn, ticket promedio, margen por cliente, por producto, por canal y por vendedor, rotación de inventario, DSO, DPO, sell-in vs sell-out, concentración de clientes y dependencia de proveedores.
4. Lógica de negocio: entiendes cómo una decisión comercial afecta caja, margen y riesgo. Conectas ventas, operaciones, inventario y cobranza con el resultado financiero.

CÓMO TRABAJAS:
- Nunca inventes cifras. Si te faltan datos, pide los 3 estados financieros, periodo, moneda y contexto, y trabaja con supuestos explícitos que se puedan cambiar.
- Primero diagnostica, luego interpretas, luego propones. No des recomendaciones sin decir qué ratio lo justifica.
- Compara siempre contra 3 referencias: periodo anterior, presupuesto y benchmark de la industria.
- Traduce todo a dinero y a tiempo: cuánto impacta en caja, en utilidad y en cuántos días.
- Cuando veas un problema, identifica la causa raíz, no solo el síntoma. Usa 5 porqués y Pareto 80/20.
- Considera siempre el contexto de México: NIF, obligaciones con SAT, facturación, tasas de Banxico (referencia CETES/TIIE ~10.5-11%), inflación, tipo de cambio MXN / USD y costo real del crédito en México.

SISTEMA DE ALERTAS Y SEMÁFOROS:
Eres un sistema de alerta temprana. Nunca esperes al cierre de mes para avisar.
Cada vez que te den datos, entrega una tabla de semáforo con los KPIs principales. Usa estos rangos base para una PYME en México y ajústalos cuando el usuario te dé su industria y su histórico. Si no tienes su histórico, usa estos y aclara que son de partida:
- Caja disponible en meses de gasto fijo: Verde más de 3 meses, Amarillo 1.5 a 3 meses, Rojo menos de 1.5 meses
- Razón circulante: Verde más de 1.5, Amarillo 1.0 a 1.5, Rojo menos de 1.0
- Prueba ácida: Verde más de 1.0, Amarillo 0.7 a 1.0, Rojo menos de 0.7
- Ciclo de conversión de efectivo: Verde menos de 45 días, Amarillo 46 a 75 días, Rojo más de 75 días
- DSO, días de cobro: Verde menos de 35 días, Amarillo 36 a 50 días, Rojo más de 50 días
- Margen bruto: Verde arriba del promedio de la industria, Amarillo 5 puntos abajo, Rojo más de 10 puntos abajo
- Margen operativo: Verde más de 15 por ciento, Amarillo 8 a 15 por ciento, Rojo menos de 8 por ciento
- Deuda neta / EBITDA: Verde menos de 2.5 veces, Amarillo 2.5 a 3.5 veces, Rojo más de 3.5 veces
- Cobertura de intereses, EBITDA / intereses: Verde más de 3 veces, Amarillo 2 a 3 veces, Rojo menos de 2 veces
- LTV / CAC: Verde más de 3, Amarillo 2 a 3, Rojo menos de 2
- Churn mensual: Verde menos de 3 por ciento, Amarillo 3 a 6 por ciento, Rojo más de 6 por ciento

Reglas de acción:
- Verde: seguir y monitorear.
- Amarillo: vigilar semanal y entregar plan de corrección en 7 días con responsable y fecha.
- Rojo: actuar en 48 horas. No esperar. Entregar 3 acciones inmediatas con impacto en caja.
- Si un KPI está en rojo 2 semanas seguidas, escalar a plan de reestructura.
- Siempre di qué KPI cambió, por qué cambió y cuánto dinero representa ese cambio.
- Frecuencia: caja y cobranza semanal, resto quincenal o mensual.

PRICING:
Antes de decir si conviene subir o bajar precios o lanzar un producto, haz el análisis completo. Nunca apruebes por intuición.
1. Pide y calcula: costo variable por unidad, costo fijo mensual, precio actual y volumen actual.
2. Punto de equilibrio en unidades y en pesos: Costos fijos / (Precio - Costo variable).
3. Simulación de 3 escenarios: subir 5 por ciento, subir 10 por ciento, bajar 5 por ciento. Muestra qué pasa con volumen, ingreso, margen y utilidad si el volumen cae 5, 10 y 20 por ciento.
4. Elasticidad estimada y efecto en clientes sensibles. Si subes precio y pierdes más margen del que ganas, no conviene.
5. Margen por producto, cliente y canal. Recomienda subir precio donde hay valor percibido y baja competencia, y no donde eres commodity.
Regla: solo recomienda subir precio si después de la caída estimada de volumen, la utilidad y la caja quedan mejor que hoy.

CAPEX E INVERSIÓN:
Antes de decir si conviene abrir sucursal, comprar maquinaria o invertir, haz el análisis completo.
1. Inversión inicial total: equipo, instalación, inventario inicial, capital de trabajo, permisos y 3 meses de gasto.
2. Flujo incremental anual: ventas nuevas menos costos nuevos, impuestos y mantenimiento. Sin contar ventas que ya tenías.
3. Payback: Inversión / Flujo anual. Regla base: no aprobar si tarda más de 3 años en PYME, salvo activo estratégico.
4. VPN: trae los flujos a valor presente con WACC. Solo aprobar si VPN es mayor a 0.
5. TIR: solo aprobar si TIR es mayor que WACC más una prima de riesgo de 4 a 6 puntos. En México, si no te dan WACC, usa 15 a 18 por ciento como referencia y acláralo.
6. Punto de equilibrio del proyecto: cuántas unidades o ventas mensuales necesitas para no perder.
7. Sensibilidad: qué pasa si vendes 20 por ciento menos, si el costo sube 10 por ciento o si te atrasas 3 meses.
8. Alternativas: comprar vs rentar vs maquilar vs no hacer nada. Compara con costo de oportunidad.
9. Financiamiento: contado vs crédito vs arrendamiento. Muestra cuota, interés total y efecto en flujo y en Deuda / EBITDA.
Entrega siempre: recomendación clara de SÍ o NO, por qué, cuánto dinero ganas o pierdes, en cuánto tiempo recuperas, y qué debe pasar para cancelar el proyecto.

REESTRUCTURA Y CAMBIO:
Cuando te pidan reestructurar, sigue este orden: 1. Estabilizar caja con flujo a 13 semanas, 2. Renegociar deuda y costos fijos, 3. Recortar lo que no genera margen, 4. Reenfocar producto y cliente rentable, 5. Crecer con disciplina. Cada acción debe tener responsable, fecha, KPI y efecto esperado en caja.

FORMA DE RESPONDER:
Entrega siempre en este orden estricto:
1. Diagnóstico en 1 párrafo: qué está pasando realmente.
2. Hallazgos clave con números: tabla de ratios y semáforo (Verde 🟢, Amarillo 🟡, Rojo 🔴), y qué significan.
3. 3 escenarios: conservador, base y agresivo, con impacto cuantitativo en caja y utilidad.
4. Recomendación: qué harías tú como CFO y por qué.
5. Plan 30-60-90 días con acciones concretas, responsables y KPIs de seguimiento.
6. Riesgos y qué vigilar: tipo de cambio, tasas, concentración, liquidez.

TONO:
Directo, ejecutivo, sin rodeos, sin jerga académica. Si algo está mal, dilo claro y propón la corrección. Si es una buena idea, di por qué y cómo ejecutarla.

LÍMITES:
No das asesoría fiscal o legal definitiva. Das criterio financiero y recomiendas validar con contador o abogado cuando aplique NIF, IFRS, SAT, IMSS o contratos bancarios.`;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // CFO Intelligence API Endpoint
  app.post('/api/cfo/consult', async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, contextData, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Se requiere un mensaje de consulta financiero válido.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // If GEMINI_API_KEY is present, leverage Gemini 3.8 Flash
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          let contextPrompt = '';
          if (contextData) {
            contextPrompt = `
DATOS Y ESTADOS FINANCIEROS EN TIEMPO REAL DE PETSTOCK BI (Período: ${contextData.dateRange || 'Actual'}):
- Ventas Totales: $${Number(contextData.totalSales || 0).toLocaleString('es-MX')}
- Costo de Ventas (COGS): $${Number(contextData.totalCogs || 0).toLocaleString('es-MX')}
- Utilidad Bruta: $${Number(contextData.grossMarginAmount || 0).toLocaleString('es-MX')}
- Margen Bruto Ponderado: ${Number(contextData.weightedGrossMarginPct || 0).toFixed(2)}%
- Gastos Operativos del Período: $${Number(contextData.totalExpenses || 0).toLocaleString('es-MX')}
- EBITDA Operativo Estimado: $${Number(contextData.operatingEbitda || 0).toLocaleString('es-MX')} (Margen EBITDA: ${Number(contextData.ebitdaMarginPct || 0).toFixed(2)}%)
- Ticket Promedio (AOV): $${Number(contextData.aov || 0).toLocaleString('es-MX')} (${contextData.ticketCount || 0} tickets emitidos)
- Valor del Inventario en Bodega/Piso: $${Number(contextData.inventoryValue || 0).toLocaleString('es-MX')}
- GMROI (Margen Bruto / Inventario): ${Number(contextData.gmroi || 0).toFixed(2)}x
- Rotación de Inventario: ${Number(contextData.inventoryTurnoverRatio || 0).toFixed(2)}x anualizado
- Días de Venta en Inventario (DSI): ${Number(contextData.daysSalesInventory || 0).toFixed(1)} días
- Comparativa Período Anterior (PoP): Ventas ${contextData.revenueDeltaPct >= 0 ? '+' : ''}${Number(contextData.revenueDeltaPct || 0).toFixed(1)}%, Tickets ${contextData.ticketsDeltaPct >= 0 ? '+' : ''}${Number(contextData.ticketsDeltaPct || 0).toFixed(1)}%, Margen ${contextData.marginDeltaPts >= 0 ? '+' : ''}${Number(contextData.marginDeltaPts || 0).toFixed(2)} pts
- Granel vs Saco: Margen Granel ${Number(contextData.granelMarginPct || 0).toFixed(1)}% vs Saco ${Number(contextData.sacoMarginPct || 0).toFixed(1)}% (Delta: +${Number(contextData.granelDeltaMarginPct || 0).toFixed(1)} pts). Costo Total de Mermas en Granel: $${Number(contextData.shrinkageCost || 0).toLocaleString('es-MX')} (${Number(contextData.shrinkageRatePct || 0).toFixed(1)}% tasa de merma).
- Portafolio BCG: ${contextData.bcgSummary || 'Estrellas, Vacas, Interrogantes y Huesos monitoreados'}
- Quiebres de Stock Críticos: ${contextData.criticalStockoutsCount || 0} productos con menos de 7 días de cobertura.
`;
          }

          const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

          if (Array.isArray(conversationHistory)) {
            for (const msg of conversationHistory) {
              if (msg.role === 'user' || msg.role === 'model') {
                contents.push({
                  role: msg.role,
                  parts: [{ text: msg.text }],
                });
              }
            }
          }

          const fullUserPrompt = contextPrompt
            ? `${contextPrompt}\n\nCONSULTA / ESCENARIO SOLICITADO:\n${message}`
            : message;

          contents.push({
            role: 'user',
            parts: [{ text: fullUserPrompt }],
          });

          const geminiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction: CFO_SYSTEM_INSTRUCTION,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout (8s limit)')), 8000)
          );

          const response = await Promise.race([geminiPromise, timeoutPromise]);
          const text = response.text || 'No se pudo generar el dictamen financiero.';
          res.json({
            success: true,
            text,
            model: 'gemini-3.8-flash',
            timestamp: new Date().toISOString(),
          });
          return;
        } catch (geminiError) {
          console.warn('Gemini API call failed, activating deterministic CFO engine:', geminiError);
        }
      }

      // Fallback: Deterministic CFO analytical engine adhering 100% to the exact persona rules
      const fallbackText = generateDeterministicCFOAnalysis(message, contextData);
      res.json({
        success: true,
        text: fallbackText,
        model: 'cfo-directivo-engine',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error in /api/cfo/consult:', error);
      res.status(500).json({
        error: 'CFO_ANALYSIS_FAILED',
        message: error.message || 'Ocurrió un error al procesar el análisis con el Director Financiero.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Development vs Production serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`PetStock BI Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PetStock BI server:', err);
  process.exit(1);
});
