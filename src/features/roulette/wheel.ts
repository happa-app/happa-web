// Cuentas de la rueda (sin React: valen en el navegador y en las pruebas).
// La rueda se dibuja con el primer trozo empezando arriba y siguiendo como las agujas del reloj.
// La flecha está arriba, fija; lo que gira es la rueda.

// Cuántas vueltas completas da antes de pararse
export const EXTRA_TURNS = 5;

// Grados de cada trozo
export function segmentAngle(count: number): number {
  return count > 0 ? 360 / count : 360;
}

// El giro final (en grados, siempre mayor que el de ahora) para que la flecha quede en el centro del
// trozo "index". "jitter" (de -0.35 a 0.35) mueve un poco el punto dentro del trozo, para que no caiga
// siempre justo en el medio.
export function targetRotation(current: number, index: number, count: number, jitter = 0): number {
  const seg = segmentAngle(count);
  // Con la rueda girada R grados, la flecha (arriba) apunta al ángulo -R de la rueda
  const wanted = (360 - (index + 0.5 + Math.max(-0.35, Math.min(0.35, jitter))) * seg) % 360;
  const now = ((current % 360) + 360) % 360;
  let delta = wanted - now;
  if (delta < 0) delta += 360;
  return current + EXTRA_TURNS * 360 + delta;
}

// Qué trozo queda bajo la flecha con la rueda girada "rotation" grados
export function segmentAt(rotation: number, count: number): number {
  const seg = segmentAngle(count);
  const pointer = (((-rotation) % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(pointer / seg));
}

// Punto del borde de la rueda (para dibujar los trozos). Ángulo 0 = arriba.
export function polar(cx: number, cy: number, r: number, degrees: number): { x: number; y: number } {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Camino SVG de un trozo
export function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  if (end - start >= 359.999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x.toFixed(3)} ${a.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} Z`;
}

// Orden de los trozos: el de la lista de personas del hogar (igual para todos los que miran)
export function orderParticipants(participants: string[], peopleOrder: string[]): string[] {
  const rank = new Map(peopleOrder.map((id, i) => [id, i]));
  return [...new Set(participants)].sort(
    (a, b) => (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b),
  );
}
