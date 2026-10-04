"use client";
// Estado de una lista de la compra en el navegador, sincronizado en vivo.
//
// Cómo funciona:
//  1. La página trae la lista desde el servidor (initialItems) para que se vea al instante.
//  2. Cada acción cambia primero la pantalla (cambio "optimista") y luego guarda en Supabase.
//  3. Supabase Realtime avisa cuando alguien del hogar cambia algo; entonces se vuelve a leer
//     la lista entera. Releer en vez de aplicar cada aviso es más simple y nunca se desincroniza.
//  4. Si algo falla al guardar, se deshace el cambio en pantalla, se avisa y se relee la lista.
//  5. Mientras haya guardados en curso no se aplica ninguna lectura (traería datos de antes del
//     cambio y la casilla "parpadearía"). Al terminar el último guardado, se relee.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestPushDispatch } from "@/lib/push/request";
import { createClient } from "@/lib/supabase/client";
import { deleteItems, fetchItems, insertItem, setChecked, shareItem } from "../api";
import { newItemSchema, type NewItemInput } from "../schemas";
import { SHOPPING_ERROR_KEYS, type ShoppingErrorKey, type ShoppingItem, type ShoppingScope } from "../types";

const REFRESH_DELAY_MS = 150;

// Cada lista abierta usa un canal con nombre propio. Supabase reutiliza un canal si ya existe
// otro con el mismo nombre, aunque se esté cerrando (por ejemplo, al pasar de la página del
// hogar a la lista), y suscribirse dos veces al mismo canal da error.
let channelCount = 0;

export function useShoppingList(scope: ShoppingScope, initialItems: ShoppingItem[]) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<ShoppingErrorKey | null>(null);

  const scopeType = scope.type;
  const scopeId = scope.type === "household" ? scope.householdId : scope.userId;

  // Cada lectura lleva un número; si llega una respuesta antigua después de una nueva, se ignora.
  const latestRequest = useRef(0);
  const pendingWrites = useRef(0);
  const tempCounter = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    // Hay guardados en curso: cuando termine el último se volverá a leer.
    if (pendingWrites.current > 0) return;
    const requestId = ++latestRequest.current;
    try {
      const currentScope: ShoppingScope =
        scopeType === "household" ? { type: "household", householdId: scopeId } : { type: "personal", userId: scopeId };
      const fresh = await fetchItems(supabase, currentScope);
      if (requestId === latestRequest.current) setItems(fresh);
    } catch (e) {
      console.error("[shopping] no se pudo leer la lista:", e);
    }
  }, [supabase, scopeType, scopeId]);

  // Agrupa varios avisos seguidos en una sola lectura.
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refresh(), REFRESH_DELAY_MS);
  }, [refresh]);

  useEffect(() => {
    const filter = scopeType === "household" ? `household_id=eq.${scopeId}` : `owner_id=eq.${scopeId}`;
    channelCount += 1;
    const channel = supabase
      .channel(`shopping-${scopeType}-${scopeId}-${channelCount}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shopping_items", filter }, scheduleRefresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "shopping_items", filter }, scheduleRefresh)
      // Los borrados no se pueden filtrar: cualquier borrado provoca una relectura (barata).
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "shopping_items" }, scheduleRefresh)
      .subscribe((status) => {
        // Al (re)conectar, por si se perdió algún aviso mientras estaba desconectado.
        if (status === "SUBSCRIBED") scheduleRefresh();
      });

    // Al volver a la app (por ejemplo, desde otra pestaña o tras bloquear el móvil).
    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [supabase, scopeType, scopeId, scheduleRefresh]);

  // Ejecuta un guardado. Si falla: deshace el cambio en pantalla (undo), avisa y relee la lista.
  const save = useCallback(
    async (operation: () => Promise<void>, undo: () => void) => {
      pendingWrites.current += 1;
      // Cualquier lectura que ya estuviera en camino trae datos de antes de este cambio: se descarta.
      latestRequest.current += 1;
      try {
        await operation();
        setError(null);
      } catch (e) {
        console.error("[shopping] no se pudo guardar:", e);
        undo();
        setError("generic");
      } finally {
        pendingWrites.current -= 1;
        scheduleRefresh();
      }
    },
    [scheduleRefresh],
  );

  const currentScope = useCallback(
    (): ShoppingScope =>
      scopeType === "household" ? { type: "household", householdId: scopeId } : { type: "personal", userId: scopeId },
    [scopeType, scopeId],
  );

  // Devuelve true si los datos son válidos (para vaciar el formulario al momento).
  // El guardado sigue en segundo plano; si falla, el producto desaparece y sale el aviso.
  const add = useCallback(
    (input: NewItemInput): boolean => {
      const parsed = newItemSchema.safeParse(input);
      if (!parsed.success) {
        const key = SHOPPING_ERROR_KEYS.find((k) => k === parsed.error.issues[0]?.message);
        setError(key ?? "generic");
        return false;
      }
      tempCounter.current += 1;
      const temp: ShoppingItem = {
        id: `temp-${tempCounter.current}`,
        name: parsed.data.name,
        quantity: parsed.data.quantity,
        checkedAt: null,
        checkedBy: null,
        createdAt: new Date().toISOString(),
        requestedBy: null,
        requestedByName: null,
        pending: true,
      };
      setItems((current) => [temp, ...current]);
      void save(
        // En la lista del hogar, los demás reciben un aviso
        () => insertItem(supabase, currentScope(), parsed.data).then(requestPushDispatch),
        () => setItems((current) => current.filter((i) => i.id !== temp.id)),
      );
      return true;
    },
    [supabase, save, currentScope],
  );

  const toggle = useCallback(
    async (item: ShoppingItem) => {
      const checked = !item.checkedAt;
      setItems((current) =>
        current.map((i) =>
          i.id === item.id ? { ...i, checkedAt: checked ? new Date().toISOString() : null, pending: true } : i,
        ),
      );
      await save(
        () => setChecked(supabase, item.id, checked),
        () => setItems((current) => current.map((i) => (i.id === item.id ? item : i))),
      );
    },
    [supabase, save],
  );

  const remove = useCallback(
    async (item: ShoppingItem) => {
      setItems((current) => current.filter((i) => i.id !== item.id));
      await save(
        () => deleteItems(supabase, [item.id]),
        () => setItems((current) => restore(current, [item])),
      );
    },
    [supabase, save],
  );

  // Borra los comprados que esta persona puede borrar (la pantalla le pasa cuáles), no todos.
  const clearChecked = useCallback(
    async (toClear: ShoppingItem[]) => {
      const ids = toClear.map((i) => i.id);
      setItems((current) => current.filter((i) => !ids.includes(i.id)));
      await save(
        () => deleteItems(supabase, ids),
        () => setItems((current) => restore(current, toClear)),
      );
    },
    [supabase, save],
  );

  const share = useCallback(
    async (item: ShoppingItem, householdId: string) => {
      setItems((current) => current.filter((i) => i.id !== item.id));
      await save(
        () => shareItem(supabase, item.id, householdId).then(requestPushDispatch),
        () => setItems((current) => restore(current, [item])),
      );
    },
    [supabase, save],
  );

  return {
    items,
    error,
    dismissError: () => setError(null),
    add,
    toggle,
    remove,
    clearChecked,
    share,
  };
}

// Vuelve a poner productos quitados (si falló el borrado), en su sitio: los más nuevos arriba.
function restore(current: ShoppingItem[], removed: ShoppingItem[]): ShoppingItem[] {
  const missing = removed.filter((r) => !current.some((i) => i.id === r.id));
  return [...current, ...missing].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
