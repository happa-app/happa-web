// Qué dispositivo es y si HAPPA ya está instalada. Preguntan al navegador (navigator, matchMedia),
// así que solo funcionan en componentes con "use client" y dentro de un efecto o un evento.

// iPhone o iPad. El iPad con iPadOS se hace pasar por un Mac, pero tiene pantalla táctil.
export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Abierta como app instalada (desde el icono de la pantalla de inicio), no en una pestaña del navegador
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
