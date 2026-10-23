// Versión vigente de cada documento legal. Al registrarse se guarda cuál aceptó cada persona.
// Cuando publiquéis los textos definitivos (o los cambiéis), sube la versión aquí (como mucho 20 letras).
export const LEGAL_VERSIONS = {
  terms: "v1-2026-10-08",
  privacy: "v1-2026-10-22b",
} as const;

// Versión del texto de las dos decisiones opcionales de privacidad (las casillas del registro y los interruptores
// de Perfil → Privacidad: Auth.fields.marketing, partners y partnersDetail). Se guarda con cada decisión (tabla
// privacy_choices, migración 19). Si cambias lo que dicen (qué datos se ceden, a qué sectores…), sube la
// versión: lo aceptado antes valía para el texto de antes, así que habría que volver a preguntar.
// v1: dos casillas largas · v2: una sola casilla para las dos · v3: dos casillas cortas (consentimiento granular).
export const PRIVACY_CHOICES_VERSION = "v3";

// Las dos decisiones: recibir comunicaciones de HAPPA y que HAPPA ceda tus datos a empresas colaboradoras.
// Cada una con su casilla: el RGPD pide poder aceptar cada finalidad por separado.
export const PRIVACY_PURPOSES = ["marketing", "partners"] as const;
export type PrivacyPurpose = (typeof PRIVACY_PURPOSES)[number];
