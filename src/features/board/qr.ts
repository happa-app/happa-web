// El QR del WiFi como imagen SVG. Se genera en el servidor (la contraseña no sale a ningún servicio de fuera)
// y la página lo manda ya hecho: el navegador no carga la librería.
import QRCode from "qrcode";
import { wifiQrText } from "./logic";
import type { BoardWifi } from "./types";

export function wifiQrSvg(wifi: BoardWifi): Promise<string> {
  return QRCode.toString(wifiQrText(wifi), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
}
