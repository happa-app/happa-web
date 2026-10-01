// Logo de HAPPA: el icono de la casa con la H y el nombre.
import styles from "./Logo.module.css";

type Props = {
  size?: "md" | "lg";
  showName?: boolean;
};

export function Logo({ size = "md", showName = true }: Props) {
  return (
    <span className={`${styles.logo} ${styles[size]}`}>
      <svg className={styles.mark} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--color-brand)" />
        <path
          d="M14 31 32 16l18 15"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 30v16h6v-6h8v6h6V30h-6v5h-8v-5z" fill="#fff" />
        <rect x="14" y="49" width="36" height="3" rx="1.5" fill="#fff" />
      </svg>
      {showName ? <span className={styles.name}>Happa</span> : <span className="visually-hidden">Happa</span>}
    </span>
  );
}
