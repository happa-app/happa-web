// Lo que enseña /registro mientras el registro está cerrado (modo demo, ver src/lib/signup.ts).
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import styles from "./AuthForm.module.css";

export async function SignupClosed() {
  const t = await getTranslations("Auth.signupClosed");
  return (
    <div className={styles.form}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("text")}</p>
      </header>
      <p className={styles.switch}>
        <Link href="/#demo">{t("demo")}</Link>
      </p>
      <p className={styles.switch}>
        <Link href="/login">{t("login")}</Link>
      </p>
    </div>
  );
}
