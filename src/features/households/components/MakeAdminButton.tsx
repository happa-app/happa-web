"use client";
// Configuración · Miembros: el admin hace admin a otro adulto del hogar (pide confirmación antes).
// Si falla, el motivo sale en la misma fila (por eso useActionState y no ConfirmSubmitButton, que en un
// error lleva a la página de error). Si va bien, la página se recarga y la persona ya sale como admin.
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { submitWithoutReset } from "@/utils/forms";
import { makeAdmin } from "../actions";
import { initialMakeAdminState } from "../types";
import styles from "./HouseholdDetail.module.css";

type Props = {
  householdId: string;
  userId: string;
  name: string;
};

export function MakeAdminButton({ householdId, userId, name }: Props) {
  const t = useTranslations("Households");
  const [state, formAction, isPending] = useActionState(makeAdmin, initialMakeAdminState);
  const send = submitWithoutReset(formAction);

  return (
    <form
      className={styles.makeAdmin}
      onSubmit={(event) => {
        if (!window.confirm(t("membersSection.makeAdminConfirm", { name }))) {
          event.preventDefault();
          return;
        }
        send(event);
      }}
    >
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className={styles.makeAdminButton} disabled={isPending}>
        {isPending ? t("membersSection.makingAdmin") : t("membersSection.makeAdmin")}
      </button>
      {state.status === "error" ? (
        <p className={styles.memberError} role="alert">
          {t(`errors.${state.error ?? "generic"}`)}
        </p>
      ) : null}
    </form>
  );
}
