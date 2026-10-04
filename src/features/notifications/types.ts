// Tipos de los avisos (lo mismo que la base de datos, migración 14).

export const NOTIFICATION_TYPES = [
  "expense_to_confirm",
  "expense_rejected",
  "payment_to_confirm",
  "recurring_to_confirm",
  "shopping_added",
  "chore_reassigned",
  "chore_reopened",
  "chore_to_approve",
  "chore_approved",
  "message",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Para elegir qué llega al móvil
export const NOTIFICATION_CATEGORIES = ["expenses", "shopping", "chores", "chat"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

// Los datos con los que se escribe el texto (los guarda la base de datos al crear el aviso)
export type NotificationData = {
  actor?: string | null;
  household?: string | null;
  description?: string;
  amount_cents?: number;
  edited?: boolean;
  reason?: string | null;
  count?: number;
  names?: string[];
  title?: string;
  due_on?: string;
  body?: string;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  householdId: string | null;
  data: NotificationData;
  // Ruta de la app sin el idioma ("/hogar/…/gastos/…")
  url: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export type NotificationsActionState = { status: "idle" | "done" | "error" };
export const initialNotificationsActionState: NotificationsActionState = { status: "idle" };
