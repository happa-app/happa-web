// Página /perfil/editar: tu foto y tu nombre.
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { AvatarEditor, ProfileForm } from "@/features/profile";
import { getMyProfile } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import styles from "../../page.module.css";

export default async function EditProfilePage() {
  const t = await getTranslations("Profile");
  const profile = await getMyProfile();
  if (!profile) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  return (
    <>
      <Link href="/perfil" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("edit")}</h1>
      </section>
      <Card title={t("photo.title")}>
        {profile.isMinor ? (
          <p className={styles.muted}>{t("photo.minor")}</p>
        ) : (
          <AvatarEditor userId={profile.userId} name={profile.name} avatarUrl={profile.avatarUrl} />
        )}
      </Card>
      <Card title={t("nameTitle")}>
        <ProfileForm name={profile.name} />
      </Card>
    </>
  );
}
