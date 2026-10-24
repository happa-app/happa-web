// Lo que se ve al cambiar de pantalla mientras llegan los datos: la forma de una página (título y unos
// bloques), con la cabecera y la barra de abajo quietas. Lo usan los loading.tsx de la zona privada:
// Next los descarga por adelantado, así que sale al instante al tocar, y cuando la página está lista la
// sustituye sola.
//
// Un loading.tsx solo sale cuando cambia la carpeta que tiene justo debajo. Por eso hay uno en cada
// carpeta con páginas dentro (el hogar, gastos, tareas…): si creas una carpeta así, añádele el suyo.
import { getTranslations } from "next-intl/server";
import styles from "./PageSkeleton.module.css";

export async function PageSkeleton() {
  const t = await getTranslations("Nav");
  return (
    <div className={styles.skeleton} role="status" aria-live="polite">
      <span className="visually-hidden">{t("loading")}</span>
      <span className={`${styles.block} ${styles.title}`} />
      <span className={`${styles.block} ${styles.subtitle}`} />
      <span className={`${styles.block} ${styles.card}`} />
      <span className={`${styles.block} ${styles.card}`} />
      <span className={`${styles.block} ${styles.cardShort}`} />
    </div>
  );
}
