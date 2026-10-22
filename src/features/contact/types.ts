// Tipos de la pantalla de contacto (Más → Ayuda y contacto). Los errores son claves de traducción
// (Contact.errors.*), no textos.
export const CONTACT_KINDS = ["bug", "question", "idea", "other"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export type ContactErrorKey = "messageRequired" | "messageTooLong" | "rateLimited" | "generic";

export type ContactFormState = {
  status: "idle" | "error" | "sent";
  error?: ContactErrorKey;
  // Lo que escribió la persona, para no perderlo si algo falla
  message?: string;
};

export const initialContactState: ContactFormState = { status: "idle" };

// Máximo de caracteres del mensaje (el mismo límite que en la base de datos, migración 20)
export const CONTACT_MESSAGE_MAX = 2000;
