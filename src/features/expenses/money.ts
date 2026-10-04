// Dinero: siempre en céntimos (enteros), así no hay errores de redondeo.
// Aquí se pasa de lo que escribe la persona ("12,50") a céntimos y de céntimos a texto.

// Lo máximo que admite un gasto o un pago: 100.000 € (lo mismo que comprueba la base de datos)
export const MAX_AMOUNT_CENTS = 10_000_000;

// Acepta "12", "12,5", "12,50", "12.50" y espacios alrededor. Sin separador de miles ni más de 2 decimales.
// Devuelve null si no es un importe válido.
export function parseAmount(text: string): number | null {
  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

// 1250 → "12,50 €" (es) / "€12.50" (en)
export function formatMoney(cents: number, locale: string, currency = "EUR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

// 1250 → "12,50" (es) / "12.50" (en), para rellenar un campo de importe
export function centsToInput(cents: number, locale: string): string {
  const separator = locale === "es" ? "," : ".";
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(euros) : `${euros}${separator}${String(rest).padStart(2, "0")}`;
}
