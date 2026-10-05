"use client";
// La ruleta en el navegador: girar (la base de datos elige), animar la rueda hasta el resultado y ver en
// vivo los giros de los demás. Mientras la rueda gira, lo que llega se pone en cola y se anima después.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestPushDispatch } from "@/lib/push/request";
import { createClient } from "@/lib/supabase/client";
import { fetchSpin, fetchSpins, spinRoulette, toSpin, type SpinRow } from "../api";
import { toRouletteErrorKey } from "../errors";
import { HISTORY_SIZE, type RouletteErrorKey, type RouletteSpin } from "../types";
import { orderParticipants, targetRotation } from "../wheel";

// Lo que tarda la rueda en pararse (igual que la transición del CSS)
export const SPIN_MS = 4200;
// Lo que se deja ver un resultado antes de animar el siguiente giro de la cola
export const RESULT_MS = 2500;

let channelCount = 0;

type Phase = "idle" | "asking" | "spinning" | "done";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export function useRoulette({
  householdId,
  initialSpins,
  peopleOrder,
}: {
  householdId: string;
  initialSpins: RouletteSpin[];
  peopleOrder: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [spins, setSpins] = useState(initialSpins);
  // El giro que enseña la rueda (null: la rueda enseña a quienes has elegido)
  const [shown, setShown] = useState<RouletteSpin | null>(null);
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<RouletteErrorKey | null>(null);

  // Lo que hace falta dentro de los callbacks sin volver a crearlos
  const known = useRef(new Set(initialSpins.map((s) => s.id)));
  const queue = useRef<RouletteSpin[]>([]);
  const busy = useRef(false);
  const rotationRef = useRef(0);
  const orderRef = useRef(peopleOrder);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    orderRef.current = peopleOrder;
  }, [peopleOrder]);

  const remember = useCallback((spin: RouletteSpin) => {
    known.current.add(spin.id);
    setSpins((list) =>
      list.some((s) => s.id === spin.id) ? list : [spin, ...list].slice(0, HISTORY_SIZE),
    );
  }, []);

  // Anima un giro hasta su resultado; al acabar, sigue con la cola
  const animate = useCallback(
    (spin: RouletteSpin) => {
      busy.current = true;
      known.current.add(spin.id);
      const order = orderParticipants(spin.participants, orderRef.current);
      const index = Math.max(0, order.indexOf(spin.chosenId ?? ""));
      const next = targetRotation(rotationRef.current, index, order.length, Math.random() * 0.6 - 0.3);
      rotationRef.current = next;
      setShown(spin);
      setRotation(next);
      setPhase("spinning");
      timer.current = setTimeout(
        () => {
          remember(spin);
          setPhase("done");
          const following = queue.current.shift();
          if (!following) {
            busy.current = false;
            return;
          }
          // Hay otro esperando: antes, que se vea (y se anuncie) a quién le ha tocado este
          timer.current = setTimeout(() => animate(following), RESULT_MS);
        },
        reducedMotion() ? 0 : SPIN_MS,
      );
    },
    [remember],
  );

  // Llega un giro (de otro, en vivo)
  const receive = useCallback(
    (spin: RouletteSpin) => {
      if (known.current.has(spin.id) || queue.current.some((s) => s.id === spin.id)) return;
      if (busy.current) queue.current.push(spin);
      else animate(spin);
    },
    [animate],
  );

  // Por si se perdió algo mientras no había conexión: se apunta en el historial sin animarlo
  const catchUp = useCallback(async () => {
    try {
      const fresh = await fetchSpins(supabase, householdId);
      for (const spin of fresh.reverse()) {
        if (!known.current.has(spin.id) && !queue.current.some((s) => s.id === spin.id)) remember(spin);
      }
    } catch (e) {
      console.error("[ruleta] no se pudo poner al día:", e);
    }
  }, [supabase, householdId, remember]);

  useEffect(() => {
    channelCount += 1;
    const channel = supabase
      .channel(`roulette-${householdId}-${channelCount}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "roulette_spins", filter: `household_id=eq.${householdId}` },
        (payload) => {
          const row = payload.new as SpinRow;
          if (known.current.has(row.id)) return;
          // El giro llega sin quiénes entraban: se piden
          void fetchSpin(supabase, row.id)
            .then((spin) => receive(spin ?? toSpin(row, [])))
            .catch((e) => console.error("[ruleta] no se pudo leer un giro:", e));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void catchUp();
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, householdId, receive, catchUp]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Girar. Devuelve false si no se pudo (el error queda en "error").
  const spin = useCallback(
    async (participants: string[]): Promise<boolean> => {
      if (busy.current) return false;
      busy.current = true;
      setError(null);
      setPhase("asking");
      const result = await spinRoulette(supabase, householdId, participants);
      if (!result.spin) {
        busy.current = false;
        setPhase("idle");
        setError(toRouletteErrorKey(result.error ?? {}));
        // Lo que llegó de otros mientras tanto
        const following = queue.current.shift();
        if (following) animate(following);
        return false;
      }
      // Si el mismo giro ya había llegado en vivo, no se repite
      queue.current = queue.current.filter((s) => s.id !== result.spin!.id);
      animate(result.spin);
      // El aviso al móvil de a quien le ha tocado
      requestPushDispatch();
      return true;
    },
    [supabase, householdId, animate],
  );

  // Al cambiar a quién se elige, la rueda vuelve a enseñar la elección (si no está girando)
  const showSelection = useCallback(() => {
    if (busy.current) return;
    setShown(null);
    setPhase("idle");
  }, []);

  return { spins, shown, rotation, phase, error, spin, showSelection, clearError: () => setError(null) };
}
