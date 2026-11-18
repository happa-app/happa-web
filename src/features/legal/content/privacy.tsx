// Política de privacidad de HAPPA, en español y en inglés. Texto de la versión 3 de los textos legales (revisada
// el 11/11/2026; el PDF está fuera del repo, en referencias-legales-happa), más las estadísticas de visitas sin
// cookies de Vercel Web Analytics (17/11/2026).
//
// Si cambias algo importante: sube la versión en ../versions.ts y cambia aquí la versión y la fecha. Si algún día
// se vuelven a ceder datos a empresas colaboradoras, sigue las notas del PDF («Cómo ampliar los textos»): casilla
// aparte, sector y datos concretos, y subir PRIVACY_CHOICES_VERSION.
import { PRIVACY_EMAIL } from "../owner";
import { CookiesLink, type Lang, Mail, Owner, Table } from "./shared";
import type { LegalDocument } from "./types";

const AEPD = "https://www.aepd.es";

const privacyEs: LegalDocument = {
  version: "3",
  updated: "18 de noviembre de 2026",
  summaryTitle: "Información básica sobre protección de datos",
  summary: [
    <>
      <strong>Responsable:</strong> <Owner field="name" lang="es" />, titular de HAPPA · <Mail to={PRIVACY_EMAIL} />
    </>,
    <>
      <strong>Finalidades:</strong> prestarle el servicio de HAPPA, atender sus consultas, mantener la seguridad,
      conocer de forma agregada cómo se usa la web y, solo si lo acepta, enviarle novedades de HAPPA.
    </>,
    <>
      <strong>Legitimación:</strong> el contrato (los Términos y condiciones de uso), nuestro interés legítimo en la
      seguridad y la mejora del servicio, su consentimiento para las novedades y el cumplimiento de obligaciones
      legales.
    </>,
    <>
      <strong>Destinatarios:</strong> las personas de sus hogares ven lo que comparte en ellos. No vendemos ni cedemos
      sus datos. Los tratan proveedores técnicos por cuenta nuestra.
    </>,
    <>
      <strong>Dónde:</strong> servidores en la Unión Europea (Fráncfort). Algunos proveedores son estadounidenses, con
      las garantías del RGPD.
    </>,
    <>
      <strong>Derechos:</strong> acceso, rectificación, supresión, oposición, limitación, portabilidad y retirada del
      consentimiento, escribiendo a <Mail to={PRIVACY_EMAIL} />. Puede reclamar ante la AEPD.
    </>,
  ],
  sections: [
    {
      id: "responsable",
      title: "1. ¿Quién es el responsable del tratamiento de sus datos?",
      body: (
        <p>
          El responsable es <Owner field="name" lang="es" />, con NIF <Owner field="taxId" lang="es" /> y domicilio en{" "}
          <Owner field="address" lang="es" />, titular de HAPPA (la aplicación y el sitio web happa.es). Para cualquier
          cuestión sobre sus datos personales, puede escribir a <Mail to={PRIVACY_EMAIL} />.
        </p>
      ),
    },
    {
      id: "datos",
      title: "2. ¿Qué datos tratamos?",
      body: (
        <>
          <h3>2.1. Datos que usted nos facilita</h3>
          <ul>
            <li>
              <strong>Cuenta:</strong> correo electrónico y contraseña (se guarda cifrada y nadie puede leerla, tampoco
              nosotros). Si entra con Google, Google nos facilita su nombre, su correo y su foto de perfil; nunca su
              contraseña de Google.
            </li>
            <li>
              <strong>Perfil:</strong> nombre, foto (opcional), idioma y zona horaria.
            </li>
            <li>
              <strong>Edad:</strong> su declaración de que tiene 16 años o más.
            </li>
            <li>
              <strong>Hogares:</strong> nombre, tipo de hogar, número de plazas, código postal (si lo indican, nunca la
              dirección exacta), quién vive en cada hogar y con qué papel.
            </li>
            <li>
              <strong>Lo que se apunta en cada hogar:</strong> lista de la compra, gastos, gastos fijos y pagos, tareas,
              horarios y ausencias, mensajes del chat, votaciones y votos, y tiradas de la ruleta. También su lista de
              la compra personal.
            </li>
            <li>
              <strong>Consultas:</strong> los mensajes que nos envía desde Ayuda y contacto o por correo, con el tipo de
              consulta, el hogar desde el que escribe, su idioma y el modelo de dispositivo o navegador.
            </li>
          </ul>
          <p>
            Los datos de la cuenta (correo electrónico y contraseña, o su cuenta de Google), el nombre y la declaración
            de edad son necesarios para crear su cuenta y usar HAPPA: si no los facilita, no podrá registrarse. La foto
            de perfil y el código postal del hogar son opcionales.
          </p>
          <h3>2.2. Datos que se generan al usar HAPPA</h3>
          <ul>
            <li>
              <strong>Avisos:</strong> los avisos de la aplicación, sus preferencias y, si activa los avisos en el
              móvil, los datos técnicos necesarios para enviárselos (la dirección del servicio de notificaciones de su
              navegador y sus claves de cifrado).
            </li>
            <li>
              <strong>Aceptaciones y decisiones:</strong> qué versión de los términos y de esta política aceptó, si
              quiere recibir novedades, y la fecha de cada decisión.
            </li>
            <li>
              <strong>Datos técnicos:</strong> las cookies técnicas (ver la <CookiesLink>Política de cookies</CookiesLink>
              ) y los registros de los servidores (por ejemplo, la dirección IP y la hora de cada petición), que guardan
              nuestros proveedores por seguridad. Al registrarse, al iniciar sesión y en otros formularios sensibles,
              Cloudflare Turnstile analiza datos técnicos de su navegador para comprobar que no es un robot.
            </li>
            <li>
              <strong>Estadísticas de visitas:</strong> para saber cuántas personas visitan happa.es y qué pantallas se
              usan, Vercel Web Analytics recoge de cada visita la página (sin los identificadores de sus hogares), el
              país, el tipo de dispositivo, el navegador y la web de la que viene. No usa cookies ni guarda nada en su
              dispositivo, y no sirve para identificarle: en lugar de su dirección IP usa un código que cambia cada día.
            </li>
          </ul>
          <h3>2.3. Datos de otras personas</h3>
          <p>
            Si usted introduce datos personales de otras personas del hogar o de terceros en gastos, tareas, listas o
            mensajes (por ejemplo, el teléfono o la cuenta bancaria del casero), garantiza que puede compartirlos en
            ese ámbito doméstico y se compromete a usarlos solo para organizar el hogar.
          </p>
        </>
      ),
    },
    {
      id: "finalidades",
      title: "3. ¿Para qué usamos sus datos y con qué base legal?",
      body: (
        <>
          <Table
            head={["Finalidad", "Datos", "Base jurídica (RGPD)"]}
            rows={[
              [
                "Crear y gestionar su cuenta y su perfil, incluido el inicio de sesión con Google",
                "Cuenta, perfil, edad, aceptaciones",
                "Contrato (art. 6.1.b)",
              ],
              [
                "Que funcionen sus hogares: invitaciones, plazas, compra, gastos, tareas, horarios, chat, votaciones y ruleta",
                "Hogares y lo que se apunta en ellos",
                "Contrato (art. 6.1.b)",
              ],
              [
                "Enviarle los avisos de la aplicación y los correos necesarios de la cuenta (confirmar el registro, recuperar la contraseña...)",
                "Cuenta, avisos",
                "Contrato (art. 6.1.b)",
              ],
              [
                "Enviarle avisos al móvil",
                "Datos técnicos de los avisos",
                "Consentimiento (art. 6.1.a), que da al activarlos y permitirlos en su navegador. Puede retirarlo cuando quiera desde los ajustes de avisos de HAPPA o de su navegador",
              ],
              [
                "Mantener el historial del hogar (mensajes, gastos, pagos y tareas) cuando usted sale de él o borra su cuenta, para que las cuentas y el historial del resto sigan siendo correctos",
                "Lo que aportó al hogar, a nombre de «Usuario eliminado» si borra la cuenta",
                "Interés legítimo de las demás personas del hogar (art. 6.1.f)",
              ],
              [
                "Abrir la conversación «Cuentas pendientes» cuando sale de un hogar con un saldo pendiente",
                "Nombre, foto, saldos y mensajes de esa conversación",
                "Contrato (art. 6.1.b)",
              ],
              [
                "Responder a sus consultas y arreglar errores",
                "Consultas, cuenta",
                "Contrato (art. 6.1.b) e interés legítimo en mejorar HAPPA (art. 6.1.f)",
              ],
              [
                "Conocer de forma agregada cuántas visitas recibe happa.es y qué pantallas se usan, para mejorar HAPPA",
                "Estadísticas de visitas",
                "Interés legítimo en mejorar HAPPA (art. 6.1.f)",
              ],
              [
                "Proteger el servicio: evitar accesos indebidos, robots, spam y fraude",
                "Datos técnicos, cuenta",
                "Interés legítimo en la seguridad del servicio y de los usuarios (art. 6.1.f)",
              ],
              [
                "Moderar contenido ilegal o contrario a los términos",
                "El contenido afectado y la cuenta",
                "Obligación legal (art. 6.1.c, Reglamento de Servicios Digitales) e interés legítimo (art. 6.1.f)",
              ],
              [
                "Enviarle novedades de HAPPA por correo",
                "Nombre, correo, idioma",
                "Consentimiento (art. 6.1.a). Opcional; puede retirarlo en Perfil → Privacidad",
              ],
              [
                "Guardar la prueba de lo que aceptó y cumplir requerimientos de autoridades y tribunales",
                "Aceptaciones y decisiones",
                "Obligación legal (art. 6.1.c)",
              ],
            ]}
          />
          <p>
            Retirar un consentimiento no afecta a lo que se hizo mientras estaba vigente. No usamos sus datos para
            publicidad ni para elaborar perfiles comerciales.
          </p>
        </>
      ),
    },
    {
      id: "destinatarios",
      title: "4. ¿Quién puede ver sus datos?",
      body: (
        <>
          <p>
            4.1. Las personas de sus hogares ven lo que comparte en cada hogar: su nombre y foto, sus mensajes y votos,
            los gastos y pagos en que participa, sus tareas, horarios y ausencias, y lo que añade a la lista común o
            comparte desde su lista personal. Nadie fuera del hogar puede verlo, y la propia base de datos lo impide.
            Cuando una persona sale del hogar, deja de verlo.
          </p>
          <p>
            4.2. <strong>Cuentas pendientes.</strong> Si usted, u otra persona, sale de un hogar con un saldo pendiente,
            solo las personas con las que existe ese saldo comparten una conversación aparte en la que ven sus nombres,
            sus fotos, lo que queda por pagar y los mensajes de esa conversación. Se cierra cuando el saldo queda a cero.
          </p>
          <p>4.3. No vendemos ni cedemos sus datos a otras empresas.</p>
          <p>
            4.4. <strong>Proveedores que tratan datos por nuestra cuenta (encargados del tratamiento).</strong> Solo los
            usan para prestarnos su servicio, siguiendo nuestras instrucciones y con un contrato que lo garantiza:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> base de datos, cuentas de usuario y fotos. Servidores en Fráncfort (Unión
              Europea).
            </li>
            <li>
              <strong>Vercel:</strong> alojamiento del sitio web y de la aplicación, y estadísticas de visitas sin
              cookies. Las funciones del servidor se ejecutan en Fráncfort (Unión Europea).
            </li>
            <li>
              <strong>Resend:</strong> envío de los correos de la aplicación.
            </li>
            <li>
              <strong>Zoho Mail:</strong> nuestros buzones @happa.es. Servidores en la Unión Europea.
            </li>
            <li>
              <strong>Cloudflare (Turnstile):</strong> comprobación de que no es un robot.
            </li>
          </ul>
          <p>
            4.5. <strong>Otros responsables.</strong> Si entra con Google, Google trata sus datos según su propia
            política de privacidad. Los avisos al móvil los entregan los servicios de notificaciones de Google, Apple o
            Mozilla, según su navegador; el contenido de cada aviso viaja cifrado y no pueden leerlo.
          </p>
          <p>
            4.6. <strong>Autoridades.</strong> Comunicaremos datos a jueces, tribunales u otras autoridades cuando la ley
            nos obligue.
          </p>
          <p>
            4.7. <strong>Cambio de titular.</strong> Si HAPPA se transmite a otra persona o empresa, sus datos pasarían
            al nuevo titular para que pueda seguir prestándole el servicio en las mismas condiciones. Le avisaríamos
            antes y podría borrar su cuenta si no está de acuerdo.
          </p>
        </>
      ),
    },
    {
      id: "transferencias",
      title: "5. ¿Se envían sus datos fuera de la Unión Europea?",
      body: (
        <p>
          Los datos se alojan en la Unión Europea. Algunos proveedores (Supabase, Vercel, Resend y Cloudflare) son
          empresas de Estados Unidos o tienen allí parte de su servicio. Cuando sus datos se transfieren fuera del Espacio
          Económico Europeo, se hace al amparo del Marco de Privacidad de Datos UE-EE. UU. (respecto de los
          proveedores adheridos a él) o mediante las cláusulas contractuales tipo aprobadas por la Comisión Europea.
        </p>
      ),
    },
    {
      id: "conservacion",
      title: "6. ¿Cuánto tiempo conservamos sus datos?",
      body: (
        <Table
          head={["Datos", "Plazo"]}
          rows={[
            [
              "Cuenta, perfil y lo que apunta en sus hogares",
              "Mientras tenga la cuenta. Lo que comparte en un hogar se conserva mientras el hogar exista (ver «Hogares sin nadie»).",
            ],
            [
              "Al borrar la cuenta",
              <>
                Borramos al momento su correo, contraseña, foto, avisos, suscripciones de avisos al móvil y lista
                personal. Usted sale de sus hogares y su perfil pasa a llamarse «Usuario eliminado». Lo que compartió en
                los hogares (mensajes, gastos, pagos, tareas...) se mantiene seudonimizado con ese nombre mientras el
                hogar exista, porque forma parte de las cuentas y del historial del resto (interés legítimo, apartado 3).{" "}
                <strong>Importante:</strong> el texto de sus mensajes no se modifica, así que si escribió en ellos datos
                personales (un teléfono, un número de cuenta, un nombre completo...), seguirán ahí. Si nos pide en{" "}
                <Mail to={PRIVACY_EMAIL} /> que borremos mensajes concretos, antes o después de borrar la cuenta, los
                borraremos.
              </>,
            ],
            [
              "Hogares sin nadie",
              "Cuando sale de un hogar la última persona adulta, el hogar se archiva y deja de aparecer en la app. Pasados 30 días se borra por completo, con todo lo que contiene (chat, gastos, pagos, tareas, horarios, lista de la compra...). Si entre quienes vivieron en él quedan saldos pendientes, se borra cuando se salden y, como máximo, a los 5 años (el plazo para reclamar deudas entre particulares, art. 1964.2 del Código Civil).",
            ],
            [
              "Avisos al móvil pendientes de enviar",
              "Se borran si no se han podido enviar en un día. Los avisos de mensajes del chat se borran al enviarse.",
            ],
            ["Consultas a Ayuda y contacto", "Como máximo 2 años, o hasta que borre la cuenta si es antes."],
            [
              "Registro de aceptaciones y decisiones",
              "Bloqueados durante 3 años desde que se borra la cuenta, solo para atender posibles responsabilidades legales y requerimientos de la AEPD o de los tribunales (art. 32 LOPDGDD). Después se borran.",
            ],
            ["Estadísticas de visitas", "Se guardan agregadas, sin datos que le identifiquen, el tiempo que fija Vercel."],
            ["Registros técnicos de los servidores", "El tiempo limitado que fija cada proveedor por seguridad."],
          ]}
        />
      ),
    },
    {
      id: "menores",
      title: "7. Menores de edad",
      body: (
        <>
          <p>
            7.1. HAPPA solo pueden usarla personas de 16 años o más. No recogemos a sabiendas datos de menores de 16
            años. Si detectamos que una cuenta pertenece a un menor de 16, la borraremos. Si sabe de algún caso,
            escríbanos a <Mail to={PRIVACY_EMAIL} />.
          </p>
          <p>
            7.2. Los usuarios de 16 y 17 años dan su propio consentimiento cuando hace falta, como permiten el artículo 8
            del RGPD y el artículo 7 de la LOPDGDD.
          </p>
        </>
      ),
    },
    {
      id: "decisiones",
      title: "8. ¿Tomamos decisiones automatizadas o elaboramos perfiles?",
      body: (
        <p>
          No. HAPPA no toma decisiones automatizadas que le produzcan efectos jurídicos ni le afecten de forma
          significativa, ni elabora perfiles. La ruleta elige al azar, sin tener en cuenta ningún dato de las personas.
        </p>
      ),
    },
    {
      id: "derechos",
      title: "9. ¿Qué derechos tiene?",
      body: (
        <>
          <p>Puede ejercer en cualquier momento y sin coste estos derechos:</p>
          <ul>
            <li>
              <strong>Acceso:</strong> saber qué datos suyos tratamos y obtener una copia.
            </li>
            <li>
              <strong>Rectificación:</strong> corregir datos inexactos. Muchos los puede cambiar usted mismo en su
              perfil.
            </li>
            <li>
              <strong>Supresión:</strong> borrar sus datos. Puede borrar su cuenta en cualquier momento desde Perfil →
              Borrar mi cuenta, aunque tenga saldos pendientes en algún hogar. También puede pedirnos que borremos
              mensajes concretos, y los borraremos.
            </li>
            <li>
              <strong>Oposición y limitación:</strong> oponerse a un tratamiento o pedir que limitemos el uso de sus
              datos.
            </li>
            <li>
              <strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común.
            </li>
            <li>
              <strong>Retirar su consentimiento</strong> para las novedades, en Perfil → Privacidad.
            </li>
          </ul>
          <p>
            Escriba a <Mail to={PRIVACY_EMAIL} /> desde el correo de su cuenta. Le responderemos en el plazo máximo de
            un mes. Si considera que no hemos atendido correctamente su solicitud, puede presentar una reclamación ante
            la Agencia Española de Protección de Datos (<a href={AEPD}>www.aepd.es</a>) o ante la autoridad de
            protección de datos del país de la Unión Europea en el que resida.
          </p>
          <p>
            <strong>Personas fallecidas.</strong> Las personas vinculadas a un usuario fallecido por razones familiares
            o de hecho, sus herederos y quien él hubiera designado pueden pedirnos el acceso a sus datos y contenidos o
            su supresión, como prevén los artículos 3 y 96 de la LOPDGDD, salvo que el fallecido lo hubiera prohibido
            expresamente. Escriba a <Mail to={PRIVACY_EMAIL} />.
          </p>
        </>
      ),
    },
    {
      id: "seguridad",
      title: "10. ¿Cómo protegemos sus datos?",
      body: (
        <p>
          Todas las comunicaciones con HAPPA van cifradas y las contraseñas se guardan cifradas. La base de datos aplica
          reglas de acceso que impiden que una persona vea lo que no le corresponde: cada usuario solo ve lo de sus
          hogares. El acceso de administración está limitado a las personas que gestionan HAPPA. Al registrarse e
          iniciar sesión se comprueba que no es un robot.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "11. Cookies",
      body: (
        <p>
          HAPPA solo usa cookies técnicas, necesarias para que funcione, y cuenta las visitas sin cookies. Puede
          consultar el detalle en la <CookiesLink>Política de cookies</CookiesLink>.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "12. Cambios en esta política",
      body: (
        <p>
          Si modificamos esta política de forma importante, se lo comunicaremos en la aplicación o por correo antes de
          que entre en vigor. Arriba figuran la versión y la fecha de la última actualización.
        </p>
      ),
    },
  ],
};

const privacyEn: LegalDocument = {
  version: "3",
  updated: "18 November 2026",
  summaryTitle: "Basic information on data protection",
  summary: [
    <>
      <strong>Controller:</strong> <Owner field="name" lang="en" />, owner of HAPPA · <Mail to={PRIVACY_EMAIL} />
    </>,
    <>
      <strong>Purposes:</strong> providing the HAPPA service, answering your questions, keeping the service secure,
      understanding in aggregate how the website is used and, only if you agree, sending you HAPPA news.
    </>,
    <>
      <strong>Legal basis:</strong> the contract (the Terms of use), our legitimate interest in security and in
      improving the service, your consent for the news, and compliance with legal obligations.
    </>,
    <>
      <strong>Recipients:</strong> the people in your homes see what you share in them. We do not sell or share your
      data. Technical providers process it on our behalf.
    </>,
    <>
      <strong>Where:</strong> servers in the European Union (Frankfurt). Some providers are US companies, with the
      safeguards required by the GDPR.
    </>,
    <>
      <strong>Rights:</strong> access, rectification, erasure, objection, restriction, portability and withdrawal of
      consent, by writing to <Mail to={PRIVACY_EMAIL} />. You can complain to the Spanish Data Protection Agency
      (AEPD).
    </>,
  ],
  sections: [
    {
      id: "responsable",
      title: "1. Who is responsible for processing your data?",
      body: (
        <p>
          The controller is <Owner field="name" lang="en" />, tax ID <Owner field="taxId" lang="en" />, with address at{" "}
          <Owner field="address" lang="en" />, owner of HAPPA (the app and the website happa.es). For any question about
          your personal data, you can write to <Mail to={PRIVACY_EMAIL} />.
        </p>
      ),
    },
    {
      id: "datos",
      title: "2. What data do we process?",
      body: (
        <>
          <h3>2.1. Data you give us</h3>
          <ul>
            <li>
              <strong>Account:</strong> email address and password (it is stored encrypted and nobody can read it, not
              even us). If you sign in with Google, Google gives us your name, your email and your profile photo; never
              your Google password.
            </li>
            <li>
              <strong>Profile:</strong> name, photo (optional), language and time zone.
            </li>
            <li>
              <strong>Age:</strong> your statement that you are 16 or older.
            </li>
            <li>
              <strong>Homes:</strong> name, type of home, number of places, postcode (if you give it; never the exact
              address), who lives in each home and in what role.
            </li>
            <li>
              <strong>What is recorded in each home:</strong> shopping list, expenses, fixed expenses and payments,
              chores, schedules and absences, chat messages, polls and votes, and spins of the wheel. Also your personal
              shopping list.
            </li>
            <li>
              <strong>Enquiries:</strong> the messages you send us from Help and contact or by email, with the type of
              enquiry, the home you are writing from, your language and your device or browser model.
            </li>
          </ul>
          <p>
            The account data (email address and password, or your Google account), your name and your age statement
            are needed to create your account and use HAPPA: if you do not provide them, you cannot sign up. Your
            profile photo and the home’s postcode are optional.
          </p>
          <h3>2.2. Data generated when you use HAPPA</h3>
          <ul>
            <li>
              <strong>Notifications:</strong> the app’s notifications, your preferences and, if you turn on phone
              notifications, the technical data needed to send them (the address of your browser’s notification service
              and its encryption keys).
            </li>
            <li>
              <strong>Acceptances and choices:</strong> which version of the terms and of this policy you accepted,
              whether you want to receive news, and the date of each choice.
            </li>
            <li>
              <strong>Technical data:</strong> technical cookies (see the <CookiesLink>Cookie policy</CookiesLink>) and
              server logs (for example, the IP address and time of each request), which our providers keep for security.
              When you sign up, sign in and on other sensitive forms, Cloudflare Turnstile analyses technical data from
              your browser to check that you are not a robot.
            </li>
            <li>
              <strong>Visit statistics:</strong> to know how many people visit happa.es and which screens are used,
              Vercel Web Analytics collects for each visit the page (without your homes’ identifiers), the country, the
              type of device, the browser and the website you came from. It uses no cookies, stores nothing on your
              device and cannot identify you: instead of your IP address it uses a code that changes every day.
            </li>
          </ul>
          <h3>2.3. Data about other people</h3>
          <p>
            If you enter personal data of other people in the home or of third parties in expenses, chores, lists or
            messages (for example, the landlord’s phone number or bank account), you guarantee that you may share it in
            that household setting and you undertake to use it only to organise the home.
          </p>
        </>
      ),
    },
    {
      id: "finalidades",
      title: "3. What do we use your data for, and on what legal basis?",
      body: (
        <>
          <Table
            head={["Purpose", "Data", "Legal basis (GDPR)"]}
            rows={[
              [
                "Creating and managing your account and profile, including Google sign-in",
                "Account, profile, age, acceptances",
                "Contract (Art. 6(1)(b))",
              ],
              [
                "Making your homes work: invitations, places, shopping, expenses, chores, schedules, chat, polls and the wheel",
                "Homes and what is recorded in them",
                "Contract (Art. 6(1)(b))",
              ],
              [
                "Sending you the app’s notifications and the necessary account emails (confirming sign-up, resetting your password...)",
                "Account, notifications",
                "Contract (Art. 6(1)(b))",
              ],
              [
                "Sending you phone notifications",
                "Technical notification data",
                "Consent (Art. 6(1)(a)), which you give by turning them on and allowing them in your browser. You can withdraw it at any time from HAPPA’s or your browser’s notification settings",
              ],
              [
                "Keeping the home’s history (messages, expenses, payments and chores) when you leave it or delete your account, so that everyone else’s accounts and history remain correct",
                "What you contributed to the home, under the name “Deleted user” if you delete your account",
                "Legitimate interest of the other people in the home (Art. 6(1)(f))",
              ],
              [
                "Opening the “Outstanding balances” conversation when you leave a home with an outstanding balance",
                "Name, photo, balances and the messages in that conversation",
                "Contract (Art. 6(1)(b))",
              ],
              [
                "Answering your enquiries and fixing bugs",
                "Enquiries, account",
                "Contract (Art. 6(1)(b)) and legitimate interest in improving HAPPA (Art. 6(1)(f))",
              ],
              [
                "Knowing in aggregate how many visits happa.es receives and which screens are used, to improve HAPPA",
                "Visit statistics",
                "Legitimate interest in improving HAPPA (Art. 6(1)(f))",
              ],
              [
                "Protecting the service: preventing unauthorised access, robots, spam and fraud",
                "Technical data, account",
                "Legitimate interest in the security of the service and its users (Art. 6(1)(f))",
              ],
              [
                "Moderating illegal content or content contrary to the terms",
                "The content concerned and the account",
                "Legal obligation (Art. 6(1)(c), Digital Services Act) and legitimate interest (Art. 6(1)(f))",
              ],
              [
                "Sending you HAPPA news by email",
                "Name, email, language",
                "Consent (Art. 6(1)(a)). Optional; you can withdraw it in Profile → Privacy",
              ],
              [
                "Keeping proof of what you accepted and complying with requests from authorities and courts",
                "Acceptances and choices",
                "Legal obligation (Art. 6(1)(c))",
              ],
            ]}
          />
          <p>
            Withdrawing consent does not affect what was done while it was in force. We do not use your data for
            advertising or to build commercial profiles.
          </p>
        </>
      ),
    },
    {
      id: "destinatarios",
      title: "4. Who can see your data?",
      body: (
        <>
          <p>
            4.1. The people in your homes see what you share in each home: your name and photo, your messages and votes,
            the expenses and payments you take part in, your chores, schedules and absences, and what you add to the
            shared list or share from your personal list. Nobody outside the home can see it, and the database itself
            prevents it. When someone leaves the home, they stop seeing it.
          </p>
          <p>
            4.2. <strong>Outstanding balances.</strong> If you, or someone else, leave a home with an outstanding
            balance, only the people with whom that balance exists share a separate conversation in which they see
            their names, their photos, what is left to pay and the messages in that conversation. It closes when the
            balance reaches zero.
          </p>
          <p>4.3. We do not sell or share your data with other companies.</p>
          <p>
            4.4. <strong>Providers that process data on our behalf (processors).</strong> They only use it to provide
            their service to us, following our instructions and under a contract that guarantees it:
          </p>
          <ul>
            <li>
              <strong>Supabase:</strong> database, user accounts and photos. Servers in Frankfurt (European Union).
            </li>
            <li>
              <strong>Vercel:</strong> hosting of the website and the app, and cookie-free visit statistics. Server
              functions run in Frankfurt (European Union).
            </li>
            <li>
              <strong>Resend:</strong> sending the app’s emails.
            </li>
            <li>
              <strong>Zoho Mail:</strong> our @happa.es mailboxes. Servers in the European Union.
            </li>
            <li>
              <strong>Cloudflare (Turnstile):</strong> checking that you are not a robot.
            </li>
          </ul>
          <p>
            4.5. <strong>Other controllers.</strong> If you sign in with Google, Google processes your data under its own
            privacy policy. Phone notifications are delivered by the notification services of Google, Apple or Mozilla,
            depending on your browser; the content of each notification is encrypted in transit and they cannot read
            it.
          </p>
          <p>
            4.6. <strong>Authorities.</strong> We will disclose data to judges, courts or other authorities when the law
            requires us to.
          </p>
          <p>
            4.7. <strong>Change of owner.</strong> If HAPPA is transferred to another person or company, your data would
            pass to the new owner so that they can keep providing the service on the same terms. We would let you know
            beforehand and you could delete your account if you disagree.
          </p>
        </>
      ),
    },
    {
      id: "transferencias",
      title: "5. Is your data sent outside the European Union?",
      body: (
        <p>
          The data is hosted in the European Union. Some providers (Supabase, Vercel, Resend and Cloudflare) are US
          companies or run part of their service there. When your data is transferred outside the European Economic Area,
          this is done under the EU-US Data Privacy Framework (for the providers certified under it) or through the
          standard contractual clauses approved by the European Commission.
        </p>
      ),
    },
    {
      id: "conservacion",
      title: "6. How long do we keep your data?",
      body: (
        <Table
          head={["Data", "Period"]}
          rows={[
            [
              "Account, profile and what you record in your homes",
              "While you have an account. What you share in a home is kept while the home exists (see “Empty homes”).",
            ],
            [
              "When you delete your account",
              <>
                We immediately delete your email, password, photo, notifications, phone notification subscriptions and
                personal list. You leave your homes and your profile is renamed “Deleted user”. What you shared in the
                homes (messages, expenses, payments, chores...) is kept pseudonymised under that name while the home
                exists, because it is part of everyone else’s accounts and history (legitimate interest, section 3).{" "}
                <strong>Important:</strong> the text of your messages is not changed, so if you wrote personal data in
                them (a phone number, a bank account number, a full name...), it will still be there. If you ask us at{" "}
                <Mail to={PRIVACY_EMAIL} /> to delete specific messages, before or after deleting your account, we will
                delete them.
              </>,
            ],
            [
              "Empty homes",
              "When the last adult leaves a home, the home is archived and no longer appears in the app. After 30 days it is deleted completely, with everything in it (chat, expenses, payments, chores, schedules, shopping list...). If there are outstanding balances between the people who lived there, it is deleted once they are settled and, at the latest, after 5 years (the time limit for claiming debts between individuals, Art. 1964.2 of the Spanish Civil Code).",
            ],
            [
              "Phone notifications waiting to be sent",
              "Deleted if they could not be sent within a day. Chat message notifications are deleted once sent.",
            ],
            ["Help and contact enquiries", "Up to 2 years, or until you delete your account if sooner."],
            [
              "Record of acceptances and choices",
              "Blocked for 3 years after the account is deleted, only to deal with possible legal liabilities and requests from the AEPD or the courts (Art. 32 of the Spanish Data Protection Act, LOPDGDD). Then deleted.",
            ],
            ["Visit statistics", "Kept in aggregate, without data that identifies you, for the period set by Vercel."],
            ["Server logs", "The limited period set by each provider for security."],
          ]}
        />
      ),
    },
    {
      id: "menores",
      title: "7. Minors",
      body: (
        <>
          <p>
            7.1. HAPPA may only be used by people aged 16 or over. We do not knowingly collect data from children under
            16. If we find that an account belongs to someone under 16, we will delete it. If you know of such a case,
            write to us at <Mail to={PRIVACY_EMAIL} />.
          </p>
          <p>
            7.2. Users aged 16 and 17 give their own consent where it is needed, as allowed by Article 8 of the GDPR and
            Article 7 of the LOPDGDD.
          </p>
        </>
      ),
    },
    {
      id: "decisiones",
      title: "8. Do we make automated decisions or build profiles?",
      body: (
        <p>
          No. HAPPA does not make automated decisions that produce legal effects on you or significantly affect you,
          and it does not build profiles. The wheel chooses at random, without taking anyone’s data into account.
        </p>
      ),
    },
    {
      id: "derechos",
      title: "9. What are your rights?",
      body: (
        <>
          <p>You can exercise these rights at any time and free of charge:</p>
          <ul>
            <li>
              <strong>Access:</strong> find out what data of yours we process and get a copy.
            </li>
            <li>
              <strong>Rectification:</strong> correct inaccurate data. You can change much of it yourself in your
              profile.
            </li>
            <li>
              <strong>Erasure:</strong> delete your data. You can delete your account at any time from Profile → Delete
              my account, even if you have outstanding balances in a home. You can also ask us to delete specific
              messages, and we will delete them.
            </li>
            <li>
              <strong>Objection and restriction:</strong> object to a processing activity or ask us to restrict the use
              of your data.
            </li>
            <li>
              <strong>Portability:</strong> receive your data in a structured, commonly used format.
            </li>
            <li>
              <strong>Withdraw your consent</strong> to receiving news, in Profile → Privacy.
            </li>
          </ul>
          <p>
            Write to <Mail to={PRIVACY_EMAIL} /> from your account’s email address. We will reply within one month at
            most. If you think we have not handled your request properly, you can lodge a complaint with the Spanish
            Data Protection Agency (<a href={AEPD}>www.aepd.es</a>) or with the data protection authority of the EU
            country where you live.
          </p>
          <p>
            <strong>Deceased users.</strong> People linked to a deceased user by family or de facto ties, their heirs
            and anyone the user designated may ask us for access to, or deletion of, their data and content, as
            provided in Articles 3 and 96 of the LOPDGDD, unless the deceased expressly prohibited it. Write to{" "}
            <Mail to={PRIVACY_EMAIL} />.
          </p>
        </>
      ),
    },
    {
      id: "seguridad",
      title: "10. How do we protect your data?",
      body: (
        <p>
          All communications with HAPPA are encrypted and passwords are stored encrypted. The database applies access
          rules that stop anyone from seeing what is not theirs: each user only sees what belongs to their homes.
          Administrative access is limited to the people who run HAPPA. When you sign up and sign in, we check that you
          are not a robot.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "11. Cookies",
      body: (
        <p>
          HAPPA only uses technical cookies, needed for it to work, and counts visits without cookies. You can see the
          details in the <CookiesLink>Cookie policy</CookiesLink>.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "12. Changes to this policy",
      body: (
        <p>
          If we change this policy significantly, we will let you know in the app or by email before it takes effect.
          The version and date of the last update are shown at the top.
        </p>
      ),
    },
  ],
};

export const PRIVACY: Record<Lang, LegalDocument> = { es: privacyEs, en: privacyEn };
