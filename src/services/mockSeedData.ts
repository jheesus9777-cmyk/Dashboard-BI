import { Product, Sale, KardexEntry, Expense } from '../types/bi';

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_rc_maxi_15kg',
    name: 'Royal Canin Maxi Adult Saco 15kg',
    sku: 'RC-MAXI-15K',
    category: 'Alimentos Perro',
    formatType: 'saco',
    stock: 24,
    costPrice: 42000,
    salePrice: 58990,
    unitOfMeasure: 'unidad',
    minStock: 10,
  },
  {
    id: 'prod_bravecto_10_20',
    name: 'Bravecto Antipulgas y Garrapatas 10-20kg',
    sku: 'BV-1020-TAB',
    category: 'Farmacia & Pipetas',
    formatType: 'unidad',
    stock: 38,
    costPrice: 16500,
    salePrice: 31990,
    unitOfMeasure: 'unidad',
    minStock: 12,
  },
  {
    id: 'prod_nexgard_spect_7_15',
    name: 'NexGard Spectra 7.5-15kg Masticable',
    sku: 'NX-SP-715',
    category: 'Farmacia & Pipetas',
    formatType: 'unidad',
    stock: 45,
    costPrice: 13200,
    salePrice: 24990,
    unitOfMeasure: 'unidad',
    minStock: 15,
  },
  {
    id: 'prod_proplan_granel',
    name: 'Pro Plan Adult Razas Medianas Granel Kg',
    sku: 'PP-MED-GRA',
    category: 'Alimentos Perro',
    formatType: 'granel',
    stock: 140, // 140 kg
    costPrice: 2900,
    salePrice: 5990,
    unitOfMeasure: 'kg',
    minStock: 40,
  },
  {
    id: 'prod_dogchow_granel',
    name: 'Dog Chow Adultos Pollo & Carne Granel Kg',
    sku: 'DC-AD-GRA',
    category: 'Alimentos Perro',
    formatType: 'granel',
    stock: 220, // 220 kg
    costPrice: 1600,
    salePrice: 3290,
    unitOfMeasure: 'kg',
    minStock: 60,
  },
  {
    id: 'prod_catchow_granel',
    name: 'Cat Chow Delimix Adultos Granel Kg',
    sku: 'CC-DELI-GRA',
    category: 'Alimentos Gato',
    formatType: 'granel',
    stock: 160,
    costPrice: 1950,
    salePrice: 3990,
    unitOfMeasure: 'kg',
    minStock: 50,
  },
  {
    id: 'prod_arena_bentonita_10kg',
    name: 'Arena Sanitaria Aglomerante Bentonita 10kg',
    sku: 'AR-BENT-10K',
    category: 'Higiene & Arenas',
    formatType: 'saco',
    stock: 52,
    costPrice: 5800,
    salePrice: 10990,
    unitOfMeasure: 'unidad',
    minStock: 20,
  },
  {
    id: 'prod_greenies_regular',
    name: 'Snacks Dentales Greenies Regular 12u',
    sku: 'SNK-GRN-12',
    category: 'Accesorios & Juguetes',
    formatType: 'unidad',
    stock: 35,
    costPrice: 7200,
    salePrice: 13490,
    unitOfMeasure: 'unidad',
    minStock: 10,
  },
  {
    id: 'prod_rascador_castillo',
    name: 'Rascador Castillo 3 Niveles con Hamaca',
    sku: 'ACC-RASC-03',
    category: 'Accesorios & Juguetes',
    formatType: 'unidad',
    stock: 6,
    costPrice: 28000,
    salePrice: 62990,
    unitOfMeasure: 'unidad',
    minStock: 3,
  },
  {
    id: 'prod_seresto_perro',
    name: 'Collar Antiparasitario Seresto Perros >8kg',
    sku: 'SER-LGE-01',
    category: 'Farmacia & Pipetas',
    formatType: 'unidad',
    stock: 14,
    costPrice: 27500,
    salePrice: 49990,
    unitOfMeasure: 'unidad',
    minStock: 5,
  },
  {
    id: 'prod_pelota_goma_mini',
    name: 'Pelota de Goma Maciza Dental Pequeña',
    sku: 'TOY-BALL-SM',
    category: 'Accesorios & Juguetes',
    formatType: 'unidad',
    stock: 48,
    costPrice: 2100,
    salePrice: 2800,
    unitOfMeasure: 'unidad',
    minStock: 10,
  },
  {
    id: 'prod_comedero_plastico_eco',
    name: 'Plato Comedero Plástico Básico 350ml',
    sku: 'ACC-BOWL-ECO',
    category: 'Accesorios & Juguetes',
    formatType: 'unidad',
    stock: 65,
    costPrice: 1100,
    salePrice: 1490,
    unitOfMeasure: 'unidad',
    minStock: 15,
  },
  {
    id: 'prod_cepillo_cardina',
    name: 'Cardina Peine de Cerdas Plásticas',
    sku: 'HIG-BRSH-01',
    category: 'Higiene & Arenas',
    formatType: 'unidad',
    stock: 22,
    costPrice: 2400,
    salePrice: 3100,
    unitOfMeasure: 'unidad',
    minStock: 8,
  },
];

// Helper to generate seed sales with realistic distribution
function createSeedSales(): Sale[] {
  const sales: Sale[] = [];
  const baseDate = new Date(2026, 10, 8); // Early Nov 2026

  // Deterministic seed transactions
  const hourWeights = [
    // 00 to 07
    0, 0, 0, 0, 0, 0, 0, 0,
    // 08 to 11
    1, 3, 6, 8,
    // 12 to 14 (lunch peak)
    9, 8, 5,
    // 15 to 17
    5, 7, 9,
    // 18 to 20 (evening golden peak)
    10, 8, 4,
    // 21 to 23
    1, 0, 0,
  ];

  let ticketIdCounter = 1000;

  for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(baseDate);
    dayDate.setDate(dayDate.getDate() - daysAgo);
    const dayOfWeek = dayDate.getDay(); // 0 is Sunday, 6 is Saturday

    // Weekend multiplier
    const dayVolume = dayOfWeek === 6 ? 9 : dayOfWeek === 0 ? 5 : 6;

    for (let i = 0; i < dayVolume; i++) {
      ticketIdCounter++;
      // Pick hour based on weights
      let chosenHour = 10 + (i % 10);
      if (i % 3 === 0) chosenHour = 12; // lunch rush
      if (i % 4 === 0) chosenHour = 18; // evening rush
      if (dayOfWeek === 6 && i % 2 === 0) chosenHour = 11; // saturday morning rush

      const minute = (i * 17) % 60;
      const saleDate = new Date(dayDate);
      saleDate.setHours(chosenHour, minute, 0, 0);

      // Create basket patterns
      const basketType = i % 5;
      const items = [];

      if (basketType === 0) {
        // High Value Dog Care Bundle (RC Saco + Bravecto + Greenies)
        items.push({
          productId: 'prod_rc_maxi_15kg',
          productName: 'Royal Canin Maxi Adult Saco 15kg',
          sku: 'RC-MAXI-15K',
          category: 'Alimentos Perro',
          formatType: 'saco' as const,
          quantity: 1,
          unitPrice: 58990,
          unitCost: 42000,
          subtotal: 58990,
        });
        items.push({
          productId: 'prod_bravecto_10_20',
          productName: 'Bravecto Antipulgas y Garrapatas 10-20kg',
          sku: 'BV-1020-TAB',
          category: 'Farmacia & Pipetas',
          formatType: 'unidad' as const,
          quantity: 1,
          unitPrice: 31990,
          unitCost: 16500,
          subtotal: 31990,
        });
        if (i % 2 === 0) {
          items.push({
            productId: 'prod_greenies_regular',
            productName: 'Snacks Dentales Greenies Regular 12u',
            sku: 'SNK-GRN-12',
            category: 'Accesorios & Juguetes',
            formatType: 'unidad' as const,
            quantity: 1,
            unitPrice: 13490,
            unitCost: 7200,
            subtotal: 13490,
          });
        }
      } else if (basketType === 1) {
        // Granel Dog Food + Nexgard
        const kg = 4 + (i % 6);
        items.push({
          productId: 'prod_proplan_granel',
          productName: 'Pro Plan Adult Razas Medianas Granel Kg',
          sku: 'PP-MED-GRA',
          category: 'Alimentos Perro',
          formatType: 'granel' as const,
          isGranel: true,
          quantity: kg,
          unitPrice: 5990,
          unitCost: 2900,
          subtotal: 5990 * kg,
        });
        items.push({
          productId: 'prod_nexgard_spect_7_15',
          productName: 'NexGard Spectra 7.5-15kg Masticable',
          sku: 'NX-SP-715',
          category: 'Farmacia & Pipetas',
          formatType: 'unidad' as const,
          quantity: 1,
          unitPrice: 24990,
          unitCost: 13200,
          subtotal: 24990,
        });
      } else if (basketType === 2) {
        // Cat bundle: Cat Chow Granel + Arena Sanitaria Bentonita
        const kg = 3 + (i % 4);
        items.push({
          productId: 'prod_catchow_granel',
          productName: 'Cat Chow Delimix Adultos Granel Kg',
          sku: 'CC-DELI-GRA',
          category: 'Alimentos Gato',
          formatType: 'granel' as const,
          isGranel: true,
          quantity: kg,
          unitPrice: 3990,
          unitCost: 1950,
          subtotal: 3990 * kg,
        });
        items.push({
          productId: 'prod_arena_bentonita_10kg',
          productName: 'Arena Sanitaria Aglomerante Bentonita 10kg',
          sku: 'AR-BENT-10K',
          category: 'Higiene & Arenas',
          formatType: 'saco' as const,
          quantity: 1,
          unitPrice: 10990,
          unitCost: 5800,
          subtotal: 10990,
        });
      } else if (basketType === 3) {
        // High Volume Dog Chow Granel
        const kg = 6 + (i % 8);
        items.push({
          productId: 'prod_dogchow_granel',
          productName: 'Dog Chow Adultos Pollo & Carne Granel Kg',
          sku: 'DC-AD-GRA',
          category: 'Alimentos Perro',
          formatType: 'granel' as const,
          isGranel: true,
          quantity: kg,
          unitPrice: 3290,
          unitCost: 1600,
          subtotal: 3290 * kg,
        });
      } else {
        // Special ticket (e.g. Rascador or Seresto or Toys)
        if (i % 4 === 0) {
          items.push({
            productId: 'prod_rascador_castillo',
            productName: 'Rascador Castillo 3 Niveles con Hamaca',
            sku: 'ACC-RASC-03',
            category: 'Accesorios & Juguetes',
            formatType: 'unidad' as const,
            quantity: 1,
            unitPrice: 62990,
            unitCost: 28000,
            subtotal: 62990,
          });
        } else {
          items.push({
            productId: 'prod_seresto_perro',
            productName: 'Collar Antiparasitario Seresto Perros >8kg',
            sku: 'SER-LGE-01',
            category: 'Farmacia & Pipetas',
            formatType: 'unidad' as const,
            quantity: 1,
            unitPrice: 49990,
            unitCost: 27500,
            subtotal: 49990,
          });
        }
      }

      const totalAmount = items.reduce((acc, it) => acc + it.subtotal, 0);

      sales.push({
        id: `sale_${ticketIdCounter}`,
        ticketNumber: `T-00${ticketIdCounter}`,
        date: saleDate.toISOString(),
        items,
        totalAmount,
        paymentMethod: i % 2 === 0 ? 'Tarjeta Débito / Crédito' : 'Transferencia QR / Efectivo',
        customerType: i % 3 === 0 ? 'frecuente' : 'regular',
      });
    }
  }

  return sales;
}

export const SEED_SALES: Sale[] = createSeedSales();

export const SEED_KARDEX: KardexEntry[] = [
  {
    id: 'kard_01',
    date: '2026-10-15T09:30:00Z',
    productId: 'prod_dogchow_granel',
    productName: 'Dog Chow Adultos Pollo & Carne Granel Kg',
    type: 'MERMA',
    reason: 'Descalce de peso y polvo en tolva granel',
    quantity: 14.5,
    unitCost: 1600,
    totalCost: 23200,
  },
  {
    id: 'kard_02',
    date: '2026-10-22T14:15:00Z',
    productId: 'prod_proplan_granel',
    productName: 'Pro Plan Adult Razas Medianas Granel Kg',
    type: 'MERMA',
    reason: 'Rotura de saco en estantería bodega',
    quantity: 8.2,
    unitCost: 2900,
    totalCost: 23780,
  },
  {
    id: 'kard_03',
    date: '2026-10-28T18:00:00Z',
    productId: 'prod_catchow_granel',
    productName: 'Cat Chow Delimix Adultos Granel Kg',
    type: 'MERMA',
    reason: 'Descalce de peso y polvo en tolva granel',
    quantity: 9.0,
    unitCost: 1950,
    totalCost: 17550,
  },
  {
    id: 'kard_04',
    date: '2026-11-02T11:20:00Z',
    productId: 'prod_greenies_regular',
    productName: 'Snacks Dentales Greenies Regular 12u',
    type: 'MERMA',
    reason: 'Vencimiento snack y pasta húmeda',
    quantity: 2,
    unitCost: 7200,
    totalCost: 14400,
  },
  {
    id: 'kard_05',
    date: '2026-11-05T16:45:00Z',
    productId: 'prod_rc_maxi_15kg',
    productName: 'Royal Canin Maxi Adult Saco 15kg',
    type: 'MERMA',
    reason: 'Rotura de saco en estantería bodega',
    quantity: 1,
    unitCost: 42000,
    totalCost: 42000,
  },
  {
    id: 'kard_06',
    date: '2026-11-07T12:00:00Z',
    productId: 'prod_comedero_plastico_eco',
    productName: 'Plato Comedero Plástico Básico 350ml',
    type: 'MERMA',
    reason: 'Deterioro por manipulación en exhibición',
    quantity: 3,
    unitCost: 1100,
    totalCost: 3300,
  },
];

export const SEED_EXPENSES: Expense[] = [
  // October 2026 (Previous Month)
  {
    id: 'exp_prev_01',
    date: '2026-10-01',
    category: 'Arriendo Local',
    description: 'Arriendo mensual local comercial PetStock Centro (Octubre)',
    amount: 850000,
  },
  {
    id: 'exp_prev_02',
    date: '2026-10-05',
    category: 'Sueldos y Comisiones',
    description: 'Nómina equipo de tienda y comisiones POS (Octubre)',
    amount: 1100000,
  },
  {
    id: 'exp_prev_03',
    date: '2026-10-03',
    category: 'Servicios Básicos',
    description: 'Electricidad, agua potable y fibra óptica (Octubre)',
    amount: 140000,
  },
  {
    id: 'exp_prev_04',
    date: '2026-10-04',
    category: 'Software & Terminales',
    description: 'Licencia sistema POS y comisiones Transbank/Stripe (Octubre)',
    amount: 95000,
  },
  {
    id: 'exp_prev_05',
    date: '2026-10-06',
    category: 'Marketing & Publicidad',
    description: 'Campañas geolocalizadas Meta Ads & Google Maps (Octubre)',
    amount: 160000,
  },
  // November 2026 (Current Month)
  {
    id: 'exp_01',
    date: '2026-11-01',
    category: 'Arriendo Local',
    description: 'Arriendo mensual local comercial PetStock Centro',
    amount: 850000,
  },
  {
    id: 'exp_02',
    date: '2026-11-05',
    category: 'Sueldos y Comisiones',
    description: 'Nómina equipo de tienda y comisiones POS',
    amount: 1150000,
  },
  {
    id: 'exp_03',
    date: '2026-11-03',
    category: 'Servicios Básicos',
    description: 'Electricidad, agua potable y fibra óptica de alta velocidad',
    amount: 145000,
  },
  {
    id: 'exp_04',
    date: '2026-11-04',
    category: 'Software & Terminales',
    description: 'Licencia sistema POS y comisiones Transbank/Stripe',
    amount: 98000,
  },
  {
    id: 'exp_05',
    date: '2026-11-06',
    category: 'Marketing & Publicidad',
    description: 'Campañas geolocalizadas Meta Ads & Google Maps Pet Care',
    amount: 180000,
  },
  {
    id: 'exp_06',
    date: '2026-11-07',
    category: 'Mantenimiento & Logística',
    description: 'Insumos sanitarios, bolsas ecológicas y desinfección semanal',
    amount: 85000,
  },
];

export const DEFAULT_WIDGETS = [
  { id: 'cfo_advisor', title: 'Director Financiero IA (CFO Ejecutivo)', description: 'Auditoría financiera, semáforo de ratios, pricing, CAPEX y plan 30-60-90 días con IA directiva', enabled: true, order: 0 },
  { id: 'executive_radar', title: 'Radar de Alertas Directivas & Oportunidades', description: 'Diagnóstico de riesgos de merma, quiebres y oportunidades comerciales', enabled: true, order: 1 },
  { id: 'kpi_cockpit', title: 'Cockpit de KPIs Directivos & Variación', description: 'GMROI, Ticket Promedio (AOV), Margen Ponderado, EBITDA con comparativa', enabled: true, order: 2 },
  { id: 'predictive_thresholds', title: 'Análisis Predictivo & Umbrales Dinámicos Estacionales', description: 'Calibración predictiva de umbrales basada en varianza estacional, fines de semana y bandas ±σ', enabled: true, order: 3 },
  { id: 'what_if_simulator', title: 'Simulador Directivo de Escenarios (What-If)', description: 'Laboratorio de proyección de precios, reducción de mermas y EBITDA', enabled: true, order: 4 },
  { id: 'stock_coverage', title: 'Días de Cobertura (Runway) & Alerta de Quiebres', description: 'Velocidad de venta diaria, días de inventario restante y capital de reposición', enabled: true, order: 5 },
  { id: 'bcg_matrix', title: 'Matriz BCG de Portafolio', description: 'Clasificación Estrellas, Vacas, Interrogantes y Huesos', enabled: true, order: 6 },
  { id: 'heatmap_7x24', title: 'Mapa de Calor Horario (7x24)', description: 'Franjas de afluencia, ventas e ingresos pico por hora', enabled: true, order: 7 },
  { id: 'market_basket', title: 'Análisis de Venta Cruzada', description: 'Co-ocurrencia en tickets, reglas de asociación y bundles', enabled: true, order: 8 },
  { id: 'granel_vs_saco', title: 'Rendimiento Granel vs Saco & Mermas', description: 'Comparativa de márgenes y tasa de merma del Kardex', enabled: true, order: 9 },
];

