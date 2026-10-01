"use client";
// Botón de un formulario que pide confirmación antes de enviarse
// (para acciones que no se deshacen con un clic: salir del hogar, cambiar el código...).
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";

type Props = {
  action: (formData: FormData) => Promise<void>;
  householdId: string;
  label: string;
  confirmText: string;
  variant?: "primary" | "secondary";
};

export function ConfirmSubmitButton({ action, householdId, label, confirmText, variant = "secondary" }: Props) {
  const locale = useLocale();

  return (
    <form
      action={action}
      onSubmit={(event: { preventDefault(): void }) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <Button type="submit" variant={variant} fullWidth>
        {label}
      </Button>
    </form>
  );
}
