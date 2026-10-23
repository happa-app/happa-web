// Política de privacidad de HAPPA, en español y en inglés (el documento de diseño se guarda fuera del repo).
//
// Si cambias algo importante: sube la versión en ../versions.ts y cambia aquí la versión y la fecha. Si cambia
// lo que se cede a empresas colaboradoras (datos o sectores), sube también PRIVACY_CHOICES_VERSION y el texto
// de las casillas en messages/*.json: lo aceptado antes valía para el texto de antes.
// Este texto es un borrador hecho con cuidado, pero no es asesoramiento legal: que lo revise quien lleve la
// parte legal antes del lanzamiento.
import { PRIVACY_EMAIL } from "../owner";
import { type Lang, Mail, Owner, TermsLink } from "./shared";
import type { LegalDocument } from "./types";

const AEPD = "https://www.aepd.es";

export const privacyEs: LegalDocument = {
  version: "1",
  updated: "22 de octubre de 2026",
  summary: [
    <>Usamos tus datos para darte el servicio de HAPPA. No vendemos ni cedemos tus datos sin tu permiso.</>,
    <>Lo que compartes en un hogar lo ven las personas de ese hogar, y nadie más.</>,
    <>
      Dos cosas son opcionales, cada una por separado, y solo las hacemos si las activas (al registrarte o en Perfil →
      Privacidad): enviarte novedades de HAPPA y pasar algunos datos tuyos a empresas colaboradoras para que te envíen
      ofertas para tu hogar.
    </>,
    <>Tus datos están en servidores de la Unión Europea (Fráncfort).</>,
    <>Solo usamos las cookies imprescindibles para que la app funcione: ni analítica ni publicidad.</>,
    <>
      Puedes borrar tu cuenta cuando quieras y pedirnos lo que necesites sobre tus datos en <Mail to={PRIVACY_EMAIL} />.
    </>,
  ],
  sections: [
    {
      id: "responsable",
      title: "1. Quién es el responsable de tus datos",
      body: (
        <>
          <p>
            El responsable es <Owner field="name" lang="es" />, con NIF <Owner field="taxId" lang="es" /> y domicilio en{" "}
            <Owner field="address" lang="es" />, titular de HAPPA (la app y la web happa.es).
          </p>
          <p>
            Para cualquier cosa sobre tus datos personales, escríbenos a <Mail to={PRIVACY_EMAIL} />.
          </p>
        </>
      ),
    },
    {
      id: "datos",
      title: "2. Qué datos tratamos",
      body: (
        <ul>
          <li>
            <strong>Tu cuenta:</strong> correo y contraseña (la guardamos cifrada: nadie puede leerla, ni nosotros).
          </li>
          <li>
            <strong>Tu perfil:</strong> nombre, foto (si la pones), idioma y zona horaria.
          </li>
          <li>
            <strong>Tus hogares:</strong> nombre, tipo de hogar, número de plazas, código postal (si lo indicáis; nunca la
            dirección exacta) y quién vive en cada uno y con qué papel.
          </li>
          <li>
            <strong>Lo que apuntáis en cada hogar:</strong> la lista de la compra, los gastos y los pagos, las tareas, los
            horarios y las ausencias, los mensajes del chat y los giros de la ruleta. También tu lista de la compra
            personal.
          </li>
          <li>
            <strong>Avisos:</strong> los avisos de la app, tus preferencias y, si los activas, los datos técnicos de tu
            móvil para mandarte avisos (una dirección del servicio de notificaciones y sus claves).
          </li>
          <li>
            <strong>Lo que nos escribes:</strong> los mensajes que nos mandas desde Ayuda y contacto o por correo, con el
            tipo de consulta, el hogar desde el que escribes, tu idioma y el modelo de móvil o navegador, para entenderlo
            y responderte.
          </li>
          <li>
            <strong>Tus decisiones y aceptaciones:</strong> qué versión de los términos y de esta política aceptaste, y
            qué has decidido sobre las opciones del apartado 3, con su fecha.
          </li>
          <li>
            <strong>Datos técnicos:</strong> las cookies imprescindibles (apartado 13) y los registros de los servidores
            (por ejemplo, la dirección IP y la hora de cada petición), que guardan nuestros proveedores por seguridad.
          </li>
        </ul>
      ),
    },
    {
      id: "finalidades",
      title: "3. Para qué los usamos y con qué base legal",
      body: (
        <>
          <ul>
            <li>
              <strong>Darte el servicio</strong> (tu cuenta, tus hogares y todo lo que hacéis en ellos, avisos y correos
              de la cuenta), incluido mostrarte profesionales y servicios cerca de tu hogar con su código postal. Base:
              el contrato que aceptas con los <TermsLink>términos de uso</TermsLink> (art. 6.1.b del RGPD).
            </li>
            <li>
              <strong>Atender lo que nos escribes</strong> (errores, dudas e ideas) y responderte. Base: el contrato
              (art. 6.1.b) y nuestro interés legítimo en arreglar y mejorar HAPPA (art. 6.1.f).
            </li>
            <li>
              <strong>Seguridad y prevención de abusos</strong> (detectar accesos indebidos, spam o fraude). Base:
              nuestro interés legítimo en proteger el servicio y a quienes lo usan (art. 6.1.f).
            </li>
            <li>
              <strong>Enviarte novedades y ofertas de HAPPA</strong> por correo. Base: tu consentimiento (art. 6.1.a).
              Es opcional.
            </li>
            <li>
              <strong>Comunicar tus datos a empresas colaboradoras</strong> para que te envíen sus ofertas (apartado 6).
              Base: tu consentimiento (art. 6.1.a). Es opcional y está separado de los términos: puedes usar HAPPA
              igual sin aceptarlo.
            </li>
            <li>
              <strong>Pedir un presupuesto o una reparación a un profesional</strong> del directorio de HAPPA (fontanero,
              electricista…), cuando esa función esté disponible. Si lo pides tú, le pasamos tus datos de contacto y lo
              necesario para atender tu petición. Base: ejecutar lo que nos pides o tomar medidas previas a un contrato
              a petición tuya (art. 6.1.b), tanto si aceptaste la cesión a colaboradores como si no. Es distinto de la
              cesión del punto anterior: aquí solo se pasa lo que tú pides y a quien tú eliges.
            </li>
            <li>
              <strong>Estadísticas</strong> sobre cómo se usa HAPPA, con datos anonimizados (apartado 8).
            </li>
            <li>
              <strong>Cumplir la ley</strong> y atender a autoridades y tribunales. Base: obligación legal (art. 6.1.c).
            </li>
          </ul>
          <p>
            Las novedades de HAPPA y la cesión a colaboradores se aceptan cada una por separado, con su propia casilla, y
            se pueden activar o desactivar cuando quieras en Perfil → Privacidad. Puedes aceptar una sin la otra.
            Retirar tu consentimiento no afecta a lo que ya se hizo cuando lo tenías.
          </p>
        </>
      ),
    },
    {
      id: "conservacion",
      title: "4. Cuánto tiempo los guardamos",
      body: (
        <ul>
          <li>Mientras tengas tu cuenta.</li>
          <li>
            Los mensajes que nos mandas desde Ayuda y contacto, como mucho 2 años. Si borras tu cuenta, se borran con
            ella.
          </li>
          <li>
            Al borrarla, borramos tu correo y tu contraseña, tu foto, tus avisos, tus suscripciones del móvil y tu lista
            de la compra personal, sales de tus hogares y tu perfil pasa a llamarse «Usuario eliminado». Lo que
            compartiste en tus hogares (mensajes, gastos, pagos, tareas…) se queda para las demás personas, a nombre de
            «Usuario eliminado», porque es parte de sus cuentas y su historial.
          </li>
          <li>
            Los registros de tus aceptaciones y decisiones (apartado 2) se conservan debidamente bloqueados durante 3
            años desde que borras la cuenta (art. 32 de la LOPDGDD), únicamente para atender posibles responsabilidades
            legales y requerimientos de la Agencia Española de Protección de Datos o de jueces y tribunales. Nadie puede
            verlos ni usarlos para otra cosa. Pasado ese plazo, se borran.
          </li>
          <li>
            Si una empresa colaboradora recibió tus datos con tu consentimiento, los guarda según su propia política,
            que te dará a conocer.
          </li>
        </ul>
      ),
    },
    {
      id: "proveedores",
      title: "5. Proveedores que tratan datos por nosotros",
      body: (
        <>
          <p>
            Para que HAPPA funcione usamos estos proveedores (encargados del tratamiento). Solo tratan tus datos para
            darnos su servicio, siguiendo nuestras instrucciones y con contrato:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> base de datos, cuentas y fotos. Servidores en Fráncfort (Unión Europea).
            </li>
            <li>
              <strong>Vercel:</strong> el servidor de la web y la app. Las funciones se ejecutan en Fráncfort (Unión
              Europea).
            </li>
            <li>
              <strong>Resend:</strong> envío de los correos de la app (confirmar tu cuenta, cambiar el correo…).
            </li>
            <li>
              <strong>Zoho Corporation (Zoho Mail):</strong> nuestros buzones @happa.es, como {PRIVACY_EMAIL}. Servidores
              en la Unión Europea.
            </li>
            <li>
              <strong>Cloudflare (Turnstile):</strong> comprueba que no eres un robot al registrarte, al entrar y en
              otros formularios con tu contraseña, con datos técnicos de tu navegador y tu dirección IP. No usa cookies
              de seguimiento. Base: nuestro interés legítimo en evitar abusos (apartado 3).
            </li>
            <li>
              <strong>Google, Apple y Mozilla:</strong> sus servicios de notificaciones llevan los avisos a tu móvil,
              según el que uses. El contenido de cada aviso va cifrado.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "colaboradores",
      title: "6. Empresas colaboradoras",
      body: (
        <>
          <p>
            Solo si lo aceptas (al registrarte o en Perfil → Privacidad), podemos comunicar a empresas colaboradoras
            estos datos tuyos, para que te envíen sus ofertas:
          </p>
          <ul>
            <li>tu nombre, tu correo y tu idioma;</li>
            <li>
              de cada hogar en el que vives: el tipo de hogar, cuántas personas sois y el código postal, si lo habéis
              indicado.
            </li>
          </ul>
          <p>
            <strong>Nunca</strong> comunicamos tu dirección exacta, tus mensajes, tus gastos, tus horarios, tus
            ausencias, tus tareas, tu lista de la compra, tu foto ni datos de las demás personas de tu hogar. Y nunca
            datos de menores.
          </p>
          <p>
            Solo pueden ser empresas de estos sectores: servicios para el hogar, mudanzas, mobiliario y equipamiento del
            hogar, seguros, servicios financieros o de gestión de alquiler, y suministros (luz, gas o internet).
          </p>
          <p>
            La empresa que reciba tus datos pasará a ser responsable de ellos y te informará de cómo los trata y de cómo
            ejercer tus derechos ante ella. Puedes retirar tu consentimiento cuando quieras en Perfil → Privacidad: desde
            ese momento no comunicaremos más tus datos. No afecta a lo que ya se hubiera comunicado; para eso, dirígete
            a la empresa que los recibió.
          </p>
        </>
      ),
    },
    {
      id: "venta-de-happa",
      title: "7. Si HAPPA cambia de manos",
      body: (
        <p>
          Si HAPPA se vende, se fusiona con otra empresa o pasa a otro titular, tus datos pasarían a la nueva empresa
          para que pueda seguir dándote el servicio en las mismas condiciones. Te avisaríamos antes, y podrías borrar tu
          cuenta si no estás de acuerdo.
        </p>
      ),
    },
    {
      id: "anonimizados",
      title: "8. Datos anonimizados",
      body: (
        <p>
          Podemos elaborar y compartir estadísticas que no permiten identificar a nadie (por ejemplo, el gasto medio en la
          compra por tipo de hogar). Una vez anonimizados de verdad, ya no son datos personales.
        </p>
      ),
    },
    {
      id: "transferencias",
      title: "9. Datos fuera de la Unión Europea",
      body: (
        <p>
          Algunos proveedores (apartado 5) son empresas de Estados Unidos o tienen allí parte de su servicio. Cuando tus
          datos salen de la Unión Europea, se hace con las garantías que exige el RGPD: el Marco de Privacidad de Datos
          UE-EE. UU. o las cláusulas contractuales tipo aprobadas por la Comisión Europea.
        </p>
      ),
    },
    {
      id: "menores",
      title: "10. Menores",
      body: (
        <p>
          Para tener una cuenta hay que ser mayor de edad. Los menores solo pueden usar HAPPA con una cuenta de menor que
          crea y gestiona su madre, padre o tutor legal, que da el consentimiento necesario. Nunca enviamos novedades a
          menores ni comunicamos sus datos a empresas colaboradoras.
        </p>
      ),
    },
    {
      id: "derechos",
      title: "11. Tus derechos",
      body: (
        <>
          <p>Puedes, cuando quieras y sin coste:</p>
          <ul>
            <li>acceder a tus datos y pedir una copia;</li>
            <li>corregirlos si no son correctos (muchos los cambias tú en tu perfil);</li>
            <li>borrarlos (puedes borrar tu cuenta desde Tu perfil → Borrar mi cuenta);</li>
            <li>oponerte a que los tratemos o pedir que limitemos su uso;</li>
            <li>llevártelos en un formato que se pueda leer (portabilidad);</li>
            <li>retirar tu consentimiento (en Perfil → Privacidad).</li>
          </ul>
          <p>
            Escríbenos a <Mail to={PRIVACY_EMAIL} /> desde el correo de tu cuenta. Te responderemos en un mes como mucho.
            Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia Española de Protección de
            Datos (<a href={AEPD}>aepd.es</a>).
          </p>
        </>
      ),
    },
    {
      id: "seguridad",
      title: "12. Seguridad",
      body: (
        <p>
          Toda la comunicación con HAPPA va cifrada, las contraseñas se guardan cifradas, y la propia base de datos
          impide que nadie vea lo que no le corresponde: cada persona solo ve lo de sus hogares. El acceso de
          administración está limitado a las personas que llevan HAPPA.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "13. Cookies",
      body: (
        <>
          <p>
            HAPPA solo usa cookies técnicas, imprescindibles para que funcione. No usamos cookies de analítica ni de
            publicidad, y por eso no te pedimos que las aceptes:
          </p>
          <ul>
            <li>
              <strong>sb-…</strong>: mantienen tu sesión iniciada.
            </li>
            <li>
              <strong>NEXT_LOCALE</strong>: recuerda el idioma de la página.
            </li>
            <li>
              <strong>happa_hogar</strong>: recuerda el último hogar que abriste, para que la barra de abajo te lleve a
              él.
            </li>
            <li>
              <strong>happa_recovery</strong>: solo al recuperar tu contraseña, durante 15 minutos, para comprobar que
              vienes del enlace del correo.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "cambios",
      title: "14. Cambios en esta política",
      body: (
        <p>
          Si la cambiamos, publicaremos aquí la nueva versión con su fecha. Si el cambio es importante, te avisaremos en
          la app y por correo antes de que se aplique. Si afecta a algo que aceptaste (como la cesión a colaboradores), te
          volveremos a preguntar.
        </p>
      ),
    },
  ],
};

export const privacyEn: LegalDocument = {
  version: "1",
  updated: "22 October 2026",
  summary: [
    <>We use your data to provide the HAPPA service. We never sell or share your data without your permission.</>,
    <>What you share in a household is seen by the people in that household, and nobody else.</>,
    <>
      Two things are optional, each one separately, and we only do them if you turn them on (when you sign up or in
      Profile → Privacy): sending you HAPPA news and passing some of your data to partner companies so they can send you
      offers for your home.
    </>,
    <>Your data is stored on servers in the European Union (Frankfurt).</>,
    <>We only use the cookies the app needs to work: no analytics and no advertising.</>,
    <>
      You can delete your account whenever you like and ask us anything about your data at <Mail to={PRIVACY_EMAIL} />.
    </>,
  ],
  sections: [
    {
      id: "responsable",
      title: "1. Who is responsible for your data",
      body: (
        <>
          <p>
            The data controller is <Owner field="name" lang="en" />, tax ID <Owner field="taxId" lang="en" />, with
            address at <Owner field="address" lang="en" />, owner of HAPPA (the app and the website happa.es).
          </p>
          <p>
            For anything about your personal data, write to us at <Mail to={PRIVACY_EMAIL} />.
          </p>
        </>
      ),
    },
    {
      id: "datos",
      title: "2. What data we process",
      body: (
        <ul>
          <li>
            <strong>Your account:</strong> email and password (stored encrypted: nobody can read it, not even us).
          </li>
          <li>
            <strong>Your profile:</strong> name, photo (if you add one), language and time zone.
          </li>
          <li>
            <strong>Your households:</strong> name, type of household, number of places, postal code (if you add it;
            never the exact address) and who lives in each one and in what role.
          </li>
          <li>
            <strong>What you add in each household:</strong> the shopping list, expenses and payments, chores, schedules
            and absences, chat messages and roulette spins. Also your personal shopping list.
          </li>
          <li>
            <strong>Notifications:</strong> in-app notifications, your preferences and, if you turn them on, the
            technical details of your phone needed to send you notifications (an address of the notification service and
            its keys).
          </li>
          <li>
            <strong>What you write to us:</strong> the messages you send us from Help and contact or by email, with the
            type of request, the household you write from, your language and your phone or browser model, so we can
            understand it and reply.
          </li>
          <li>
            <strong>Your choices and acceptances:</strong> which version of the terms and of this policy you accepted, and
            what you decided about the options in section 3, with their dates.
          </li>
          <li>
            <strong>Technical data:</strong> the essential cookies (section 13) and server logs (for example, the IP
            address and time of each request), kept by our providers for security.
          </li>
        </ul>
      ),
    },
    {
      id: "finalidades",
      title: "3. What we use it for and on what legal basis",
      body: (
        <>
          <ul>
            <li>
              <strong>Providing the service</strong> (your account, your households and everything you do in them,
              notifications and account emails), including showing you professionals and services near your home using
              its postal code. Basis: the contract you accept with the <TermsLink>terms of use</TermsLink> (art. 6.1.b
              GDPR).
            </li>
            <li>
              <strong>Handling what you write to us</strong> (bugs, questions and ideas) and replying. Basis: the
              contract (art. 6.1.b) and our legitimate interest in fixing and improving HAPPA (art. 6.1.f).
            </li>
            <li>
              <strong>Security and abuse prevention</strong> (detecting unauthorised access, spam or fraud). Basis: our
              legitimate interest in protecting the service and the people who use it (art. 6.1.f).
            </li>
            <li>
              <strong>Sending you HAPPA news and offers</strong> by email. Basis: your consent (art. 6.1.a). It is
              optional.
            </li>
            <li>
              <strong>Sharing your data with partner companies</strong> so they can send you their offers (section 6).
              Basis: your consent (art. 6.1.a). It is optional and separate from the terms: you can use HAPPA just the
              same without accepting it.
            </li>
            <li>
              <strong>Requesting a quote or a repair from a professional</strong> in the HAPPA directory (plumber,
              electrician…), once that feature is available. If you request it, we pass your contact details and what is
              needed to handle your request to that professional. Basis: carrying out what you ask us or taking
              pre-contractual steps at your request (art. 6.1.b), whether or not you accepted sharing with partners. This
              is different from the previous point: only what you ask for is shared, and only with whoever you choose.
            </li>
            <li>
              <strong>Statistics</strong> on how HAPPA is used, with anonymised data (section 8).
            </li>
            <li>
              <strong>Complying with the law</strong> and responding to authorities and courts. Basis: legal obligation
              (art. 6.1.c).
            </li>
          </ul>
          <p>
            HAPPA news and sharing with partners are accepted separately, each with its own box, and can be turned on or
            off at any time in Profile → Privacy. You can accept one without the other. Withdrawing your consent does not
            affect what was already done while you had given it.
          </p>
        </>
      ),
    },
    {
      id: "conservacion",
      title: "4. How long we keep it",
      body: (
        <ul>
          <li>For as long as you have your account.</li>
          <li>
            The messages you send us from Help and contact, for 2 years at most. If you delete your account, they are
            deleted with it.
          </li>
          <li>
            When you delete it, we delete your email and password, your photo, your notifications, your phone
            subscriptions and your personal shopping list, you leave your households and your profile is renamed
            “Usuario eliminado” (deleted user). What you shared in your households (messages, expenses, payments,
            chores…) stays for the other people, under that name, because it is part of their accounts and their
            history.
          </li>
          <li>
            The records of your acceptances and choices (section 2) are kept duly blocked for 3 years after you delete
            your account (art. 32 of the Spanish data protection act, LOPDGDD), only to deal with possible legal
            liabilities and requests from the Spanish Data Protection Agency or the courts. Nobody can see them or use
            them for anything else. After that, they are deleted.
          </li>
          <li>
            If a partner company received your data with your consent, it keeps it according to its own policy, which it
            will tell you about.
          </li>
        </ul>
      ),
    },
    {
      id: "proveedores",
      title: "5. Providers that process data on our behalf",
      body: (
        <>
          <p>
            To run HAPPA we use these providers (data processors). They only process your data to provide their service
            to us, following our instructions and under contract:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> database, accounts and photos. Servers in Frankfurt (European Union).
            </li>
            <li>
              <strong>Vercel:</strong> the server for the website and the app. Its functions run in Frankfurt (European
              Union).
            </li>
            <li>
              <strong>Resend:</strong> sending the app’s emails (confirming your account, changing your email…).
            </li>
            <li>
              <strong>Zoho Corporation (Zoho Mail):</strong> our @happa.es mailboxes, such as {PRIVACY_EMAIL}. Servers in
              the European Union.
            </li>
            <li>
              <strong>Cloudflare (Turnstile):</strong> checks that you are not a robot when you sign up, sign in and in
              other forms with your password, using technical data from your browser and your IP address. It does not
              use tracking cookies. Basis: our legitimate interest in preventing abuse (section 3).
            </li>
            <li>
              <strong>Google, Apple and Mozilla:</strong> their notification services deliver notifications to your phone,
              depending on which one you use. The content of each notification is encrypted.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "colaboradores",
      title: "6. Partner companies",
      body: (
        <>
          <p>
            Only if you accept it (when you sign up or in Profile → Privacy), we may share this data with partner
            companies so they can send you their offers:
          </p>
          <ul>
            <li>your name, your email and your language;</li>
            <li>
              for each household you live in: the type of household, how many people you are and its postal code, if you
              added it.
            </li>
          </ul>
          <p>
            We <strong>never</strong> share your exact address, your messages, your expenses, your schedules, your
            absences, your chores, your shopping list, your photo or data about the other people in your household. And
            never data about minors.
          </p>
          <p>
            They can only be companies in these sectors: home services, removals, furniture and home equipment,
            insurance, financial or rental management services, and utilities (electricity, gas or internet).
          </p>
          <p>
            The company that receives your data becomes responsible for it and will tell you how it processes it and how
            to exercise your rights with it. You can withdraw your consent at any time in Profile → Privacy: from then on
            we will not share your data any more. This does not affect data already shared; for that, contact the
            company that received it.
          </p>
        </>
      ),
    },
    {
      id: "venta-de-happa",
      title: "7. If HAPPA changes hands",
      body: (
        <p>
          If HAPPA is sold, merges with another company or passes to another owner, your data would pass to the new
          company so that it can keep providing the service on the same terms. We would let you know beforehand, and you
          could delete your account if you do not agree.
        </p>
      ),
    },
    {
      id: "anonimizados",
      title: "8. Anonymised data",
      body: (
        <p>
          We may produce and share statistics that do not identify anyone (for example, the average grocery spend by
          type of household). Once truly anonymised, they are no longer personal data.
        </p>
      ),
    },
    {
      id: "transferencias",
      title: "9. Data outside the European Union",
      body: (
        <p>
          Some providers (section 5) are US companies or run part of their service there. When your data leaves the
          European Union, this is done with the safeguards required by the GDPR: the EU-US Data Privacy Framework or the
          standard contractual clauses approved by the European Commission.
        </p>
      ),
    },
    {
      id: "menores",
      title: "10. Minors",
      body: (
        <p>
          You must be an adult to have an account. Minors can only use HAPPA with a minor account created and managed by
          their mother, father or legal guardian, who gives the necessary consent. We never send news to minors or share
          their data with partner companies.
        </p>
      ),
    },
    {
      id: "derechos",
      title: "11. Your rights",
      body: (
        <>
          <p>Whenever you like and free of charge, you can:</p>
          <ul>
            <li>access your data and ask for a copy;</li>
            <li>correct it if it is wrong (you can change much of it yourself in your profile);</li>
            <li>delete it (you can delete your account in Your profile → Delete my account);</li>
            <li>object to us processing it or ask us to restrict its use;</li>
            <li>take it with you in a readable format (portability);</li>
            <li>withdraw your consent (in Profile → Privacy).</li>
          </ul>
          <p>
            Write to us at <Mail to={PRIVACY_EMAIL} /> from your account’s email. We will reply within one month at most.
            If you think we have not handled your request properly, you can complain to the Spanish Data Protection
            Agency (<a href={AEPD}>aepd.es</a>).
          </p>
        </>
      ),
    },
    {
      id: "seguridad",
      title: "12. Security",
      body: (
        <p>
          All communication with HAPPA is encrypted, passwords are stored encrypted, and the database itself prevents
          anyone from seeing what is not theirs: each person only sees what belongs to their households. Administrative
          access is limited to the people who run HAPPA.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "13. Cookies",
      body: (
        <>
          <p>
            HAPPA only uses technical cookies that it needs to work. We do not use analytics or advertising cookies, so we
            do not ask you to accept them:
          </p>
          <ul>
            <li>
              <strong>sb-…</strong>: keep you signed in.
            </li>
            <li>
              <strong>NEXT_LOCALE</strong>: remembers the language of the page.
            </li>
            <li>
              <strong>happa_hogar</strong>: remembers the last household you opened, so the bottom bar takes you there.
            </li>
            <li>
              <strong>happa_recovery</strong>: only when you reset your password, for 15 minutes, to check that you come
              from the email link.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "cambios",
      title: "14. Changes to this policy",
      body: (
        <p>
          If we change it, we will publish the new version here with its date. If the change is important, we will let
          you know in the app and by email before it applies. If it affects something you accepted (such as sharing with
          partners), we will ask you again.
        </p>
      ),
    },
  ],
};

export const PRIVACY: Record<Lang, LegalDocument> = { es: privacyEs, en: privacyEn };
