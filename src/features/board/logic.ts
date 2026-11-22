// Lógica del corcho sin React ni base de datos (se prueba con el test runner de Node).
// Las reglas de IBAN y Bizum son las mismas que comprueba la base de datos (migración 32).
import type { BoardWifi } from "./types";

// Escapa lo que tiene significado en el texto del QR: \ ; , : "
function escapeQr(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

// Escapa y, si solo tiene cifras y letras de la A a la F (p. ej. "12345678"), la pone entre comillas: si no,
// Android la entiende como un número hexadecimal y el móvil no se conecta
function qrField(value: string): string {
  const escaped = escapeQr(value);
  return /^[0-9A-Fa-f]+$/.test(value) ? `"${escaped}"` : escaped;
}

// Texto que lleva el QR para conectarse al WiFi apuntando con la cámara
// (formato que entienden Android e iOS: WIFI:T:<tipo>;S:<red>;P:<contraseña>;;)
export function wifiQrText(wifi: BoardWifi): string {
  if (wifi.security === "nopass") return `WIFI:T:nopass;S:${qrField(wifi.ssid)};;`;
  const type = wifi.security === "wpa" ? "WPA" : "WEP";
  return `WIFI:T:${type};S:${qrField(wifi.ssid)};P:${qrField(wifi.password)};;`;
}

// "es91 2100 ..." → "ES9121000..."
export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

// Formato y dígitos de control (resto entre 97 igual a 1), cifra a cifra para no desbordar
export function isValidIban(iban: string): boolean {
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const moved = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const char of moved) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits) rest = (rest * 10 + Number(digit)) % 97;
  }
  return rest === 1;
}

// Corto, para la lista: "ES91 …1332"
export function maskIban(iban: string): string {
  return `${iban.slice(0, 4)} …${iban.slice(-4)}`;
}

// En grupos de 4: "ES91 2100 0418 ..."
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, "$1 ");
}

// Solo las 9 cifras: sin espacios, guiones, +34 ni 0034
export function normalizeBizum(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("0034")) return digits.slice(4);
  if (digits.length === 11 && digits.startsWith("34")) return digits.slice(2);
  return digits;
}

// Bizum va con un móvil español: 9 cifras que empiezan por 6 o 7
export function isValidBizum(value: string): boolean {
  return /^[67][0-9]{8}$/.test(value);
}

// "600123456" → "600 123 456"
export function formatBizum(value: string): string {
  return value.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
}
