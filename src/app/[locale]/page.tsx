// Portada para quien no ha iniciado sesión (con sesión, el proxy lleva a /inicio): qué es Happa, qué se
// puede hacer, cómo empezar y cómo instalarla. Entrar y crear cuenta están arriba (para quien ya lo sabe)
// y al final (para quien se decide después de leerlo todo).
import { getTranslations } from "next-intl/server";
import type { ComponentType } from "react";
import { BroomIcon, CartIcon, ChatIcon, ClockIcon, WalletIcon, WheelIcon } from "@/components/brand/Icons";
import { Logo } from "@/components/brand/Logo";
import { InstallGuide } from "@/components/pwa/InstallGuide";
import { LegalLinks } from "@/features/legal";
import { Link } from "@/i18n/navigation";
import styles from "./landing.module.css";

const FEATURES: { key: "shopping" | "expenses" | "chores" | "schedules" | "chat" | "roulette"; Icon: ComponentType<{ size?: number }> }[] = [
  { key: "shopping", Icon: CartIcon },
  { key: "expenses", Icon: WalletIcon },
  { key: "chores", Icon: BroomIcon },
  { key: "schedules", Icon: ClockIcon },
  { key: "chat", Icon: ChatIcon },
  { key: "roulette", Icon: WheelIcon },
];

const STEPS = ["account", "household", "together"] as const;

export default async function LandingPage() {
  const t = await getTranslations("Landing");

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Logo />
        <nav className={styles.account} aria-label={t("accountLabel")}>
          <Link href="/login" className={styles.loginLink}>
            {t("loginShort")}
          </Link>
          <Link href="/registro" className={styles.signupLink}>
            {t("signup")}
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.tagline}>{t("tagline")}</h1>
            <p className={styles.description}>{t("description")}</p>
          </div>
          {/* Notas de nevera con frases de la app: enseñan qué es sin explicarlo. Son de adorno
              (lo mismo se cuenta en el texto), por eso los lectores de pantalla se las saltan. */}
          <ul className={styles.fridge} aria-hidden="true">
            <li className={`${styles.note} ${styles.noteChores}`}>
              <BroomIcon size={20} />
              {t("notes.chores")}
            </li>
            <li className={`${styles.note} ${styles.noteShopping}`}>
              <CartIcon size={20} />
              {t("notes.shopping")}
            </li>
            <li className={`${styles.note} ${styles.noteExpenses}`}>
              <WalletIcon size={20} />
              {t("notes.expenses")}
            </li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="features-title">
          <h2 id="features-title" className={styles.sectionTitle}>
            {t("features.title")}
          </h2>
          <ul className={styles.features}>
            {FEATURES.map(({ key, Icon }) => (
              <li key={key} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <Icon />
                </span>
                <div>
                  <h3 className={styles.featureTitle}>{t(`features.${key}.title`)}</h3>
                  <p className={styles.featureText}>{t(`features.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="steps-title">
          <h2 id="steps-title" className={styles.sectionTitle}>
            {t("steps.title")}
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((key) => (
              <li key={key} className={styles.step}>
                <h3 className={styles.featureTitle}>{t(`steps.${key}.title`)}</h3>
                <p className={styles.featureText}>{t(`steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <InstallGuide />

        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title" className={styles.sectionTitle}>
            {t("closing.title")}
          </h2>
          <p className={styles.featureText}>{t("closing.text")}</p>
          <div className={styles.actions}>
            <Link href="/registro" className={`${styles.action} ${styles.primary}`}>
              {t("signup")}
            </Link>
            <Link href="/login" className={`${styles.action} ${styles.secondary}`}>
              {t("login")}
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <LegalLinks />
      </footer>
    </div>
  );
}
