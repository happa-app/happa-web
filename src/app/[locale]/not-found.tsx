// Página de "no encontrado" (por ejemplo, un hogar que no existe o del que ya no formas parte).
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./not-found.module.css";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className={styles.page}>
      <Logo size="lg" showName={false} />
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.text}>{t("text")}</p>
      <ButtonLink href="/inicio">{t("back")}</ButtonLink>
    </main>
  );
}
