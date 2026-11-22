// Página /hogar/<id>/corcho/wifi: poner, cambiar o quitar el WiFi del corcho (solo adultos del hogar).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { uuidSchema, WifiForm } from "@/features/board";
import { getBoard } from "@/features/board/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BoardWifiPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Board");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!uuidSchema.safeParse(id).success) notFound();
  const board = await getBoard(id, userId);
  if (!board?.isAdult) notFound();

  return (
    <>
      <Link href={`/hogar/${id}/corcho`} className={styles.back}>
        ← {t("title")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("wifiForm.title")}</h1>
        <p className={styles.subtitle}>{t("wifiForm.subtitle")}</p>
      </section>
      <WifiForm householdId={id} wifi={board.wifi} />
    </>
  );
}
