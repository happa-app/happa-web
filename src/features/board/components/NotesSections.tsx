// Normas (notas fijadas) y Notas (post-its) del corcho. Fijar o quitar de normas: los adultos.
// Quitar una nota: quien la puso o un admin (lo vuelve a comprobar la base de datos).
import { useLocale, useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { BoardNote } from "../types";
import { BoardActionButton } from "./BoardActionButton";
import { NoteForm } from "./NoteForm";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
  rules: BoardNote[];
  notes: BoardNote[];
  me: string;
  isAdult: boolean;
  isAdmin: boolean;
  // Hora de ahora (la pone la página) para "hoy", "ayer", "hace 3 días"
  now: number;
};

// "hoy", "ayer", "hace 3 días"... (días naturales en UTC; basta para una nota)
function ago(iso: string, now: number, locale: string) {
  const day = (ms: number) => Math.floor(ms / 86_400_000);
  const diff = day(Date.parse(iso)) - day(now);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diff, "day");
}

export function NotesSections({ householdId, rules, notes, me, isAdult, isAdmin, now }: Props) {
  const t = useTranslations("Board");
  const locale = useLocale();
  const authorOf = (n: BoardNote) => (n.authorId === me ? t("notes.you") : n.authorName || t("notes.someone"));
  const canRemove = (n: BoardNote) => n.authorId === me || isAdmin;
  const remove = (n: BoardNote) =>
    canRemove(n) ? (
      <BoardActionButton
        householdId={householdId}
        intent="deleteNote"
        fields={{ noteId: n.id }}
        label={t("notes.remove")}
        confirmText={t("notes.removeConfirm")}
      />
    ) : null;

  return (
    <>
      {rules.length > 0 ? (
        <Section title={t("rules.title")}>
          <ul className={styles.rules}>
            {rules.map((r) => (
              <li key={r.id} className={styles.rule}>
                <span aria-hidden="true">📌</span>
                <div className={styles.ruleBody}>
                  <p className={styles.ruleText}>
                    {r.body} <span className={styles.by}>· {authorOf(r)}</span>
                  </p>
                  <div className={styles.noteActions}>
                    {isAdult ? (
                      <BoardActionButton
                        householdId={householdId}
                        intent="unpin"
                        fields={{ noteId: r.id }}
                        label={t("notes.unpin")}
                      />
                    ) : null}
                    {remove(r)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={t("notes.title")}>
        {notes.length === 0 ? <p className={styles.empty}>{t("notes.empty")}</p> : null}
        {notes.length > 0 ? (
          <ul className={styles.notes}>
            {notes.map((n) => (
              <li key={n.id} className={styles.note}>
                <p className={styles.noteText}>{n.body}</p>
                <p className={styles.noteBy}>
                  {authorOf(n)} · {ago(n.createdAt, now, locale)}
                </p>
                <div className={styles.noteActions}>
                  {isAdult ? (
                    <BoardActionButton householdId={householdId} intent="pin" fields={{ noteId: n.id }} label={t("notes.pin")} />
                  ) : null}
                  {remove(n)}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <NoteForm householdId={householdId} isAdult={isAdult} />
      </Section>
    </>
  );
}
