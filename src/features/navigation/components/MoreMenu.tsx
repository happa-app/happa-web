// Contenido de "Más": la configuración del hogar y lo tuyo. Lo que ya está en Inicio (compra, gastos,
// horarios, tareas) no se repite aquí, y los avisos están en la campana de arriba.
// Aquí irá lo que no tiene sitio en la barra (eventos, votaciones, la caja de herramientas...).
import { useTranslations } from "next-intl";
import { GearIcon, ListIcon } from "@/components/brand/Icons";
import { MenuList, type MenuItem } from "./MenuList";

type Props = {
  // El hogar de la barra (null si aún no estás en ninguno)
  household: { id: string; name: string } | null;
};

export function MoreMenu({ household }: Props) {
  const t = useTranslations("More");

  const householdItems: MenuItem[] = household
    ? [{ href: `/hogar/${household.id}/configuracion`, icon: <GearIcon />, title: t("settings"), description: t("settingsHint") }]
    : [];
  const yourItems: MenuItem[] = [
    { href: "/compra", icon: <ListIcon />, title: t("personalList"), description: t("personalListHint") },
  ];

  return (
    <>
      {household ? <MenuList title={household.name} items={householdItems} /> : null}
      <MenuList title={t("you")} items={yourItems} />
    </>
  );
}
