// Tipos del chat del hogar.

// Un mensaje. pending: se está mandando · failed: no se pudo mandar (se puede reintentar)
export type ChatMessage = {
  id: string;
  senderId: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  pending?: boolean;
  failed?: boolean;
};

// Lo que ponía un mensaje antes de un cambio
export type MessageVersion = { body: string; writtenAt: string; replacedAt: string };

// Alguien del chat. isMember: sigue en el chat (vive en el hogar, o se fue con saldo pendiente).
export type ChatPerson = { userId: string; name: string; isMember: boolean };

export type ChatInfo = {
  conversationId: string;
  householdName: string;
  timezone: string;
  // false = se fue del hogar y sigue en el chat por tener saldo pendiente
  isResident: boolean;
};

// Para la tarjeta del hogar
export type ChatSummary = {
  unread: number;
  lastBody: string | null;
  lastSenderId: string | null;
  lastAt: string | null;
};

// Lo mismo que la base de datos (migración 13)
export const MAX_MESSAGE = 2000;
export const EDIT_MINUTES = 15;
export const PAGE_SIZE = 50;

// Errores que pueden ver los usuarios (claves de messages/*.json → Chat.errors)
export const CHAT_ERROR_KEYS = ["empty", "tooLong", "tooMany", "tooLate", "notFound", "notAllowed", "generic"] as const;
export type ChatErrorKey = (typeof CHAT_ERROR_KEYS)[number];
