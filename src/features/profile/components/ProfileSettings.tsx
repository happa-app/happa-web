// Ajustes de tu cuenta: correo y contraseña, idioma, tema, avisos y privacidad.
import { useTranslations } from "next-intl";
import { BellIcon, GlobeIcon, KeyIcon, MoonIcon, ShieldIcon } from "@/components/brand/Icons";
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
        { href: "/perfil/tema", icon: <MoonIcon />, title: t("theme"), description: t("themeHint") },
        { href: "/avisos/ajustes", icon: <BellIcon />, title: t("notifications"), description: t("notificationsHint") },
        { href: "/perfil/privacidad", icon: <ShieldIcon />, title: t("privacy"), description: t("privacyHint") },
      ]}
    />
  );
}
