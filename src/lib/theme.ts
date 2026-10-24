// Tema claro / oscuro. Se elige en Perfil → Tema y se guarda en este navegador (localStorage), no en la
// cuenta: así vale también en la portada y el login, y cada dispositivo puede tener el suyo.
//   · "system": igual que el dispositivo (lo que viene por defecto)
//   · "light" / "dark": siempre claro / siempre oscuro
// Lo aplica <html data-theme="light|dark">: los colores de cada tema están en src/styles/tokens.css.
import { APP_BACKGROUND, APP_BACKGROUND_DARK } from "./brand";

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const THEME_STORAGE_KEY = "happa-tema";
// Aviso dentro de la página cuando cambia la elección (localStorage solo avisa a las otras pestañas)
const THEME_EVENT = "happa-tema";

export function readThemeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    // Navegación privada o almacenamiento bloqueado: como el dispositivo
    return "system";
  }
}

export function saveThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Si no se puede guardar, se aplica igual hasta que se cierre la página
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

// Para useSyncExternalStore: avisa cuando cambia la elección (en esta pestaña o en otra)
export function subscribeThemeChoice(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// El script que va en el <head> de todas las páginas. Se ejecuta antes de pintar nada (si no, al abrir la
// app en oscuro se vería un fogonazo blanco). Pone data-theme, el color de la barra de arriba del móvil, y
// sigue al dispositivo si cambia de claro a oscuro con la app abierta. Es texto: no puede importar nada.
export const THEME_SCRIPT = `(function () {
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");
  function choice() {
    try {
      var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
      return saved === "light" || saved === "dark" ? saved : "system";
    } catch (e) {
      return "system";
    }
  }
  function apply() {
    var c = choice();
    var theme = c === "system" ? (media.matches ? "dark" : "light") : c;
    root.dataset.theme = theme;
    var color = theme === "dark" ? "${APP_BACKGROUND_DARK}" : "${APP_BACKGROUND}";
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute("content", color);
  }
  apply();
  document.addEventListener("DOMContentLoaded", apply);
  media.addEventListener("change", apply);
  window.addEventListener("${THEME_EVENT}", apply);
  window.addEventListener("storage", apply);
})();`;
