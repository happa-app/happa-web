// Ajustes de tu cuenta: correo y contraseña, idioma y avisos.
import { useTranslations } from "next-intl";
import { BellIcon, GlobeIcon, KeyIcon } from "@/components/brand/Icons";
import { MenuList } from "@/features/navigation";
import type { Locale } from "@/i18n/routing";
import { LANGUAGE_NAMES } from "../languages";

export function ProfileSettings({ locale }: { locale: Locale }) {
  const t = useTranslations("Profile.settings");
  return (
    <MenuList
      title={t("title")}
      items={[
        { href: "/perfil/cuenta", icon: <KeyIcon />, title: t("account"), description: t("accountHint") },
        { href: "/perfil/idioma", icon: <GlobeIcon />, title: t("language"), description: LANGUAGE_NAMES[locale] },
        { href: "/avisos/ajustes", icon: <BellIcon />, title: t("notifications"), description: t("notificationsHint") },
      ]}
    />
  );
}
