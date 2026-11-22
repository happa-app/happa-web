// Reglas de los formularios del corcho. La base de datos lo vuelve a comprobar todo (migración 32);
// aquí se valida antes para poder decir exactamente qué campo está mal.
import { z } from "zod";
import { isValidBizum, isValidIban, normalizeBizum, normalizeIban } from "./logic";
import { PAYMENT_KINDS, WIFI_SECURITIES, type BoardWifi, type PaymentKind } from "./types";

export const uuidSchema = z.uuid();

export const MAX_SSID = 32;
export const MAX_PASSWORD = 63;
export const MAX_LABEL = 40;
export const MAX_NOTE = 200;

// Errores que pueden ver los usuarios (claves de messages/*.json → Board.errors)
export const BOARD_ERROR_KEYS = [
  "ssidRequired",
  "ssidTooLong",
  "passwordInvalid",
  "labelRequired",
  "labelTooLong",
  "ibanInvalid",
  "bizumInvalid",
  "tooManyPayments",
  "bodyRequired",
  "bodyTooLong",
  "tooManyNotes",
  "onlyAdults",
  "onlyOwn",
  "notFound",
  "generic",
] as const;
export type BoardErrorKey = (typeof BOARD_ERROR_KEYS)[number];

export type BoardFormField = "ssid" | "password" | "label" | "value" | "body";
export type BoardFormState = {
  status: "idle" | "error";
  fieldErrors?: Partial<Record<BoardFormField, BoardErrorKey>>;
  formError?: BoardErrorKey;
};
export const initialBoardFormState: BoardFormState = { status: "idle" };

export type BoardActionState = { status: "idle" | "done" | "error"; error?: BoardErrorKey };
export const initialBoardActionState: BoardActionState = { status: "idle" };

type Built<T> =
  | { ok: true; value: T }
  | { ok: false; fieldErrors: Partial<Record<BoardFormField, BoardErrorKey>>; formError?: BoardErrorKey };

const wifiShape = z.object({ ssid: z.string(), password: z.string(), security: z.string() });

// WPA: de 8 a 63 caracteres. WEP: 5 o 13 caracteres, o 10 o 26 hexadecimales. Sin contraseña: vacía.
export function buildWifi(input: unknown): Built<BoardWifi> {
  const parsed = wifiShape.safeParse(input);
  const security = parsed.success ? WIFI_SECURITIES.find((s) => s === parsed.data.security) : undefined;
  if (!parsed.success || !security) return { ok: false, fieldErrors: {}, formError: "generic" };
  const { ssid } = parsed.data;
  const password = security === "nopass" ? "" : parsed.data.password;
  const fieldErrors: Partial<Record<BoardFormField, BoardErrorKey>> = {};

  if (!ssid.trim()) fieldErrors.ssid = "ssidRequired";
  else if (ssid.length > MAX_SSID) fieldErrors.ssid = "ssidTooLong";
  const passwordOk =
    security === "nopass" ||
    (security === "wpa" && password.length >= 8 && password.length <= MAX_PASSWORD) ||
    (security === "wep" && ([5, 13].includes(password.length) || /^([0-9A-Fa-f]{10}|[0-9A-Fa-f]{26})$/.test(password)));
  if (!passwordOk) fieldErrors.password = "passwordInvalid";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, value: { ssid, password, security } };
}

const paymentShape = z.object({ label: z.string(), kind: z.string(), value: z.string() });

export function buildPayment(input: unknown): Built<{ label: string; kind: PaymentKind; value: string }> {
  const parsed = paymentShape.safeParse(input);
  const kind = parsed.success ? PAYMENT_KINDS.find((k) => k === parsed.data.kind) : undefined;
  if (!parsed.success || !kind) return { ok: false, fieldErrors: {}, formError: "generic" };
  const fieldErrors: Partial<Record<BoardFormField, BoardErrorKey>> = {};

  const label = parsed.data.label.trim();
  if (!label) fieldErrors.label = "labelRequired";
  else if (label.length > MAX_LABEL) fieldErrors.label = "labelTooLong";

  const value = kind === "bizum" ? normalizeBizum(parsed.data.value) : normalizeIban(parsed.data.value);
  if (kind === "bizum" && !isValidBizum(value)) fieldErrors.value = "bizumInvalid";
  if (kind === "iban" && !isValidIban(value)) fieldErrors.value = "ibanInvalid";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, value: { label, kind, value } };
}

export function buildNote(input: unknown): Built<{ body: string; pinned: boolean }> {
  const parsed = z.object({ body: z.string(), pinned: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: {}, formError: "generic" };
  const body = parsed.data.body.trim();
  if (!body) return { ok: false, fieldErrors: { body: "bodyRequired" } };
  if (body.length > MAX_NOTE) return { ok: false, fieldErrors: { body: "bodyTooLong" } };
  return { ok: true, value: { body, pinned: parsed.data.pinned } };
}
