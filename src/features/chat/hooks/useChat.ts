"use client";
// Estado del chat en el navegador, en vivo.
//
// Cómo funciona:
//  1. La página trae los últimos mensajes desde el servidor para que se vean al instante.
//  2. Supabase Realtime avisa de cada mensaje nuevo o editado y se mete en la lista.
//  3. Al mandar, el mensaje sale en pantalla al momento ("enviando…") y se sustituye por el guardado.
//     Si falla, se queda marcado para reintentarlo.
//  4. Al volver a la app (otra pestaña, móvil bloqueado) se piden los mensajes que hayan llegado mientras.
//  5. Lo que llega de otros mientras miras el chat se marca como leído.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  editMessage,
  fetchMessages,
  fetchNewer,
  fetchVersions,
  hideMessage,
  markRead,
  sendMessage,
  toMessage,
  unhideMessage,
  type MessageRow,
} from "../api";
import { toChatErrorKey } from "../errors";
import { normalizeTimestamp, upsertMessage } from "../timeline";
import { MAX_MESSAGE, type ChatErrorKey, type ChatMessage } from "../types";

const READ_DELAY_MS = 800;

// Cada chat abierto usa un canal con nombre propio (Supabase reutiliza los canales con el mismo nombre)
let channelCount = 0;

type Options = {
  conversationId: string;
  me: string;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  // Avisa cuando llega un mensaje (para bajar la pantalla si hace falta)
  onIncoming?: (message: ChatMessage) => void;
  // Después de mandar (para lanzar los avisos al móvil de los demás)
  onSent?: () => void;
};

export function useChat({ conversationId, me, initialMessages, initialHasMore, onIncoming, onSent }: Options) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<ChatErrorKey | null>(null);
  // El último mensaje borrado para mí (para poder deshacerlo)
  const [lastHidden, setLastHidden] = useState<ChatMessage | null>(null);

  // Copias para leer lo último desde funciones que no se vuelven a crear
  const messagesRef = useRef(messages);
  const incomingRef = useRef(onIncoming);
  const sentRef = useRef(onSent);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    incomingRef.current = onIncoming;
    sentRef.current = onSent;
  });
  const tempCounter = useRef(0);
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRead = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (readTimer.current) clearTimeout(readTimer.current);
    readTimer.current = setTimeout(() => {
      markRead(supabase, conversationId).catch((e) => console.error("[chat] no se pudo marcar como leído:", e));
    }, READ_DELAY_MS);
  }, [supabase, conversationId]);

  // Un mensaje que llega (en vivo o al ponerse al día)
  const receive = useCallback(
    (message: ChatMessage) => {
      setMessages((list) => {
        if (list.some((m) => m.id === message.id)) return upsertMessage(list, message);
        // Si es mío y aún está "enviando…", sustituye a ese
        if (message.senderId === me) {
          const temp = list.find((m) => m.pending && m.body === message.body);
          if (temp) return upsertMessage(list.filter((m) => m.id !== temp.id), message);
        }
        return upsertMessage(list, message);
      });
      if (message.senderId !== me) {
        scheduleRead();
        incomingRef.current?.(message);
      }
    },
    [me, scheduleRead],
  );

  // Pide lo que haya llegado después del último mensaje que tenemos
  const catchUp = useCallback(async () => {
    const saved = messagesRef.current.filter((m) => !m.pending && !m.failed);
    const latest = saved[saved.length - 1]?.createdAt;
    try {
      const fresh = latest
        ? await fetchNewer(supabase, conversationId, latest)
        : (await fetchMessages(supabase, conversationId)).messages;
      fresh.forEach(receive);
    } catch (e) {
      console.error("[chat] no se pudo poner al día:", e);
    }
  }, [supabase, conversationId, receive]);

  useEffect(() => {
    channelCount += 1;
    const filter = `conversation_id=eq.${conversationId}`;
    const channel = supabase
      .channel(`chat-${conversationId}-${channelCount}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter }, (payload) =>
        receive(toMessage(payload.new as MessageRow)),
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter }, (payload) => {
        const updated = toMessage(payload.new as MessageRow);
        // Solo si lo tenemos (si lo borré para mí, no vuelve)
        setMessages((list) => (list.some((m) => m.id === updated.id) ? upsertMessage(list, updated) : list));
      })
      .subscribe((status) => {
        // Al (re)conectar, por si se perdió algo mientras estaba desconectado
        if (status === "SUBSCRIBED") void catchUp();
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void catchUp();
        scheduleRead();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    scheduleRead();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (readTimer.current) clearTimeout(readTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, receive, catchUp, scheduleRead]);

  // Mandar. Devuelve false si el texto no vale (para no vaciar la caja).
  const send = useCallback(
    (text: string): boolean => {
      const body = text.trim();
      if (!body) {
        setError("empty");
        return false;
      }
      if (body.length > MAX_MESSAGE) {
        setError("tooLong");
        return false;
      }
      setError(null);
      tempCounter.current += 1;
      const temp: ChatMessage = {
        id: `temp-${tempCounter.current}`,
        senderId: me,
        body,
        createdAt: normalizeTimestamp(new Date().toISOString()),
        editedAt: null,
        pending: true,
      };
      setMessages((list) => upsertMessage(list, temp));
      sendMessage(supabase, conversationId, body)
        .then((saved) => {
          setMessages((list) => upsertMessage(list.filter((m) => m.id !== temp.id), saved));
          sentRef.current?.();
        })
        .catch((e) => {
          const key = toChatErrorKey(e);
          setError(key);
          setMessages((list) => list.map((m) => (m.id === temp.id ? { ...m, pending: false, failed: true } : m)));
        });
      return true;
    },
    [supabase, conversationId, me],
  );

  // Volver a mandar uno que falló
  const retry = useCallback(
    (failed: ChatMessage) => {
      setMessages((list) => list.filter((m) => m.id !== failed.id));
      send(failed.body);
    },
    [send],
  );

  // Quitar de la pantalla uno que falló (sin mandarlo)
  const discard = useCallback((failed: ChatMessage) => {
    setMessages((list) => list.filter((m) => m.id !== failed.id));
  }, []);

  // Editar uno mío. Devuelve true si se guardó.
  const edit = useCallback(
    async (message: ChatMessage, text: string): Promise<boolean> => {
      const body = text.trim();
      if (!body) {
        setError("empty");
        return false;
      }
      if (body.length > MAX_MESSAGE) {
        setError("tooLong");
        return false;
      }
      if (body === message.body) return true;
      setMessages((list) => upsertMessage(list, { ...message, body, editedAt: normalizeTimestamp(new Date().toISOString()) }));
      try {
        const saved = await editMessage(supabase, message.id, body);
        setMessages((list) => upsertMessage(list, saved));
        setError(null);
        return true;
      } catch (e) {
        setMessages((list) => upsertMessage(list, message));
        setError(toChatErrorKey(e as { message?: string }));
        return false;
      }
    },
    [supabase],
  );

  // Borrar para mí (se puede deshacer)
  const hide = useCallback(
    async (message: ChatMessage) => {
      setMessages((list) => list.filter((m) => m.id !== message.id));
      setLastHidden(message);
      try {
        await hideMessage(supabase, message.id);
      } catch (e) {
        setMessages((list) => upsertMessage(list, message));
        setLastHidden(null);
        setError(toChatErrorKey(e as { message?: string }));
      }
    },
    [supabase],
  );

  const undoHide = useCallback(async () => {
    const message = lastHidden;
    if (!message) return;
    setLastHidden(null);
    setMessages((list) => upsertMessage(list, message));
    try {
      await unhideMessage(supabase, message.id);
    } catch (e) {
      setMessages((list) => list.filter((m) => m.id !== message.id));
      setError(toChatErrorKey(e as { message?: string }));
    }
  }, [supabase, lastHidden]);

  // Mensajes anteriores (paginación hacia arriba)
  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current.find((m) => !m.pending && !m.failed);
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await fetchMessages(supabase, conversationId, oldest.createdAt);
      setMessages((list) => page.messages.reduce(upsertMessage, list));
      setHasMore(page.hasMore);
    } catch (e) {
      setError(toChatErrorKey(e as { message?: string }));
    } finally {
      setLoadingOlder(false);
    }
  }, [supabase, conversationId, loadingOlder]);

  const versions = useCallback((messageId: string) => fetchVersions(supabase, messageId), [supabase]);

  return {
    messages,
    hasMore,
    loadingOlder,
    error,
    dismissError: () => setError(null),
    lastHidden,
    dismissHidden: () => setLastHidden(null),
    send,
    retry,
    discard,
    edit,
    hide,
    undoHide,
    loadOlder,
    versions,
  };
}
