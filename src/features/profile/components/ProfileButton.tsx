// Arriba a la derecha: tu inicial (o tu foto). Lleva a tu perfil.
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import { Link } from "@/i18n/navigation";
import styles from "./Profile.module.css";

export function ProfileButton({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const t = useTranslations("Profile");
  return (
    <Link href="/perfil" className={styles.button} aria-label={t("open")} title={t("open")}>
      <Avatar name={name} imageUrl={avatarUrl} size="sm" />
    </Link>
  );
}
