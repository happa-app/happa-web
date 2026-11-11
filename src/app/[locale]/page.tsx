// Portada para quien no ha iniciado sesión (con sesión, el proxy lleva a /inicio).
// Arriba, dos mitades: el titular y los capítulos de la demo a un lado, y la app (con datos inventados,
// para tocar sin cuenta) al otro. Debajo, a todo el ancho: cómo empezar, cómo instalarla y el cierre.
// Con el registro cerrado (SIGNUP_CLOSED, modo demo) desaparece todo lo de crear cuenta: queda la demo,
// "Abrimos muy pronto" y un botón para compartirla.
import { Bricolage_Grotesque } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { InstallGuide } from "@/components/pwa/InstallGuide";
import { ShareButton, Tour } from "@/features/demo";
import { LegalLinks } from "@/features/legal";
import { Link } from "@/i18n/navigation";
import { SIGNUP_CLOSED } from "@/lib/signup";
import styles from "./landing.module.css";

// La letra de los titulares, solo en la portada. next/font la descarga al compilar y la sirve desde
// happa.es (no se pide nada a Google cuando alguien entra). Se usa en el CSS como var(--font-display).
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });

const STEPS = ["account", "household", "together"] as const;

export default async function LandingPage() {
  const t = await getTranslations("Landing");

  return (
    <div className={`${styles.page} ${display.variable}`}>
      <Tour>
        <header className={styles.topbar}>
          <Logo />
          <nav className={styles.account} aria-label={t("accountLabel")}>
            <Link href="/login" className={styles.loginLink}>
              {t("loginShort")}
            </Link>
            {SIGNUP_CLOSED ? null : (
              <Link href="/registro" className={styles.signupLink}>
                {t("signup")}
              </Link>
            )}
          </nav>
        </header>

        <div className={styles.hero}>
          <h1 className={styles.tagline}>{t("tagline")}</h1>
          <p className={styles.description}>{t("description")}</p>
          {/* Un enlace normal (no Link): solo baja hasta la demo, en esta misma página */}
          <a href="#demo" className={`${styles.action} ${styles.primary}`}>
            {t("tryDemo")}
          </a>
          {SIGNUP_CLOSED ? <p className={styles.soon}>{t("soon")}</p> : null}
        </div>
      </Tour>

      <main className={styles.main}>
        {/* "Cómo empezar" empieza por crear la cuenta: con el registro cerrado no tiene sentido */}
        {SIGNUP_CLOSED ? null : (
          <section className={styles.section} aria-labelledby="steps-title">
            <h2 id="steps-title" className={styles.sectionTitle}>
              {t("steps.title")}
            </h2>
            <ol className={styles.steps}>
              {STEPS.map((key) => (
                <li key={key} className={styles.step}>
                  <h3 className={styles.stepTitle}>{t(`steps.${key}.title`)}</h3>
                  <p className={styles.text}>{t(`steps.${key}.text`)}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <InstallGuide />

        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title" className={styles.sectionTitle}>
            {t(SIGNUP_CLOSED ? "closingClosed.title" : "closing.title")}
          </h2>
          <div className={styles.closingBody}>
            <p className={styles.text}>{t(SIGNUP_CLOSED ? "closingClosed.text" : "closing.text")}</p>
            <div className={styles.actions}>
              {SIGNUP_CLOSED ? (
                <ShareButton className={`${styles.action} ${styles.primary}`} />
              ) : (
                <Link href="/registro" className={`${styles.action} ${styles.primary}`}>
                  {t("signup")}
                </Link>
              )}
              <Link href="/login" className={`${styles.action} ${styles.secondary}`}>
                {t("login")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <LegalLinks />
      </footer>
    </div>
  );
}
