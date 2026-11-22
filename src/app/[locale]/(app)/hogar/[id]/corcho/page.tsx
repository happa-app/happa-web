// Página /hogar/<id>/corcho: el WiFi (con su QR), los datos de pago (solo adultos) y las normas y notas de
// la casa (migración 32). Para quienes viven en el hogar; se entra desde Más.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BoardTop, NotesSections, PaymentsSection, uuidSchema } from "@/features/board";
import { getBoard } from "@/features/board/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BoardPage({ params }: Props) {
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
  if (!board) notFound();

  return (
    <>
      <Link href={`/hogar/${id}`} className={styles.back}>
        ← {board.householdName}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>

      <BoardTop
        householdId={id}
        wifi={board.wifi}
        qrSvg={board.wifiQrSvg}
        canEdit={board.isAdult}
        // Los menores no reciben los pagos (el RLS no se los da): el WiFi ocupa todo el ancho
        payments={board.isAdult ? <PaymentsSection householdId={id} payments={board.payments} /> : null}
      />
      <NotesSections
        householdId={id}
        rules={board.rules}
        notes={board.notes}
        me={board.me}
        isAdult={board.isAdult}
        isAdmin={board.isAdmin}
        now={board.now}
      />
    </>
  );
}
