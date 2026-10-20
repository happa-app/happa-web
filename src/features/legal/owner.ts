// Quién está detrás de HAPPA (el "titular"). La ley española de servicios de internet (LSSI, artículo 10)
// obliga a que cualquiera pueda ver estos datos: salen en los términos de uso y en la política de privacidad.
//
// Este repositorio es público: los datos NO se escriben aquí, sino en variables de entorno (en Vercel →
// Settings → Environment Variables, y en .env.local si quieres verlos en tu ordenador). Así no quedan en
// GitHub, aunque sí se ven en happa.es, como manda la ley. Si falta alguno, la página enseña
// "[pendiente: …]" en su lugar.
//
// Hay que escribir process.env.NEXT_PUBLIC_... tal cual (no con corchetes): Next solo las sustituye si
// las ve escritas literalmente.
function value(raw: string | undefined): string | null {
  const text = raw?.trim();
  return text ? text : null;
}

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
  name: value(process.env.NEXT_PUBLIC_LEGAL_OWNER_NAME),
  taxId: value(process.env.NEXT_PUBLIC_LEGAL_OWNER_NIF),
  address: value(process.env.NEXT_PUBLIC_LEGAL_OWNER_ADDRESS),
  registry: null,
};

// Correos públicos (buzones en Zoho Mail)
export const CONTACT_EMAIL = "contacto@happa.es";
export const PRIVACY_EMAIL = "privacidad@happa.es";
