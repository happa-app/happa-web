// Botón de cerrar sesión. Es un formulario que llama a la acción signOut (funciona sin JavaScript).
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { signOut } from "../actions";

export async function SignOutButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const t = await getTranslations("Auth");
  const locale = await getLocale();

  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="secondary" fullWidth={fullWidth}>
        {t("signOut")}
      </Button>
    </form>
  );
}
