// Página /hogar/<id>/corcho/pago: añadir un dato de pago al corcho (solo adultos del hogar).
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PaymentForm, uuidSchema } from "@/features/board";
import { getBoard } from "@/features/board/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BoardPaymentPage({ params }: Props) {
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
        <h1 className={styles.title}>{t("paymentForm.title")}</h1>
        <p className={styles.subtitle}>{t("paymentForm.subtitle")}</p>
      </section>
      <PaymentForm householdId={id} />
    </>
  );
}
