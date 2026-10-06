// Página /perfil (el círculo de arriba a la derecha): tu foto y tu nombre, tus números, tus hogares y
// los ajustes de tu cuenta. Más adelante: tus opiniones.
import { getLocale, getTranslations } from "next-intl/server";
import { getMyHouseholds } from "@/features/households/server";
import { ProfileHero, ProfileHouseholds, ProfileSettings, ProfileStats } from "@/features/profile";
import profileStyles from "@/features/profile/components/Profile.module.css";
import { getMyProfile, getMyStats } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import styles from "../page.module.css";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const profile = await getMyProfile();
  if (!profile) {
    return redirect({ href: "/login", locale: await getLocale() });
  }
  const [stats, households] = await Promise.all([getMyStats(), getMyHouseholds(profile.userId)]);

  return (
    <>
      <ProfileHero profile={profile} />
      <ProfileStats stats={stats} />
      <ProfileHouseholds households={households} />
      <ProfileSettings locale={profile.locale} />
      <p className={styles.muted}>{t("soon")}</p>
      <Link href="/perfil/borrar" className={profileStyles.dangerLink}>
        {t("delete.link")}
      </Link>
    </>
  );
}
