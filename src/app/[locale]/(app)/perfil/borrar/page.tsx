// Página /perfil/borrar: qué pasa si borras tu cuenta y, si no debes dinero, el formulario para hacerlo.
import { getLocale, getTranslations } from "next-intl/server";
import { DeleteAccount } from "@/features/profile";
import { getMyPendingBalances, getMyProfile } from "@/features/profile/server";
import { Link, redirect } from "@/i18n/navigation";
import styles from "../../page.module.css";

export default async function DeleteAccountPage() {
  const t = await getTranslations("Profile");
  const profile = await getMyProfile();
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
      <DeleteAccount isMinor={profile.isMinor} balances={balances} />
    </>
  );
}
