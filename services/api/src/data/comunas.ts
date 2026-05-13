interface ComunaSeed {
  name: string;
  region: string;
  code: string;
}

/**
 * Subset inicial de comunas de Chile (RM completa + capitales regionales).
 * Para producción importar las 346 comunas desde el shapefile de BCN:
 * https://www.bcn.cl/siit/mapas_vectoriales
 */
export const CHILE_COMUNAS: ComunaSeed[] = [
  // Región Metropolitana (52 comunas)
  { name: "Cerrillos", region: "Metropolitana", code: "13102" },
  { name: "Cerro Navia", region: "Metropolitana", code: "13103" },
  { name: "Conchalí", region: "Metropolitana", code: "13104" },
  { name: "El Bosque", region: "Metropolitana", code: "13105" },
  { name: "Estación Central", region: "Metropolitana", code: "13106" },
  { name: "Huechuraba", region: "Metropolitana", code: "13107" },
  { name: "Independencia", region: "Metropolitana", code: "13108" },
  { name: "La Cisterna", region: "Metropolitana", code: "13109" },
  { name: "La Florida", region: "Metropolitana", code: "13110" },
  { name: "La Granja", region: "Metropolitana", code: "13111" },
  { name: "La Pintana", region: "Metropolitana", code: "13112" },
  { name: "La Reina", region: "Metropolitana", code: "13113" },
  { name: "Las Condes", region: "Metropolitana", code: "13114" },
  { name: "Lo Barnechea", region: "Metropolitana", code: "13115" },
  { name: "Lo Espejo", region: "Metropolitana", code: "13116" },
  { name: "Lo Prado", region: "Metropolitana", code: "13117" },
  { name: "Macul", region: "Metropolitana", code: "13118" },
  { name: "Maipú", region: "Metropolitana", code: "13119" },
  { name: "Ñuñoa", region: "Metropolitana", code: "13120" },
  { name: "Pedro Aguirre Cerda", region: "Metropolitana", code: "13121" },
  { name: "Peñalolén", region: "Metropolitana", code: "13122" },
  { name: "Providencia", region: "Metropolitana", code: "13123" },
  { name: "Pudahuel", region: "Metropolitana", code: "13124" },
  { name: "Quilicura", region: "Metropolitana", code: "13125" },
  { name: "Quinta Normal", region: "Metropolitana", code: "13126" },
  { name: "Recoleta", region: "Metropolitana", code: "13127" },
  { name: "Renca", region: "Metropolitana", code: "13128" },
  { name: "San Joaquín", region: "Metropolitana", code: "13129" },
  { name: "San Miguel", region: "Metropolitana", code: "13130" },
  { name: "San Ramón", region: "Metropolitana", code: "13131" },
  { name: "Santiago", region: "Metropolitana", code: "13101" },
  { name: "Vitacura", region: "Metropolitana", code: "13132" },
  { name: "Puente Alto", region: "Metropolitana", code: "13201" },
  { name: "San Bernardo", region: "Metropolitana", code: "13401" },
  { name: "Colina", region: "Metropolitana", code: "13301" },

  // Capitales regionales y ciudades grandes
  { name: "Arica", region: "Arica y Parinacota", code: "15101" },
  { name: "Iquique", region: "Tarapacá", code: "01101" },
  { name: "Antofagasta", region: "Antofagasta", code: "02101" },
  { name: "Copiapó", region: "Atacama", code: "03101" },
  { name: "La Serena", region: "Coquimbo", code: "04101" },
  { name: "Coquimbo", region: "Coquimbo", code: "04102" },
  { name: "Valparaíso", region: "Valparaíso", code: "05101" },
  { name: "Viña del Mar", region: "Valparaíso", code: "05109" },
  { name: "Rancagua", region: "O'Higgins", code: "06101" },
  { name: "Talca", region: "Maule", code: "07101" },
  { name: "Chillán", region: "Ñuble", code: "16101" },
  { name: "Concepción", region: "Biobío", code: "08101" },
  { name: "Talcahuano", region: "Biobío", code: "08108" },
  { name: "Temuco", region: "Araucanía", code: "09101" },
  { name: "Valdivia", region: "Los Ríos", code: "14101" },
  { name: "Puerto Montt", region: "Los Lagos", code: "10101" },
  { name: "Coyhaique", region: "Aysén", code: "11101" },
  { name: "Punta Arenas", region: "Magallanes", code: "12101" },
];
