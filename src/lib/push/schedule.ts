// Deja programado el envío de avisos al móvil para cuando termine la respuesta (after de Next.js):
// así la acción no tarda más. Se llama desde las acciones de servidor que pueden crear avisos.
import { after } from "next/server";
import { dispatchPush } from "./dispatch";

export function schedulePushDispatch() {
  try {
    after(async () => {
      try {
        await dispatchPush();
      } catch (e) {
        console.error("[push] falló el envío:", e);
      }
    });
  } catch (e) {
    // Fuera de una petición (por ejemplo, en pruebas) no hay "después"
    console.error("[push] no se pudo programar el envío:", e);
  }
}
