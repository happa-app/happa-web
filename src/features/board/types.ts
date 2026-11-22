// Tipos del corcho del hogar (migración 32): WiFi, datos de pago y notas.

export const WIFI_SECURITIES = ["wpa", "wep", "nopass"] as const;
export type WifiSecurity = (typeof WIFI_SECURITIES)[number];

export const PAYMENT_KINDS = ["bizum", "iban"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export type BoardWifi = { ssid: string; password: string; security: WifiSecurity };

// value va normalizado: Bizum con las 9 cifras; IBAN sin espacios y en mayúsculas
export type BoardPayment = { id: string; label: string; kind: PaymentKind; value: string };

export type BoardNote = {
  id: string;
  body: string;
  // Fijada = norma de la casa
  pinned: boolean;
  authorId: string | null;
  authorName: string;
  createdAt: string;
};
