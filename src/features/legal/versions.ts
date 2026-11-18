// Versión vigente de cada documento legal. Al registrarse se guarda cuál aceptó cada persona.
// Cuando publiquéis los textos definitivos (o los cambiéis), sube la versión aquí (como mucho 20 letras).
export const LEGAL_VERSIONS = {
  terms: "v3-2026-11-17",
  privacy: "v3-2026-11-17",
} as const;

// Versión del texto de las decisiones opcionales de privacidad (la casilla del registro y el interruptor de
// Perfil → Privacidad: Auth.fields.marketing). Se guarda con cada decisión (tabla privacy_choices, migración 19).
// Si cambias lo que dice, sube la versión: lo aceptado antes valía para el texto de antes.
// v1: dos casillas largas · v2: una sola casilla para las dos · v3: dos casillas cortas (consentimiento granular)
// · v4: solo novedades, sin empresas colaboradoras (migración 25).
export const PRIVACY_CHOICES_VERSION = "v4";

// Las decisiones opcionales, cada una con su casilla (el RGPD pide poder aceptar cada finalidad por separado).
// Hoy solo una: recibir novedades de HAPPA. Si algún día vuelve a haber empresas colaboradoras, se añade aquí
// otra (y en la BD, migración 25), con su texto y versión nuevos.
export const PRIVACY_PURPOSES = ["marketing"] as const;
export type PrivacyPurpose = (typeof PRIVACY_PURPOSES)[number];
