// La ruleta del marrón. Importa desde "@/features/roulette"; la lectura para la página está en
// "@/features/roulette/server".
export { Roulette } from "./components/Roulette";
export { RouletteWheel } from "./components/RouletteWheel";
// Para la demo de la portada, que gira la misma rueda sin base de datos
export { targetRotation } from "./wheel";
export type { RoulettePage, RoulettePerson, RouletteSpin } from "./types";
