// Política de cookies de HAPPA, en español y en inglés. Texto de la versión 3 de los textos legales (revisada el
// 11/11/2026; el PDF está fuera del repo, en referencias-legales-happa), más las estadísticas de visitas sin
// cookies de Vercel Web Analytics (17/11/2026).
//
// Si añades o quitas una cookie (o algo en el almacenamiento del navegador), cámbialo aquí y sube la fecha. Si
// algún día hay cookies que no son técnicas (analítica con cookies, publicidad), hace falta un banner con
// «aceptar» y «rechazar» igual de visibles, y no cargar nada antes de que la persona decida.
import { type Lang, PrivacyLink, Table } from "./shared";
import type { LegalDocument } from "./types";

const cookiesEs: LegalDocument = {
  version: "1",
  updated: "18 de noviembre de 2026",
  summaryTitle: "Lo esencial",
  summary: [
    <>HAPPA solo usa cookies técnicas, imprescindibles para que funcione.</>,
    <>
      No usamos cookies de analítica, de publicidad ni de seguimiento. Contamos las visitas con una herramienta que no
      usa cookies. Por eso no le pedimos que acepte cookies.
    </>,
  ],
  sections: [
    {
      id: "que-son",
      title: "1. ¿Qué son las cookies?",
      body: (
        <p>
          Las cookies son pequeños archivos que un sitio web guarda en su navegador para recordar información entre una
          visita y otra; por ejemplo, que ya ha iniciado sesión. Hay otras tecnologías parecidas, como el almacenamiento
          local del navegador, a las que esta política también se aplica.
        </p>
      ),
    },
    {
      id: "cuales",
      title: "2. ¿Qué cookies usa HAPPA?",
      body: (
        <>
          <Table
            head={["Nombre", "Para qué sirve", "Titular", "Duración"]}
            rows={[
              [
                "sb-…",
                "Mantener la sesión iniciada y completar el inicio de sesión con Google.",
                "HAPPA",
                "Hasta 400 días o hasta que cierre la sesión.",
              ],
              [
                "NEXT_LOCALE",
                "Recordar el idioma de la página (español o inglés).",
                "HAPPA",
                "Hasta que cierre el navegador.",
              ],
              [
                "happa_hogar",
                "Recordar el último hogar que abrió, para que la barra inferior le lleve a él.",
                "HAPPA",
                "1 año.",
              ],
              [
                "happa_recovery",
                "Comprobar que viene del enlace del correo cuando recupera su contraseña.",
                "HAPPA",
                "15 minutos.",
              ],
            ]}
          />
          <p>
            Todas son cookies técnicas propias. No se usan para identificarle con fines comerciales ni se comparten con
            terceros.
          </p>
        </>
      ),
    },
    {
      id: "otras",
      title: "3. Otras tecnologías de almacenamiento",
      body: (
        <ul>
          <li>
            <strong>happa-tema</strong> (almacenamiento local del navegador): recuerda si eligió el tema claro u oscuro.
            Se queda en su dispositivo y no se envía a nuestros servidores.
          </li>
          <li>
            <strong>Caché de la aplicación (service worker):</strong> guarda una página para mostrarla cuando no tiene
            conexión y permite instalar HAPPA en el móvil. No contiene datos personales.
          </li>
        </ul>
      ),
    },
    {
      id: "consentimiento",
      title: "4. ¿Por qué no le pedimos que acepte las cookies?",
      body: (
        <p>
          El artículo 22.2 de la LSSI exige el consentimiento para usar cookies, salvo para las que son estrictamente
          necesarias para prestar un servicio que el usuario ha solicitado. Todas las cookies de HAPPA son de este tipo.
          Las estadísticas de visitas (apartado 5) no usan cookies ni guardan nada en su dispositivo. Si en el futuro
          usamos otras cookies (por ejemplo, de analítica), le pediremos antes su consentimiento y actualizaremos esta
          política.
        </p>
      ),
    },
    {
      id: "terceros",
      title: "5. Servicios de terceros",
      body: (
        <ul>
          <li>
            <strong>Vercel Web Analytics</strong> cuenta las visitas y las pantallas que se usan, de forma agregada. No
            usa cookies ni guarda nada en su navegador, y no le identifica: en lugar de su dirección IP usa un código
            que cambia cada día. Más detalles en la <PrivacyLink>Política de privacidad</PrivacyLink>.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong>, que comprueba que no es un robot en los formularios de acceso,
            analiza datos técnicos del navegador. No usa cookies de seguimiento ni publicidad.
          </li>
          <li>
            Si inicia sesión con <strong>Google</strong>, pasará por una página de Google, que usa sus propias cookies
            según su política de cookies.
          </li>
        </ul>
      ),
    },
    {
      id: "borrar",
      title: "6. ¿Cómo puede borrar o bloquear las cookies?",
      body: (
        <p>
          Puede borrar o bloquear las cookies desde la configuración de su navegador (Chrome, Firefox, Safari, Edge…),
          normalmente en el apartado de privacidad o de datos de sitios web. Si bloquea las cookies de HAPPA, no podrá
          iniciar sesión ni usar la aplicación.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "7. Cambios en esta política",
      body: (
        <p>
          Si cambiamos las cookies que usamos, actualizaremos esta política y su fecha. Si se trata de cookies que
          requieren consentimiento, se lo pediremos antes de usarlas.
        </p>
      ),
    },
  ],
};

const cookiesEn: LegalDocument = {
  version: "1",
  updated: "18 November 2026",
  summaryTitle: "Key points",
  summary: [
    <>HAPPA only uses technical cookies, which are essential for it to work.</>,
    <>
      We do not use analytics, advertising or tracking cookies. We count visits with a tool that uses no cookies. That
      is why we do not ask you to accept cookies.
    </>,
  ],
  sections: [
    {
      id: "que-son",
      title: "1. What are cookies?",
      body: (
        <p>
          Cookies are small files that a website stores in your browser to remember information between visits; for
          example, that you are already signed in. There are other similar technologies, such as the browser’s local
          storage, which this policy also covers.
        </p>
      ),
    },
    {
      id: "cuales",
      title: "2. Which cookies does HAPPA use?",
      body: (
        <>
          <Table
            head={["Name", "What it is for", "Owner", "Duration"]}
            rows={[
              [
                "sb-…",
                "Keeping you signed in and completing Google sign-in.",
                "HAPPA",
                "Up to 400 days or until you sign out.",
              ],
              ["NEXT_LOCALE", "Remembering the page language (Spanish or English).", "HAPPA", "Until you close the browser."],
              [
                "happa_hogar",
                "Remembering the last home you opened, so the bottom bar takes you there.",
                "HAPPA",
                "1 year.",
              ],
              [
                "happa_recovery",
                "Checking that you came from the email link when you reset your password.",
                "HAPPA",
                "15 minutes.",
              ],
            ]}
          />
          <p>
            They are all first-party technical cookies. They are not used to identify you for commercial purposes and
            are not shared with third parties.
          </p>
        </>
      ),
    },
    {
      id: "otras",
      title: "3. Other storage technologies",
      body: (
        <ul>
          <li>
            <strong>happa-tema</strong> (browser local storage): remembers whether you chose the light or dark theme. It
            stays on your device and is not sent to our servers.
          </li>
          <li>
            <strong>App cache (service worker):</strong> stores a page to show when you are offline and lets you install
            HAPPA on your phone. It contains no personal data.
          </li>
        </ul>
      ),
    },
    {
      id: "consentimiento",
      title: "4. Why don’t we ask you to accept cookies?",
      body: (
        <p>
          Article 22.2 of the Spanish LSSI requires consent to use cookies, except for those strictly necessary to
          provide a service the user has requested. All of HAPPA’s cookies are of this kind. Visit statistics (section
          5) use no cookies and store nothing on your device. If in the future we use other cookies (for example,
          analytics cookies), we will ask for your consent first and update this policy.
        </p>
      ),
    },
    {
      id: "terceros",
      title: "5. Third-party services",
      body: (
        <ul>
          <li>
            <strong>Vercel Web Analytics</strong> counts visits and the screens that are used, in aggregate. It uses no
            cookies, stores nothing in your browser and does not identify you: instead of your IP address it uses a
            code that changes every day. More details in the <PrivacyLink>Privacy policy</PrivacyLink>.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong>, which checks that you are not a robot on the sign-in forms, analyses
            technical data from your browser. It uses no tracking or advertising cookies.
          </li>
          <li>
            If you sign in with <strong>Google</strong>, you will go through a Google page, which uses its own cookies
            under its cookie policy.
          </li>
        </ul>
      ),
    },
    {
      id: "borrar",
      title: "6. How can you delete or block cookies?",
      body: (
        <p>
          You can delete or block cookies in your browser settings (Chrome, Firefox, Safari, Edge…), usually under
          privacy or site data. If you block HAPPA’s cookies, you will not be able to sign in or use the app.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "7. Changes to this policy",
      body: (
        <p>
          If we change the cookies we use, we will update this policy and its date. If they are cookies that require
          consent, we will ask you before using them.
        </p>
      ),
    },
  ],
};

export const COOKIES: Record<Lang, LegalDocument> = { es: cookiesEs, en: cookiesEn };
