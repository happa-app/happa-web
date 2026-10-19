// Cómo se ve un documento legal: título, versión, resumen, índice y apartados. Recibe los textos ya
// traducidos (LegalPage los lee en el servidor).
import type { LegalDocument } from "../content/types";
import styles from "./LegalPage.module.css";

type Props = {
  title: string;
  doc: LegalDocument;
  labels: { meta: string; summaryTitle: string; summaryNote: string; contents: string };
};

export function LegalDocumentView({ title, doc, labels }: Props) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>{labels.meta}</p>
      </header>

      <section className={styles.summary} aria-labelledby="legal-summary">
        <h2 id="legal-summary" className={styles.summaryTitle}>
          {labels.summaryTitle}
        </h2>
        <ul>
          {doc.summary.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p className={styles.summaryNote}>{labels.summaryNote}</p>
      </section>

      <nav className={styles.toc} aria-labelledby="legal-toc">
        <h2 id="legal-toc" className={styles.tocTitle}>
          {labels.contents}
        </h2>
        <ol>
          {doc.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title.replace(/^\d+\.\s*/, "")}</a>
            </li>
          ))}
        </ol>
      </nav>

      {doc.sections.map((s) => (
        <section key={s.id} id={s.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>{s.title}</h2>
          {s.body}
        </section>
      ))}
    </article>
  );
}
