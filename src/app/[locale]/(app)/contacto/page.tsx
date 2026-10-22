// Página /contacto (Más → Ayuda y contacto): mandarnos un error, una duda o una idea.
// Si vienes de la pestaña Más de un hogar, llega su id (?hogar=…) para saber desde dónde escribes.
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { ContactForm } from "@/features/contact";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactPage({ searchParams }: Props) {
  const t = await getTranslations("Contact");
  const { hogar } = await searchParams;
  const householdId = z.uuid().safeParse(hogar).data;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  if (!email) {
    return redirect({ href: "/login", locale: await getLocale() });
  }

  const backHref = householdId ? `/hogar/${householdId}/mas` : "/mas";

  return (
    <>
      <Link href={backHref} className={styles.back}>
        ← {t("backShort")}
      </Link>
      <section className={styles.intro}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </section>
      <ContactForm email={email} householdId={householdId} backHref={backHref} />
    </>
  );
}
