// Lo que el resto de la app puede usar de esta feature. Importa desde "@/features/households".
// Las lecturas de la base de datos están aparte, en "@/features/households/server",
// porque solo pueden ejecutarse en el servidor.
export { leaveHousehold, regenerateInviteCode } from "./actions";
export { ConfirmSubmitButton } from "./components/ConfirmSubmitButton";
export { CreateHouseholdForm } from "./components/CreateHouseholdForm";
export { HouseholdList } from "./components/HouseholdList";
export { InvitePanel } from "./components/InvitePanel";
export { JoinHouseholdForm } from "./components/JoinHouseholdForm";
export { MemberList } from "./components/MemberList";
export { Occupancy } from "./components/Occupancy";
export { PlacesForm } from "./components/PlacesForm";
export { normalizeInviteCode } from "./invite-code";
export { defaultPlaces, isFull, MAX_PLACES, residentCount } from "./places";
export type { HouseholdDetail, HouseholdSummary, InvitePreview } from "./types";
