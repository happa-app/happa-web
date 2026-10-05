"use client";
// La ruleta del marrón: qué toca, quién entra, la rueda y a quién le ha tocado. Debajo, los últimos giros.
// Los adultos giran; los menores lo ven (y entran si un adulto los incluye).
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useRoulette } from "../hooks/useRoulette";
import { MAX_PEOPLE, MAX_TITLE, MIN_PEOPLE, TITLE_IDEAS, type RoulettePerson, type RouletteSpin } from "../types";
import { orderParticipants } from "../wheel";
import { RouletteWheel } from "./RouletteWheel";
import styles from "./Roulette.module.css";

type Props = {
  householdId: string;
  people: RoulettePerson[];
  me: string;
  isAdult: boolean;
  timezone: string;
  initialSpins: RouletteSpin[];
};

// "hoy, 13:20" o "3 oct, 13:20", en la hora del hogar
function when(iso: string, timezone: string, locale: string, todayLabel: string): string {
  const date = new Date(iso);
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(d);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(date);
  if (day(date) === day(new Date())) return `${todayLabel}, ${time}`;
  const dayText = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: timezone }).format(date);
  return `${dayText}, ${time}`;
}

export function Roulette({ householdId, people, me, isAdult, timezone, initialSpins }: Props) {
  const t = useTranslations("Roulette");
  const locale = useLocale();
  const order = people.map((p) => p.userId);
  const nameOf = (id: string | null) => people.find((p) => p.userId === id)?.name ?? t("someone");
  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

  const [title, setTitle] = useState("");
  // De partida entran todos menos quien está de ausencia hoy
  const [selected, setSelected] = useState(() => people.filter((p) => !p.awayUntil).map((p) => p.userId));
  const [formError, setFormError] = useState<"titleRequired" | "needTwo" | null>(null);
  const { spins, shown, rotation, phase, error, spin, showSelection, clearError } = useRoulette({
    householdId,
    initialSpins,
    peopleOrder: order,
  });

  const busy = phase === "asking" || phase === "spinning";
  // Al girar, la rueda se pone a la vista (el botón está más abajo)
  const stageRef = useRef<HTMLElement>(null);
  const onWheel = orderParticipants(shown ? shown.participants : selected, order);
  const wheelNames = onWheel.map((id) => (id === me ? t("youCap") : nameOf(id)));

  function toggle(userId: string, on: boolean) {
    setFormError(null);
    clearError();
    showSelection();
    setSelected((list) => (on ? [...new Set([...list, userId])] : list.filter((id) => id !== userId)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return setFormError("titleRequired");
    if (selected.length < MIN_PEOPLE) return setFormError("needTwo");
    setFormError(null);
    const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Después de pintar el botón "Girando…" (si no, el navegador corta el desplazamiento suave)
    setTimeout(() => stageRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 50);
    await spin(clean, orderParticipants(selected, order));
  }

  // Lo que se dice al acabar (también para lectores de pantalla)
  const result =
    phase === "done" && shown ? (
      <div className={shown.chosenId === me ? styles.resultMine : styles.result}>
        <p className={styles.resultTitle}>
          {shown.chosenId === me ? t("result.you") : t("result.other", { name: nameOf(shown.chosenId) })}
        </p>
        <p className={styles.resultWhat}>«{shown.title}»</p>
        <p className={styles.resultMeta}>
          {shown.spunBy === me ? t("result.byYou", { count: shown.participants.length }) : t("result.by", { name: nameOf(shown.spunBy), count: shown.participants.length })}
        </p>
      </div>
    ) : null;

  return (
    <div className={styles.wrapper}>
      <section className={styles.stage} ref={stageRef}>
        <RouletteWheel
          names={wheelNames}
          rotation={rotation}
          spinning={phase === "spinning"}
          label={t("wheelLabel", { names: new Intl.ListFormat(locale, { type: "conjunction" }).format(wheelNames) })}
        />
        <div aria-live="polite" className={styles.live}>
          {phase === "spinning" && shown ? (
            <p className={styles.spinningText}>
              {shown.spunBy === me ? t("spinning") : t("spinningBy", { name: nameOf(shown.spunBy), title: shown.title })}
            </p>
          ) : (
            (result ?? <p className={styles.idleText}>{t("idle")}</p>)
          )}
        </div>
      </section>

      {isAdult ? (
        <form className={styles.card} onSubmit={onSubmit} noValidate>
          {error ? <Alert tone="error">{t(`errors.${error}`)}</Alert> : null}
          <div className={styles.field}>
            <label htmlFor="roulette-title" className={styles.label}>
              {t("form.title")}
            </label>
            <input
              id="roulette-title"
              className={styles.input}
              value={title}
              maxLength={MAX_TITLE}
              placeholder={t("form.placeholder")}
              autoComplete="off"
              aria-invalid={formError === "titleRequired" ? true : undefined}
              aria-describedby={formError === "titleRequired" ? "roulette-title-error" : undefined}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setFormError(null);
                clearError();
                setTitle(e.target.value);
              }}
            />
            {formError === "titleRequired" ? (
              <p id="roulette-title-error" className={styles.error}>
                {t("errors.titleRequired")}
              </p>
            ) : null}
            <div className={styles.ideas}>
              {TITLE_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  className={styles.idea}
                  onClick={() => {
                    setFormError(null);
                    clearError();
                    setTitle(t(`ideas.${idea}`));
                  }}
                >
                  {t(`ideas.${idea}`)}
                </button>
              ))}
            </div>
          </div>

          <fieldset className={styles.fieldset} aria-describedby={formError === "needTwo" ? "roulette-people-error" : undefined}>
            <legend className={styles.label}>{t("form.people", { count: selected.length })}</legend>
            <div className={styles.people}>
              {people.map((person) => {
                const checked = selected.includes(person.userId);
                return (
                  <label key={person.userId} className={checked ? styles.personOn : styles.person}>
                    <input
                      type="checkbox"
                      className="visually-hidden"
                      checked={checked}
                      disabled={!checked && selected.length >= MAX_PEOPLE}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => toggle(person.userId, e.target.checked)}
                    />
                    <span className={styles.personName}>{person.userId === me ? t("youCap") : person.name}</span>
                    {person.awayUntil ? (
                      <span className={styles.personAway}>{t("form.awayUntil", { date: shortDate(person.awayUntil) })}</span>
                    ) : person.role === "minor" ? (
                      <span className={styles.personAway}>{t("form.minor")}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            {formError === "needTwo" ? (
              <p id="roulette-people-error" className={styles.error}>
                {t("errors.needTwo")}
              </p>
            ) : null}
          </fieldset>

          <Button type="submit" fullWidth disabled={busy}>
            {busy ? t("form.spinning") : t("form.spin")}
          </Button>
        </form>
      ) : (
        <p className={styles.minorNote}>{t("minorNote")}</p>
      )}

      <section className={styles.history}>
        <h2 className={styles.historyTitle}>{t("history.title")}</h2>
        {spins.length === 0 ? (
          <p className={styles.empty}>{t("history.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {spins.map((s) => (
              <li key={s.id} className={styles.row}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>«{s.title}»</span>
                  <span className={styles.rowMeta}>
                    {t("history.meta", {
                      mine: s.spunBy === me ? "true" : "false",
                      who: nameOf(s.spunBy),
                      when: when(s.createdAt, timezone, locale, t("today")),
                      count: s.participants.length,
                    })}
                  </span>
                </span>
                <span className={s.chosenId === me ? styles.chosenMine : styles.chosen}>
                  {s.chosenId === me ? t("youCap") : nameOf(s.chosenId)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
