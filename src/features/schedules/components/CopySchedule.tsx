"use client";
// Copiar aquí tu horario de otro hogar en el que vives (sustituye lo que tengas apuntado en este).
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { scheduleAction } from "../actions";
import { initialScheduleActionState, type OtherSchedule } from "../types";
import styles from "./Schedules.module.css";

type Props = {
  householdId: string;
  personId: string;
  others: OtherSchedule[];
};

export function CopySchedule({ householdId, personId, others }: Props) {
  const t = useTranslations("Schedules");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(scheduleAction, initialScheduleActionState);
  const [from, setFrom] = useState(others[0]?.householdId ?? "");
  const fromName = others.find((o) => o.householdId === from)?.name ?? "";

  if (others.length === 0) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t("editor.copyTitle")}</h2>
      <form
        action={formAction}
        className={styles.fieldset}
        onSubmit={(event: { preventDefault(): void }) => {
          if (!window.confirm(t("editor.copyConfirm", { name: fromName }))) event.preventDefault();
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="householdId" value={householdId} />
        <input type="hidden" name="personId" value={personId} />
        <input type="hidden" name="intent" value="copy" />
        <p className={styles.hint}>{t("editor.copyHint")}</p>
        <select
          name="fromHouseholdId"
          className={styles.select}
          aria-label={t("editor.copyFrom")}
          value={from}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setFrom(e.target.value)}
        >
          {others.map((o) => (
            <option key={o.householdId} value={o.householdId}>
              {t("editor.copyOption", { name: o.name, count: o.blockCount })}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {t("editor.copy")}
        </Button>
        {state.error ? (
          <p className={styles.actionError} role="alert">
            {t(`errors.${state.error}`)}
          </p>
        ) : null}
      </form>
    </section>
  );
}
