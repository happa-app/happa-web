"use client";
// Cambiar a quién le toca un día (solo adultos): otra persona del hogar, o dejarlo libre.
// Este cambio a mano se respeta aunque luego se rehagan los turnos.
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { submitWithoutReset } from "@/utils/forms";
import { choreAction } from "../actions";
import { initialChoreActionState, type ChorePerson } from "../types";
import styles from "./Chores.module.css";

type Props = {
  householdId: string;
  dayId: string;
  // A quién le toca ahora (null = libre)
  assigneeId: string | null;
  people: ChorePerson[];
  me: string;
};

export function ReassignForm({ householdId, dayId, assigneeId, people, me }: Props) {
  const t = useTranslations("Chores");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(choreAction, initialChoreActionState);
  const [userId, setUserId] = useState(assigneeId ?? "");

  return (
    <form onSubmit={submitWithoutReset(formAction)} className={styles.section}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="intent" value="reassign" />
      <div className={styles.inlineForm}>
        <div className={styles.selectField}>
          <label htmlFor="chore-reassign" className={styles.selectLabel}>
            {t("day.reassign")}
          </label>
          <select
            id="chore-reassign"
            name="userId"
            className={styles.select}
            value={userId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setUserId(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.userId === me ? t("youCap") : p.name}
              </option>
            ))}
            <option value="">{t("day.leaveFree")}</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" disabled={isPending || userId === (assigneeId ?? "")}>
          {t("day.reassignButton")}
        </Button>
      </div>
      <p className={styles.hint}>{t("day.reassignHint")}</p>
      {state.error ? (
        <p className={styles.actionError} role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
    </form>
  );
}
