"use client";
// Campana de la cabecera: lleva a Avisos y enseña cuántos hay sin leer. Se pone al día al cambiar de
// pantalla, al volver a la app y cada minuto.
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BellIcon } from "@/components/brand/Icons";
import { Link, usePathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Notifications.module.css";

const REFRESH_MS = 60_000;

export function NotificationBell() {
  const t = useTranslations("Notifications");
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const load = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("in_app", true)
        .is("read_at", null);
      if (!cancelled && !error) setUnread(count ?? 0);
    };
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return (
    <Link href="/avisos" className={styles.bell} aria-label={t("bell", { count: unread })} title={t("bell", { count: unread })}>
      <BellIcon />
      {unread > 0 ? (
        <span className={styles.bellBadge} aria-hidden="true">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
