// Página /perfil (el círculo de arriba a la derecha): tu nombre, tu correo y cambiar cómo te llaman.
// Más adelante: tu foto y tus opiniones.
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { ProfileCard, ProfileForm } from "@/features/profile";
import { getMyProfile } from "@/features/profile/server";
import { redirect } from "@/i18n/navigation";
import styles from "../page.module.css";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const profile = await getMyProfile();
  if (!profile) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
      </section>
      <ProfileCard profile={profile} />
      <Card title={t("nameTitle")}>
        <ProfileForm name={profile.name} />
      </Card>
      <p className={styles.muted}>{t("soon")}</p>
    </>
  );
}
