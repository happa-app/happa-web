"use client";
// Una votación dentro del chat: la pregunta y cada opción con su barra, el número de votos y las caras de
// quién la ha votado (los votos son públicos). Se toca una opción para votar o quitar el voto.
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatPerson, ChatPoll } from "../types";
import styles from "./Chat.module.css";

type Props = {
  poll: ChatPoll;
  me: string;
  people: Map<string, ChatPerson>;
  // null = puedes votar; si no, por qué no
  cannotVote: "notResident" | "minor" | null;
  onVote: (optionIds: string[]) => void;
};

// Caras que se enseñan por opción (el resto, "+N")
const MAX_FACES = 4;

export function PollCard({ poll, me, people, cannotVote, onVote }: Props) {
  const t = useTranslations("Chat.poll");
  const mine = poll.options.filter((o) => o.voters.includes(me)).map((o) => o.id);
  // Cada persona cuenta una vez aunque marque varias opciones
  const voters = new Set(poll.options.flatMap((o) => o.voters)).size;

  function choose(optionId: string) {
    if (cannotVote) return;
    const chosen = mine.includes(optionId);
    if (poll.multiple) onVote(chosen ? mine.filter((id) => id !== optionId) : [...mine, optionId]);
    // Con una sola respuesta: otra opción cambia el voto; la misma lo quita
    else onVote(chosen ? [] : [optionId]);
  }

  return (
    <div className={styles.poll}>
      <p className={styles.pollQuestion}>{poll.question}</p>
      <p className={styles.pollHint}>
        {poll.multiple ? t("multiple") : t("single")} · {t("voters", { count: voters })}
      </p>

      <ul className={styles.pollOptions} role="list">
        {poll.options.map((option) => {
          const chosen = mine.includes(option.id);
          const faces = option.voters.slice(0, MAX_FACES);
          const extra = option.voters.length - faces.length;
          const names = option.voters.map((id) => (id === me ? t("you") : (people.get(id)?.name ?? t("someone"))));
          return (
            <li key={option.id}>
              <button
                type="button"
                role={poll.multiple ? "checkbox" : "radio"}
                aria-checked={chosen}
                className={chosen ? `${styles.pollOption} ${styles.pollOptionChosen}` : styles.pollOption}
                onClick={() => choose(option.id)}
                disabled={cannotVote !== null}
                aria-label={t("optionLabel", { label: option.label, count: option.voters.length })}
              >
                <span
                  className={styles.pollBar}
                  // La barra es la parte de la gente que ha votado que ha elegido esta opción
                  style={{ width: `${voters === 0 ? 0 : (option.voters.length / voters) * 100}%` }}
                  aria-hidden="true"
                />
                <span className={poll.multiple ? styles.pollCheck : `${styles.pollCheck} ${styles.pollRadio}`} aria-hidden="true">
                  {chosen ? "✓" : ""}
                </span>
                <span className={styles.pollLabel}>{option.label}</span>
                <span className={styles.pollCount}>{option.voters.length}</span>
              </button>
              {option.voters.length > 0 ? (
                <p className={styles.pollVoters} title={names.join(", ")}>
                  <span className={styles.pollFaces} aria-hidden="true">
                    {faces.map((id) => {
                      const person = people.get(id);
                      return <Avatar key={id} name={person?.name ?? "?"} imageUrl={person?.avatarUrl ?? null} size="xs" />;
                    })}
                    {extra > 0 ? <span className={styles.pollExtra}>+{extra}</span> : null}
                  </span>
                  <span className="visually-hidden">{names.join(", ")}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {cannotVote ? <p className={styles.pollHint}>{t(cannotVote === "minor" ? "minorsCannotVote" : "residentsOnly")}</p> : null}
    </div>
  );
}
