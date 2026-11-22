"use client";
// Poner, cambiar o quitar el WiFi del corcho (solo adultos).
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { submitWithoutReset } from "@/utils/forms";
import { removeWifi, saveWifi } from "../actions";
import {
  initialBoardActionState,
  initialBoardFormState,
  MAX_PASSWORD,
  MAX_SSID,
  type BoardFormField,
} from "../schemas";
import { WIFI_SECURITIES, type BoardWifi, type WifiSecurity } from "../types";
import styles from "./Board.module.css";

type Props = {
  householdId: string;
  wifi: BoardWifi | null;
};

export function WifiForm({ householdId, wifi }: Props) {
  const t = useTranslations("Board");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(saveWifi, initialBoardFormState);
  const [removeState, removeAction, isRemoving] = useActionState(removeWifi, initialBoardActionState);
  const [ssid, setSsid] = useState(wifi?.ssid ?? "");
  const [password, setPassword] = useState(wifi?.password ?? "");
  const [security, setSecurity] = useState<WifiSecurity>(wifi?.security ?? "wpa");
  // Un error deja de verse en cuanto se toca su campo
  const [edited, setEdited] = useState<BoardFormField[]>([]);
  const fieldError = (field: BoardFormField) => {
    const key = edited.includes(field) ? undefined : state.fieldErrors?.[field];
    return key ? t(`errors.${key}`) : undefined;
  };

  return (
    <>
      <form
        onSubmit={(event) => {
          setEdited([]);
          submitWithoutReset(formAction)(event);
        }}
        className={styles.form}
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="householdId" value={householdId} />
        <input type="hidden" name="security" value={security} />
        {state.formError ? <Alert tone="error">{t(`errors.${state.formError}`)}</Alert> : null}

        <TextField
          label={t("wifiForm.ssid")}
          name="ssid"
          value={ssid}
          maxLength={MAX_SSID}
          autoComplete="off"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setEdited((f) => [...f, "ssid"]);
            setSsid(e.target.value);
          }}
          error={fieldError("ssid")}
        />

        <div className={styles.field}>
          <p className={styles.fieldLabel} id="wifi-security">
            {t("wifiForm.security")}
          </p>
          <div className={styles.segmented} role="radiogroup" aria-labelledby="wifi-security">
            {WIFI_SECURITIES.map((s) => (
              <label key={s} className={security === s ? styles.segmentOptionActive : styles.segmentOption}>
                <input
                  type="radio"
                  name="securityChoice"
                  checked={security === s}
                  onChange={() => {
                    setEdited((f) => [...f, "password"]);
                    setSecurity(s);
                  }}
                  className="visually-hidden"
                />
                {t(`wifiForm.securities.${s}`)}
              </label>
            ))}
          </div>
        </div>

        {security === "nopass" ? null : (
          <TextField
            label={t("wifiForm.password")}
            name="password"
            value={password}
            maxLength={MAX_PASSWORD}
            autoComplete="off"
            hint={t("wifiForm.passwordHint")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setEdited((f) => [...f, "password"]);
              setPassword(e.target.value);
            }}
            error={fieldError("password")}
          />
        )}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? t("wifiForm.saving") : t("wifiForm.save")}
        </Button>
      </form>

      {wifi ? (
        <form
          action={removeAction}
          className={styles.removeForm}
          onSubmit={(event: { preventDefault(): void }) => {
            if (!window.confirm(t("wifiForm.removeConfirm"))) event.preventDefault();
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="householdId" value={householdId} />
          <button type="submit" className={styles.linkButton} disabled={isRemoving}>
            {t("wifiForm.remove")}
          </button>
          {removeState.status === "error" && removeState.error ? (
            <span className={styles.error} role="alert">
              {t(`errors.${removeState.error}`)}
            </span>
          ) : null}
        </form>
      ) : null}
    </>
  );
}
