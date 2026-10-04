// Página /hogar/<id>/chat: el chat de inquilinos del hogar, en vivo.
// Para quienes viven en el hogar (adultos y menores) y para quien se fue con saldo pendiente.
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatRoom } from "@/features/chat";
import { getChatPage } from "@/features/chat/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../../../page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("Chat");
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  if (!z.uuid().safeParse(id).success) notFound();
  const page = await getChatPage(id);
  if (!page) notFound();

  return (
    <>
      <Link href={page.info.isResident ? `/hogar/${id}` : "/inicio"} className={styles.back}>
        ← {page.info.householdName}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle", { name: page.info.householdName })}</p>
      </section>
      <ChatRoom
        info={page.info}
        people={page.people}
        me={userId}
        initialMessages={page.messages}
        initialHasMore={page.hasMore}
        today={page.today}
      />
    </>
  );
}
