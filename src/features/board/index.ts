// Lo que el resto de la app puede usar del corcho. Importa desde "@/features/board".
// Las lecturas de la base de datos están en "@/features/board/server".
export { BoardTop } from "./components/BoardTop";
export { NotesSections } from "./components/NotesSections";
export { PaymentForm } from "./components/PaymentForm";
export { PaymentsSection } from "./components/PaymentsSection";
export { WifiForm } from "./components/WifiForm";
export { uuidSchema } from "./schemas";
export type { BoardNote, BoardPayment, BoardWifi } from "./types";
