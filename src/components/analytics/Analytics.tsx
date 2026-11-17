"use client";
// Estadísticas de visitas con Vercel Web Analytics: no usa cookies ni guarda nada en el navegador, así que no
// hace falta banner (lo explica la política de cookies). Solo cuenta en Vercel; en local no envía nada.
//
// Antes de enviar cada visita limpiamos la dirección: quitamos lo que va detrás de "?" (el ?next= del login,
// los tokens de /auth/confirm...) y cambiamos los identificadores (/hogar/1b2c…) por [id]. Así a Vercel solo
// le llega qué pantalla se usa, no de qué hogar ni de quién.
//
// Es un componente de cliente ("use client") porque beforeSend es una función, y las funciones no se pueden
// pasar de un componente de servidor (el layout) a uno de cliente.
import { Analytics as VercelAnalytics, type BeforeSendEvent } from "@vercel/analytics/next";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function cleanUrl(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  // Los identificadores (todos son uuid; también los numéricos, por si acaso) y el código de invitación de
  // /unirse/[codigo], que deja entrar en un hogar. Si creas una ruta nueva con un dato que no sea un uuid, añádela.
  url.pathname = url.pathname
    .replace(UUID, "[id]")
    .replace(/\/\d+(?=\/|$)/g, "/[id]")
    .replace(/(\/unirse\/)[^/]+/, "$1[codigo]");
  return { ...event, url: url.toString() };
}

export function Analytics() {
  return <VercelAnalytics beforeSend={cleanUrl} />;
}
