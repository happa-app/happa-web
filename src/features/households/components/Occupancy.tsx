// "3 de 4 personas", con una barrita de lo ocupado.
import { useTranslations } from "next-intl";
import styles from "./HouseholdDetail.module.css";

export function Occupancy({ residents, places }: { residents: number; places: number }) {
  const t = useTranslations("Households");
  const percent = places > 0 ? Math.min(100, Math.round((residents / places) * 100)) : 100;
  return (
    <p className={styles.occupancy}>
      <span>{t("occupancy", { count: residents, max: places })}</span>
      <span className={styles.occupancyBar} aria-hidden="true">
        <span className={styles.occupancyFill} style={{ width: `${percent}%` }} />
      </span>
    </p>
  );
}
