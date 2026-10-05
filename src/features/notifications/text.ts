// El texto de cada aviso, igual en la campana de la app y en el móvil (vale en servidor y navegador).
// Devuelve la clave del mensaje (messages/*.json → Notifications.types) y sus valores; quien lo pinta
// lo traduce.
import type { NotificationData, NotificationType } from "./types";

export type NotificationPhrase = { key: string; values: Record<string, string | number> };

function money(cents: number | undefined, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format((cents ?? 0) / 100);
}

// "2026-10-05" → "lun, 5 oct" / "Mon, Oct 5"
function day(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${isoDate.slice(0, 10)}T00:00:00Z`),
  );
}

// someone: cómo llamar a quien lo hizo si no se sabe (cuenta borrada)
export function notificationPhrase(
  notification: { type: NotificationType; data: NotificationData },
  locale: string,
  someone: string,
): NotificationPhrase {
  const d = notification.data ?? {};
  const actor = d.actor || someone;
  const key = `types.${notification.type}`;
  switch (notification.type) {
    case "expense_to_confirm":
      return { key, values: { actor, description: d.description ?? "", amount: money(d.amount_cents, locale), edited: d.edited ? "true" : "false" } };
    case "expense_rejected":
      return {
        key,
        values: { actor, description: d.description ?? "", reason: d.reason ?? "", hasReason: d.reason ? "true" : "false" },
      };
    case "payment_to_confirm":
      return { key, values: { actor, amount: money(d.amount_cents, locale) } };
    case "recurring_to_confirm":
      return { key, values: { actor, description: d.description ?? "", amount: money(d.amount_cents, locale) } };
    case "shopping_added": {
      const names = (d.names ?? []).map((n) => `«${n}»`);
      const count = Math.max(d.count ?? names.length, 1);
      // Si hay más de las que se guardan (3), se ponen esas y "…"
      const listed =
        count > names.length ? `${names.join(", ")}…` : new Intl.ListFormat(locale, { type: "conjunction" }).format(names);
      return { key, values: { actor, count, first: d.names?.[0] ?? "", names: listed } };
    }
    case "chore_reassigned":
    case "chore_reopened":
      return { key, values: { actor, title: d.title ?? "", date: day(d.due_on, locale) } };
    case "chore_to_approve":
    case "chore_approved":
      return { key, values: { actor, title: d.title ?? "" } };
    case "message":
      return { key, values: { actor, body: d.body ?? "" } };
    case "roulette_chosen":
      return { key, values: { actor } };
  }
}

// Ruta con el idioma delante (el español va sin prefijo)
export function localizedUrl(url: string, locale: string): string {
  return locale === "es" ? url : `/${locale}${url}`;
}
