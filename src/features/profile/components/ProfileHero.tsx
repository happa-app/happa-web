// Arriba del perfil: tu foto grande, tu nombre, tu correo, desde cuándo estás y "Editar perfil".
import { useLocale, useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/navigation";
import type { MyProfile } from "../types";
import styles from "./Profile.module.css";

export function ProfileHero({ profile }: { profile: MyProfile }) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const since = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(profile.memberSince));

  return (
    <section className={styles.hero} aria-labelledby="profile-name">
      <span className={styles.heroAvatar}>
        <Avatar name={profile.name} imageUrl={profile.avatarUrl} size="lg" />
      </span>
      <h1 id="profile-name" className={styles.heroName}>
        {profile.name}
      </h1>
      {profile.email ? <p className={styles.heroEmail}>{profile.email}</p> : null}
      <p className={styles.heroSince}>{t("since", { date: since })}</p>
      <Link href="/perfil/editar" className={styles.heroEdit}>
        {t("edit")}
      </Link>
    </section>
  );
}
