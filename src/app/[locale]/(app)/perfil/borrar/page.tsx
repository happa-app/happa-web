// Página /perfil/borrar: qué pasa si borras tu cuenta y, si no debes dinero, el formulario para hacerlo.
// Si entras con Google, se confirma volviendo a entrar con Google: la vuelta es a esta misma página
// (y ?google=error si algo falló).
import { getLocale, getTranslations } from "next-intl/server";
import { DeleteAccount } from "@/features/profile";
import { getMyAccount, getMyPendingBalances, getMyProfile } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import styles from "../../page.module.css";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DeleteAccountPage({ searchParams }: Props) {
  const t = await getTranslations("Profile");
  const { google } = await searchParams;
  const [profile, account] = await Promise.all([getMyProfile(), getMyAccount()]);
  if (!profile) {
    return redirect({ href: "/login", locale: await getLocale() });
  }
  const balances = profile.isMinor ? [] : await getMyPendingBalances(profile.userId);

  return (
    <>
      <Link href="/perfil" className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("delete.title")}</h1>
      </section>
      <DeleteAccount isMinor={profile.isMinor} balances={balances} account={account} googleFailed={google === "error"} />
    </>
  );
}
