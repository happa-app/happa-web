"use client";
// "Compartir Happa": abre el menú de compartir del móvil; donde no existe (casi todos los ordenadores),
// copia el enlace.
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ShareIcon } from "@/components/brand/Icons";

export function ShareButton({ className }: { className?: string }) {
  const t = useTranslations("Landing");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si la página se cierra con el aviso puesto, se cancela el temporizador
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function share() {
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Happa", text: t("shareText"), url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Cerrar el menú de compartir sin elegir nada cuenta como error: no hay nada que avisar
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={share}>
        <ShareIcon size={20} />
        {copied ? t("shareCopied") : t("share")}
      </button>
      {/* Para lectores de pantalla: los cambios de texto dentro de un botón no siempre se anuncian */}
      <span role="status" className="visually-hidden">
        {copied ? t("shareCopied") : ""}
      </span>
    </>
  );
}
