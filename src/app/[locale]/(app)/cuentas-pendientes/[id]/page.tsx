// Página /cuentas-pendientes/<id>: la conversación de «Cuentas pendientes» de alguien que se fue de un hogar con
// saldo (migración 29). La ven esa persona y solo quienes tienen saldo con ella. Arriba, la franja con lo que hay
// entre tú y cada uno (y los botones de pago); debajo, el chat de siempre, sin votaciones.
// Si ya no está abierta (el saldo llegó a cero) o no es tuya, «no encontrada».
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatRoom, DebtStrip } from "@/features/chat";
import { getDebtChatPage } from "@/features/chat/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DebtChatPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Chat.debts");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!z.uuid().safeParse(id).success) notFound();
  const page = await getDebtChatPage(id);
  if (!page) notFound();

  const names = Object.fromEntries(page.people.map((p) => [p.userId, p.name]));

  return (
    <>
      {/* Quien se fue vuelve a Inicio; quien sigue en el hogar, a su chat */}
      <Link href={page.isMine ? "/inicio" : `/hogar/${page.householdId}/chat`} className={styles.back}>
        ← {page.isMine ? t("backHome") : t("backChat")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{page.isMine ? t("title") : t("titleWith", { name: page.departedName })}</h1>
        <p className={styles.subtitle}>
          {page.isMine
            ? t("subtitleMine", { household: page.info.householdName })
            : t("subtitleOther", { name: page.departedName })}
        </p>
      </section>
      <DebtStrip
        conversationId={id}
        householdId={page.householdId}
        lines={page.lines}
        names={names}
        isMine={page.isMine}
        today={page.today}
      />
      <ChatRoom
        info={page.info}
        people={page.people}
        me={userId}
        initialMessages={page.messages}
        initialHasMore={page.hasMore}
        initialPolls={page.polls}
        today={page.today}
      />
    </>
  );
}
