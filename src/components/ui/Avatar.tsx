// Círculo con la inicial de un nombre y, si la hay, la foto encima (si la foto no carga, se ve la inicial).
import styles from "./Avatar.module.css";

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
};

export function Avatar({ name, imageUrl, size = "md" }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden="true">
      {initial}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- fotos pequeñas (512 px) de Supabase Storage
        <img src={imageUrl} alt="" className={styles.image} loading="lazy" decoding="async" />
      ) : null}
    </span>
  );
}
