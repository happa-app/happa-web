// Círculo con la inicial de un nombre (o la foto, si la hay).
import styles from "./Avatar.module.css";

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
};

export function Avatar({ name, imageUrl, size = "md" }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden="true">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatares pequeños de Supabase Storage
        <img src={imageUrl} alt="" className={styles.image} />
      ) : (
        initial
      )}
    </span>
  );
}
