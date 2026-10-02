// Lecturas del triqui: solo para páginas y acciones del servidor (usan las cookies de la sesión).
// Nunca importes este archivo desde un componente con "use client".
export {
  getExpense,
  getMyLeftDebts,
  getMyTriquiSummary,
  getTriquiContext,
  getTriquiOverview,
  getTriquiPeople,
} from "./queries";
