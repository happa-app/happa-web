// Aviso legal de HAPPA (LSSI, art. 10), en español y en inglés. Texto de la versión 3 de los textos legales
// (revisada el 11/11/2026; el PDF está fuera del repo, en referencias-legales-happa).
//
// No lleva versión aceptada por el usuario (no hay casilla), pero sí fecha: cámbiala si cambias el texto.
// Los datos del titular salen de las variables de entorno (../owner.ts).
import { CONTACT_EMAIL, PRIVACY_EMAIL } from "../owner";
import { CookiesLink, type Lang, Mail, Owner, PrivacyLink, TermsLink } from "./shared";
import type { LegalDocument } from "./types";

const noticeEs: LegalDocument = {
  version: "1",
  updated: "18 de noviembre de 2026",
  summaryTitle: "",
  summary: [],
  sections: [
    {
      id: "titular",
      title: "1. Titular del sitio web",
      body: (
        <>
          <p>
            En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de
            comercio electrónico (LSSI), le informamos de que el sitio web happa.es y la aplicación HAPPA son
            titularidad de:
          </p>
          <ul>
            <li>
              <strong>Titular:</strong> <Owner field="name" lang="es" />
            </li>
            <li>
              <strong>NIF:</strong> <Owner field="taxId" lang="es" />
            </li>
            <li>
              <strong>Domicilio a efectos de notificaciones:</strong> <Owner field="address" lang="es" />
            </li>
            <li>
              <strong>Correo electrónico:</strong> <Mail to={CONTACT_EMAIL} />
            </li>
            <li>
              <strong>Protección de datos:</strong> <Mail to={PRIVACY_EMAIL} />
            </li>
            <li>
              <strong>Actividad:</strong> prestación del servicio HAPPA, una aplicación web para organizar la
              convivencia en hogares compartidos.
            </li>
          </ul>
          <p>
            En estos textos, «HAPPA» o «nosotros» se refiere al titular, y «usted» o «el usuario», a la persona que
            visita el sitio web o usa la aplicación.
          </p>
        </>
      ),
    },
    {
      id: "objeto",
      title: "2. Objeto",
      body: (
        <p>
          Este aviso legal regula el acceso y la navegación por happa.es. El uso de la aplicación con una cuenta se
          rige además por los <TermsLink>Términos y condiciones de uso</TermsLink>, y el tratamiento de los datos
          personales, por la <PrivacyLink>Política de privacidad</PrivacyLink> y la{" "}
          <CookiesLink>Política de cookies</CookiesLink>.
        </p>
      ),
    },
    {
      id: "acceso",
      title: "3. Condiciones de acceso",
      body: (
        <>
          <p>
            El acceso a las páginas públicas de happa.es (la portada, la demostración, las páginas de ayuda y las
            páginas legales) es libre y gratuito. Para usar la aplicación es necesario registrarse.
          </p>
          <p>
            El usuario se compromete a usar el sitio web de forma lícita, de buena fe y conforme a este aviso legal. En
            particular, no debe:
          </p>
          <ul>
            <li>dañar, inutilizar o sobrecargar el sitio web, ni impedir que otras personas lo usen;</li>
            <li>
              introducir virus o cualquier otro código dañino, ni intentar acceder a zonas o datos a los que no tenga
              acceso;
            </li>
            <li>usar robots u otros medios automáticos para extraer el contenido del sitio web.</li>
          </ul>
        </>
      ),
    },
    {
      id: "propiedad",
      title: "4. Propiedad intelectual e industrial",
      body: (
        <>
          <p>
            El nombre y el logotipo de HAPPA, el diseño del sitio web y de la aplicación, sus textos, imágenes y código
            fuente pertenecen al titular o a terceros que le han autorizado a usarlos. Se pueden consultar y usar para
            fines personales, pero no se pueden reproducir, distribuir, transformar ni comunicar públicamente sin
            autorización, salvo en los casos que permite la ley.
          </p>
          <p>
            El contenido que suben los usuarios a la aplicación es de cada usuario, como explican los{" "}
            <TermsLink>Términos y condiciones de uso</TermsLink>.
          </p>
        </>
      ),
    },
    {
      id: "enlaces",
      title: "5. Enlaces a otros sitios web",
      body: (
        <p>
          El sitio web puede incluir enlaces a páginas de terceros, por ejemplo, a la Agencia Española de Protección de
          Datos o al inicio de sesión de Google. No controlamos esas páginas y no respondemos de su contenido, salvo que
          tengamos conocimiento efectivo de que es ilícito y no retiremos el enlace con diligencia (art. 17 LSSI).
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "6. Responsabilidad",
      body: (
        <p>
          Ponemos los medios razonables para que el sitio web funcione correctamente y su información sea exacta, pero
          no podemos garantizar que esté libre de interrupciones o errores. Nada de lo dispuesto en este aviso legal
          limita los derechos que la ley reconoce a los consumidores.
        </p>
      ),
    },
    {
      id: "datos",
      title: "7. Protección de datos y cookies",
      body: (
        <p>
          El tratamiento de los datos personales se explica en la <PrivacyLink>Política de privacidad</PrivacyLink>, y
          el uso de cookies, en la <CookiesLink>Política de cookies</CookiesLink>.
        </p>
      ),
    },
    {
      id: "ley",
      title: "8. Ley aplicable y jurisdicción",
      body: (
        <p>
          Este aviso legal se rige por la ley española. Si usted es consumidor, podrá acudir a los juzgados y tribunales
          de su domicilio y conservará la protección que le den las normas imperativas del país de la Unión Europea en
          el que resida.
        </p>
      ),
    },
  ],
};

const noticeEn: LegalDocument = {
  version: "1",
  updated: "18 November 2026",
  summaryTitle: "",
  summary: [],
  sections: [
    {
      id: "titular",
      title: "1. Website owner",
      body: (
        <>
          <p>
            In accordance with Article 10 of Spanish Law 34/2002 on information society services and electronic
            commerce (LSSI), we inform you that the website happa.es and the HAPPA app are owned by:
          </p>
          <ul>
            <li>
              <strong>Owner:</strong> <Owner field="name" lang="en" />
            </li>
            <li>
              <strong>Tax ID (NIF):</strong> <Owner field="taxId" lang="en" />
            </li>
            <li>
              <strong>Address for notices:</strong> <Owner field="address" lang="en" />
            </li>
            <li>
              <strong>Email:</strong> <Mail to={CONTACT_EMAIL} />
            </li>
            <li>
              <strong>Data protection:</strong> <Mail to={PRIVACY_EMAIL} />
            </li>
            <li>
              <strong>Activity:</strong> providing the HAPPA service, a web app for organising life in shared homes.
            </li>
          </ul>
          <p>
            In these texts, “HAPPA”, “we” or “us” means the owner, and “you” or “the user” means the person who visits
            the website or uses the app.
          </p>
        </>
      ),
    },
    {
      id: "objeto",
      title: "2. Purpose",
      body: (
        <p>
          This legal notice governs access to and browsing of happa.es. Use of the app with an account is also governed
          by the <TermsLink>Terms of use</TermsLink>, and the processing of personal data by the{" "}
          <PrivacyLink>Privacy policy</PrivacyLink> and the <CookiesLink>Cookie policy</CookiesLink>.
        </p>
      ),
    },
    {
      id: "acceso",
      title: "3. Conditions of access",
      body: (
        <>
          <p>
            Access to the public pages of happa.es (the home page, the demo, the help pages and the legal pages) is open
            and free of charge. To use the app you need to sign up.
          </p>
          <p>
            You agree to use the website lawfully, in good faith and in accordance with this legal notice. In
            particular, you must not:
          </p>
          <ul>
            <li>damage, disable or overload the website, or prevent other people from using it;</li>
            <li>
              introduce viruses or any other harmful code, or try to access areas or data you are not allowed to
              access;
            </li>
            <li>use robots or other automated means to extract content from the website.</li>
          </ul>
        </>
      ),
    },
    {
      id: "propiedad",
      title: "4. Intellectual and industrial property",
      body: (
        <>
          <p>
            The HAPPA name and logo, the design of the website and the app, and their texts, images and source code
            belong to the owner or to third parties who have authorised their use. You may view and use them for
            personal purposes, but you may not reproduce, distribute, transform or publicly communicate them without
            permission, except where the law allows it.
          </p>
          <p>
            The content users upload to the app belongs to each user, as explained in the{" "}
            <TermsLink>Terms of use</TermsLink>.
          </p>
        </>
      ),
    },
    {
      id: "enlaces",
      title: "5. Links to other websites",
      body: (
        <p>
          The website may include links to third-party pages, for example to the Spanish Data Protection Agency or to
          Google sign-in. We do not control those pages and are not responsible for their content, unless we have
          actual knowledge that it is unlawful and fail to remove the link promptly (Art. 17 LSSI).
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "6. Liability",
      body: (
        <p>
          We take reasonable steps to make sure the website works properly and its information is accurate, but we
          cannot guarantee that it will be free from interruptions or errors. Nothing in this legal notice limits the
          rights the law gives consumers.
        </p>
      ),
    },
    {
      id: "datos",
      title: "7. Data protection and cookies",
      body: (
        <p>
          How we process personal data is explained in the <PrivacyLink>Privacy policy</PrivacyLink>, and how we use
          cookies in the <CookiesLink>Cookie policy</CookiesLink>.
        </p>
      ),
    },
    {
      id: "ley",
      title: "8. Governing law and jurisdiction",
      body: (
        <p>
          This legal notice is governed by Spanish law. If you are a consumer, you may go to the courts of your place of
          residence and you keep the protection given to you by the mandatory rules of the EU country where you live.
        </p>
      ),
    },
  ],
};

export const NOTICE: Record<Lang, LegalDocument> = { es: noticeEs, en: noticeEn };
