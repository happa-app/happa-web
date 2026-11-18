// Lo que el resto de la app puede usar del chat. Importa desde "@/features/chat".
// Las lecturas de la base de datos están en "@/features/chat/server".
export { ChatRoom } from "./components/ChatRoom";
export { DebtChatList } from "./components/DebtChatList";
export { DebtStrip } from "./components/DebtStrip";
export type { ChatInfo, ChatMessage, ChatPerson, ChatSummary } from "./types";
