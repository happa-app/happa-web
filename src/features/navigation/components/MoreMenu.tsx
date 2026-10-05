// Contenido de "Más": lo del hogar (empezando por su configuración) y lo tuyo.
import { useTranslations } from "next-intl";
import { BellIcon, BroomIcon, CartIcon, ClockIcon, GearIcon, ListIcon, WalletIcon } from "@/components/brand/Icons";
import { MenuList, type MenuItem } from "./MenuList";

type Props = {
  // El hogar de la barra (null si aún no estás en ninguno)
  household: { id: string; name: string; isResident: boolean; isAdult: boolean } | null;
};

export function MoreMenu({ household }: Props) {
  const t = useTranslations("More");

  const householdItems: MenuItem[] = [];
  if (household) {
    const base = `/hogar/${household.id}`;
    householdItems.push({ href: `${base}/configuracion`, icon: <GearIcon />, title: t("settings"), description: t("settingsHint") });
    if (household.isResident) {
      householdItems.push({ href: `${base}/compra`, icon: <CartIcon />, title: t("shopping"), description: t("shoppingHint") });
    }
    // Los gastos son solo para adultos
    if (household.isAdult) {
      householdItems.push({ href: `${base}/gastos`, icon: <WalletIcon />, title: t("expenses"), description: t("expensesHint") });
    }
    if (household.isResident) {
      householdItems.push(
        { href: `${base}/horarios`, icon: <ClockIcon />, title: t("schedules"), description: t("schedulesHint") },
        { href: `${base}/tareas`, icon: <BroomIcon />, title: t("chores"), description: t("choresHint") },
      );
    }
  }

  const yourItems: MenuItem[] = [
    { href: "/compra", icon: <ListIcon />, title: t("personalList"), description: t("personalListHint") },
    { href: "/avisos", icon: <BellIcon />, title: t("notifications"), description: t("notificationsHint") },
    { href: "/avisos/ajustes", icon: <GearIcon />, title: t("notificationSettings"), description: t("notificationSettingsHint") },
  ];

  return (
    <>
      {household ? <MenuList title={household.name} items={householdItems} /> : null}
      <MenuList title={t("you")} items={yourItems} />
    </>
  );
}
