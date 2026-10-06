// Página /perfil/cuenta: cambiar tu correo y tu contraseña.
import { getLocale, getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { EmailForm, PasswordForm } from "@/features/profile";
import { getMyAccount, getMyProfile } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import styles from "../../page.module.css";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AccountPage({ searchParams }: Props) {
  const t = await getTranslations("Profile");
  const profile = await getMyProfile();
  if (!profile) {
    return redirect({ href: "/login", locale: await getLocale() });
  }
  const account = await getMyAccount();
  // Se vuelve aquí desde los enlaces del correo
  const { correo } = await searchParams;

  return (
    <>
      <Link href="/perfil" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("account.title")}</h1>
        <p className={styles.subtitle}>{t("account.subtitle")}</p>
      </section>
      {account.newEmail ? (
        <p className={styles.notice} role="status">
          {t("account.emailPending", { email: account.newEmail })}
        </p>
      ) : correo ? (
        <Alert tone="success">{t("account.emailChanged", { email: account.email ?? "" })}</Alert>
      ) : null}
      <Card title={t("account.emailTitle")}>
        <EmailForm email={account.email} />
      </Card>
      <Card title={t("account.passwordTitle")}>
        <PasswordForm />
      </Card>
    </>
  );
}
