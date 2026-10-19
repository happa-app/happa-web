// Quién está detrás de HAPPA (el "titular"). La ley española de servicios de internet (LSSI, artículo 10)
// obliga a que cualquiera pueda ver estos datos. Salen en los términos de uso.
//
// ⚠ PENDIENTE: rellenadlo antes del lanzamiento (lo decide quien lleve la parte legal). Mientras un
// dato esté en null, la página enseña "[pendiente: …]" en su lugar.
// Ojo: este repositorio es público. Si el titular es una persona (y no una empresa), su NIF y su
// domicilio quedarán a la vista de todo el mundo, aquí y en la web.
export const LEGAL_OWNER: {
  // Nombre y apellidos o razón social (por ejemplo, "HAPPA S.L.")
  name: string | null;
  // NIF (o CIF de la empresa)
  taxId: string | null;
  // Domicilio completo
  address: string | null;
  // Datos del Registro Mercantil, si es una empresa inscrita (si no, null)
  registry: string | null;
} = {
  name: null,
  taxId: null,
  address: null,
  registry: null,
};

// Correos públicos
export const CONTACT_EMAIL = "contacto@happa.es";
export const PRIVACY_EMAIL = "privacidad@happa.es";
