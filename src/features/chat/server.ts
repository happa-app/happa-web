// Lecturas del chat que solo pueden usarse en el servidor (páginas).
// Nunca importes este archivo desde un componente con "use client".
export { getChatPage, getDebtChatPage, getMyDebtChats } from "./queries";
export type { DebtChatItem, DebtChatPage } from "./queries";
