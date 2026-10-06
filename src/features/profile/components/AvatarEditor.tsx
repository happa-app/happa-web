"use client";
// Tu foto: elegirla, encuadrarla en el círculo (arrastrando y con el zoom) y guardarla. O quitarla.
//
// La foto se recorta y se reduce aquí, en el móvil (a 512 × 512, unos 50 KB), y se sube directamente al
// almacén de Supabase, a tu carpeta. Después el servidor la pone en tu perfil y borra las viejas.
import { useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { CameraIcon } from "@/components/brand/Icons";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { removeAvatar, saveAvatar } from "../actions";
import { AVATAR_BUCKET, AVATAR_SIZE, MAX_SOURCE_BYTES, newAvatarPath, type AvatarFormat } from "../avatar";
import { imageBox, initialCrop, MAX_ZOOM, MIN_ZOOM, moveCrop, sourceRect, zoomCrop, type Crop } from "../crop";
import type { PhotoErrorKey } from "../types";
import styles from "./Profile.module.css";

type Props = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

type Source = { url: string; image: HTMLImageElement; width: number; height: number };

// Píxeles de pantalla que se mueve la foto con cada flecha del teclado
const KEY_STEP = 12;
const KEY_ZOOM = 0.2;

// Dibuja el recorte en un cuadrado y lo convierte en archivo: webp, o jpg si el navegador no sabe hacer webp
async function renderCrop(source: Source, crop: Crop): Promise<{ blob: Blob; format: AvatarFormat } | null> {
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingQuality = "high";
  // Fondo blanco, por si la foto tiene partes transparentes
  context.fillStyle = "#fff";
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  const rect = sourceRect(crop, source.width, source.height);
  context.drawImage(source.image, rect.x, rect.y, rect.side, rect.side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, format: "webp" };
  const jpg = await toBlob("image/jpeg");
  return jpg ? { blob: jpg, format: "jpg" } : null;
}

export function AvatarEditor({ userId, name, avatarUrl }: Props) {
  const t = useTranslations("Profile.photo");
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  // Al cerrar el recorte, el foco vuelve al botón (cuando ya se puede pulsar)
  const refocus = useRef(false);
  // Dedos (o ratón) sobre la foto: para arrastrar con uno y hacer zoom con dos
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [source, setSource] = useState<Source | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [busy, setBusy] = useState<"saving" | "removing" | null>(null);
  const [error, setError] = useState<PhotoErrorKey | null>(null);
  const [done, setDone] = useState<"saved" | "removed" | null>(null);

  // La foto elegida ocupa memoria: se suelta al cerrar el recorte (o al salir de la página)
  useEffect(() => {
    if (!source) return;
    return () => URL.revokeObjectURL(source.url);
  }, [source]);

  // Al abrir el recorte, el foco va a la foto (se mueve con las flechas); al cerrarlo, vuelve al botón
  useEffect(() => {
    if (source) {
      viewRef.current?.focus();
    } else if (busy === null && refocus.current) {
      refocus.current = false;
      changeRef.current?.focus();
    }
  }, [source, busy]);

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Para poder elegir otra vez la misma foto
    event.target.value = "";
    if (!file) return;
    setError(null);
    setDone(null);
    // (Algunos móviles no dicen el tipo: entonces se intenta abrir igual)
    if (file.type && !file.type.startsWith("image/")) return setError("notImage");
    if (file.size > MAX_SOURCE_BYTES) return setError("tooBig");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) {
        URL.revokeObjectURL(url);
        setError("cantOpen");
        return;
      }
      setSource({ url, image, width, height });
      setCrop(initialCrop(width, height));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("cantOpen");
    };
    image.src = url;
  }

  function close() {
    pointers.current.clear();
    refocus.current = true;
    setSource(null);
    setCrop(null);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const before = pointers.current.get(event.pointerId);
    if (!before || !source) return;
    const now = { x: event.clientX, y: event.clientY };
    const view = viewRef.current?.clientWidth || 280;
    if (pointers.current.size === 1) {
      setCrop((c) => c && moveCrop(c, source.width, source.height, now.x - before.x, now.y - before.y, view));
    } else if (pointers.current.size === 2) {
      // Pellizco: cuánto se separan (o juntan) los dos dedos
      const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (other) {
        const was = Math.hypot(before.x - other.x, before.y - other.y);
        const is = Math.hypot(now.x - other.x, now.y - other.y);
        if (was > 0) setCrop((c) => c && zoomCrop(c, source.width, source.height, c.zoom * (is / was)));
      }
    }
    pointers.current.set(event.pointerId, now);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!source) return;
    const view = viewRef.current?.clientWidth || 280;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setCrop((c) => c && moveCrop(c, source.width, source.height, move[0], move[1], view));
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setCrop((c) => c && zoomCrop(c, source.width, source.height, c.zoom + KEY_ZOOM));
    } else if (event.key === "-") {
      event.preventDefault();
      setCrop((c) => c && zoomCrop(c, source.width, source.height, c.zoom - KEY_ZOOM));
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  async function save() {
    if (!source || !crop) return;
    setBusy("saving");
    setError(null);
    try {
      const file = await renderCrop(source, crop);
      if (!file) throw new Error("No se pudo dibujar la foto");
      const path = newAvatarPath(userId, file.format);
      const bucket = supabase.storage.from(AVATAR_BUCKET);
      const { error: uploadError } = await bucket.upload(path, file.blob, {
        contentType: file.format === "webp" ? "image/webp" : "image/jpeg",
        // Una hora: cada foto tiene un nombre nuevo, y así una foto quitada deja de verse pronto
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        console.error("[perfil] no se pudo subir la foto:", uploadError);
        setError("uploadFailed");
        return;
      }
      const result = await saveAvatar(path);
      if (!result.ok) {
        await bucket.remove([path]);
        setError("generic");
        return;
      }
      close();
      setDone("saved");
    } catch (e) {
      console.error("[perfil] no se pudo preparar la foto:", e);
      setError("generic");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("removing");
    setError(null);
    setDone(null);
    try {
      const result = await removeAvatar();
      if (result.ok) setDone("removed");
      else setError("generic");
    } catch (e) {
      console.error("[perfil] no se pudo quitar la foto:", e);
      setError("generic");
    } finally {
      setBusy(null);
    }
  }

  const box = source && crop ? imageBox(crop, source.width, source.height) : null;

  return (
    <div className={styles.form}>
      {error ? <Alert tone="error">{t(`errors.${error}`)}</Alert> : null}

      {source && crop && box ? (
        <div className={styles.cropper}>
          <p id="crop-hint" className={styles.photoHint}>
            {t("cropHint")}
          </p>
          <div
            ref={viewRef}
            className={styles.viewport}
            role="group"
            tabIndex={0}
            aria-label={t("cropLabel")}
            aria-describedby="crop-hint"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- la foto elegida, aún en el móvil */}
            <img
              src={source.url}
              alt=""
              draggable={false}
              className={styles.cropImage}
              style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}
            />
            <span className={styles.mask} />
          </div>
          <label className={styles.zoom}>
            {t("zoom")}
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={crop.zoom}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const zoom = Number(e.target.value);
                setCrop((c) => c && zoomCrop(c, source.width, source.height, zoom));
              }}
            />
          </label>
          <div className={styles.cropButtons}>
            <Button type="button" variant="secondary" onClick={close} disabled={busy !== null}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={busy !== null}>
              {busy === "saving" ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.photo}>
          <Avatar name={name} imageUrl={avatarUrl} size="lg" />
          <div className={styles.photoButtons}>
            <Button
              ref={changeRef}
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={busy !== null}
            >
              <CameraIcon size={18} />
              {avatarUrl ? t("change") : t("add")}
            </Button>
            {avatarUrl ? (
              <Button type="button" variant="secondary" onClick={remove} disabled={busy !== null}>
                {busy === "removing" ? t("removing") : t("remove")}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={pick}
      />
      {done && !source ? (
        <p className={styles.saved} role="status">
          {t(done)}
        </p>
      ) : null}
      {!source ? <p className={styles.photoHint}>{t("hint")}</p> : null}
    </div>
  );
}
