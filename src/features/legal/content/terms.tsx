// Términos de uso de HAPPA, en español y en inglés.
//
// Si cambias algo importante: sube la versión en ../versions.ts (así se sabe qué aceptó cada persona),
// cambia aquí la versión y la fecha, y avisad a los usuarios (apartado 15).
// Este texto es un borrador hecho con cuidado, pero no es asesoramiento legal: que lo revise quien lleve
// la parte legal antes del lanzamiento.
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL, LEGAL_OWNER, PRIVACY_EMAIL } from "../owner";
import type { LegalDocument } from "./types";
import styles from "../components/LegalPage.module.css";

type Lang = "es" | "en";

const PENDING: Record<keyof typeof LEGAL_OWNER, Record<Lang, string>> = {
  name: { es: "nombre o razón social", en: "name or company name" },
  taxId: { es: "NIF", en: "tax ID" },
  address: { es: "domicilio", en: "address" },
  registry: { es: "datos registrales", en: "registry details" },
};

// Un dato del titular, o "[pendiente: …]" si aún no está rellenado
function Owner({ field, lang }: { field: keyof typeof LEGAL_OWNER; lang: Lang }) {
  const value = LEGAL_OWNER[field];
  if (value) return <>{value}</>;
  return <mark className={styles.pending}>[{lang === "es" ? "pendiente" : "pending"}: {PENDING[field][lang]}]</mark>;
}

function Mail({ to }: { to: string }) {
  return <a href={`mailto:${to}`}>{to}</a>;
}

function Privacy({ children }: { children: ReactNode }) {
  return <Link href="/legal/privacidad">{children}</Link>;
}

export const termsEs: LegalDocument = {
  version: "1",
  updated: "8 de octubre de 2026",
  summary: [
    <>HAPPA es gratis y sirve para organizar la convivencia: la compra, los gastos, las tareas, los horarios, el chat y la ruleta.</>,
    <>Para tener cuenta hay que ser mayor de edad. Los menores solo pueden usar HAPPA con una cuenta que gestione su madre, padre o tutor.</>,
    <>Lo que compartes en un hogar lo ven las personas de ese hogar. Tu contenido es tuyo.</>,
    <>HAPPA no mueve dinero: Gastos solo apunta lo que pagáis y calcula cómo quedan las cuentas.</>,
    <>Nada de contenido ilegal, acoso ni engaños. Si ves algo así, avísanos en <Mail to={CONTACT_EMAIL} />.</>,
    <>Puedes borrar tu cuenta cuando quieras.</>,
  ],
  sections: [
    {
      id: "quienes-somos",
      title: "1. Quién está detrás de HAPPA",
      body: (
        <>
          <p>
            HAPPA (la app y la web happa.es) es un servicio de <Owner field="name" lang="es" />, con NIF{" "}
            <Owner field="taxId" lang="es" /> y domicilio en <Owner field="address" lang="es" />
            {LEGAL_OWNER.registry ? <>, inscrito en {LEGAL_OWNER.registry}</> : null}.
          </p>
          <p>
            Puedes escribirnos a <Mail to={CONTACT_EMAIL} />, que es también nuestro punto de contacto único para
            usuarios y autoridades (en español o en inglés). Para todo lo relacionado con tus datos personales:{" "}
            <Mail to={PRIVACY_EMAIL} />.
          </p>
          <p>En estos términos, «HAPPA» o «nosotros» se refiere al titular del servicio, y «tú», a la persona que lo usa.</p>
        </>
      ),
    },
    {
      id: "que-es",
      title: "2. Qué es HAPPA",
      body: (
        <>
          <p>
            HAPPA es una aplicación para organizar la vida en un hogar compartido: un piso de estudiantes, una pareja o
            una familia. Permite, entre otras cosas, crear hogares e invitar a otras personas, llevar una lista de la
            compra común y otra personal, apuntar y repartir gastos, organizar tareas y horarios, hablar en el chat del
            hogar, girar la ruleta para decidir a quién le toca algo y recibir avisos.
          </p>
          <p>
            Ahora mismo HAPPA es gratis. Si en el futuro añadimos funciones de pago o servicios para profesionales,
            tendrán sus propias condiciones, que verás y aceptarás aparte antes de contratar nada.
          </p>
        </>
      ),
    },
    {
      id: "aceptacion",
      title: "3. Aceptación",
      body: (
        <p>
          Al crear tu cuenta aceptas estos términos y la <Privacy>política de privacidad</Privacy>. Guardamos qué
          versión aceptaste y cuándo. Si no estás de acuerdo, no uses HAPPA.
        </p>
      ),
    },
    {
      id: "cuenta",
      title: "4. Tu cuenta",
      body: (
        <>
          <ul>
            <li>Tienes que tener 18 años o más para crear una cuenta.</li>
            <li>Los datos que nos des (como tu correo) tienen que ser ciertos, y cada cuenta es de una sola persona.</li>
            <li>
              Guarda bien tu contraseña y no la compartas. Si crees que alguien ha entrado en tu cuenta, cámbiala y
              escríbenos.
            </li>
            <li>
              Eres responsable de lo que se haga desde tu cuenta, salvo que ocurra sin culpa tuya (por ejemplo, por un
              fallo nuestro).
            </li>
          </ul>
          <h3 id="menores">Menores</h3>
          <p>
            Los menores de edad no pueden crear una cuenta propia. Solo pueden usar HAPPA con una cuenta de menor que
            crea y gestiona su madre, padre o tutor legal dentro de un hogar familiar, cuando esa función esté
            disponible. Quien la gestiona da el consentimiento necesario, decide cómo se usa y es responsable de ese
            uso. Las cuentas de menor tienen funciones limitadas: por ejemplo, no tienen foto de perfil ni pueden girar
            la ruleta.
          </p>
        </>
      ),
    },
    {
      id: "hogares",
      title: "5. Hogares y convivencia",
      body: (
        <ul>
          <li>
            Quien crea un hogar es su administrador: puede invitar con el código, decidir cuántas plazas tiene y cambiar
            su configuración. Puede haber más de un administrador.
          </li>
          <li>
            Lo que compartes en un hogar (mensajes, gastos, tareas, la lista común, tu nombre y tu foto) lo ven las
            demás personas de ese hogar que tienen acceso a esa parte. Comparte solo lo que quieras que vean.
          </li>
          <li>
            Si sales de un hogar o borras tu cuenta, lo que aportaste a ese hogar (por ejemplo, gastos o mensajes) se
            queda, para que a los demás les sigan cuadrando las cuentas. Si borras tu cuenta, aparecerás como «Usuario
            eliminado».
          </li>
          <li>
            HAPPA es solo una herramienta: no somos parte de vuestros acuerdos de convivencia ni del contrato de
            alquiler, y no somos casero, administrador de fincas ni intermediario inmobiliario. Los desacuerdos entre
            las personas de un hogar se resuelven entre ellas.
          </li>
        </ul>
      ),
    },
    {
      id: "gastos",
      title: "6. Gastos y pagos",
      body: (
        <ul>
          <li>
            La sección de Gastos sirve para apuntar lo que paga cada uno y calcular cómo quedan las cuentas. HAPPA no
            mueve dinero, no cobra ni paga por nadie y no es una entidad de pago.
          </li>
          <li>
            Los saldos se calculan con lo que apuntáis vosotros. No comprobamos que sea cierto, así que revisadlo antes
            de pagar.
          </li>
          <li>
            Marcar un pago como hecho solo deja constancia en la app. El dinero lo movéis vosotros, por el medio que
            elijáis (efectivo, Bizum, transferencia...).
          </li>
        </ul>
      ),
    },
    {
      id: "normas",
      title: "7. Normas de uso",
      body: (
        <>
          <p>Usa HAPPA de buena fe y respetando a los demás. En concreto, no puedes:</p>
          <ul>
            <li>
              Publicar o enviar contenido ilegal, ni contenido que acose, amenace, insulte, discrimine o incite al odio
              o a la violencia.
            </li>
            <li>Publicar contenido sexual, ni nada que pueda dañar a menores.</li>
            <li>Compartir datos personales o fotos de otras personas sin su permiso, ni hacerte pasar por otra persona.</li>
            <li>Enviar spam, publicidad que no hayamos autorizado, enlaces engañosos (phishing) o programas dañinos.</li>
            <li>
              Intentar entrar en cuentas u hogares ajenos, saltarte los límites de la app, interferir en su
              funcionamiento o sobrecargarla.
            </li>
            <li>
              Usar robots o programas automáticos para usar HAPPA o copiar su contenido, o usarla con fines comerciales
              sin nuestro permiso.
            </li>
          </ul>
          <p>
            Si incumples estas normas, podemos tomar las medidas del <a href="#moderacion">apartado 9</a>.
          </p>
        </>
      ),
    },
    {
      id: "contenido",
      title: "8. Tu contenido",
      body: (
        <ul>
          <li>Lo que subes a HAPPA (mensajes, fotos, gastos, listas...) es tuyo.</li>
          <li>
            Para poder prestarte el servicio, nos das permiso para guardarlo, adaptarlo técnicamente (por ejemplo,
            reducir el tamaño de una foto) y mostrarlo a las personas con las que lo compartes. Es un permiso gratuito,
            no exclusivo, solo para ese fin y mientras haga falta. No vendemos tu contenido ni lo usamos para
            publicidad.
          </li>
          <li>
            Solo puedes subir contenido que tengas derecho a compartir. Tu foto de perfil tiene que ser tuya o contar
            con el permiso de quien aparece en ella.
          </li>
        </ul>
      ),
    },
    {
      id: "moderacion",
      title: "9. Contenido ilegal, moderación y medidas",
      body: (
        <>
          <p>
            <strong>Cómo avisarnos.</strong> Si ves en HAPPA algo que crees que es ilegal o que incumple estas normas,
            escríbenos a <Mail to={CONTACT_EMAIL} /> indicando:
          </p>
          <ul>
            <li>dónde está (el hogar y la pantalla);</li>
            <li>por qué crees que es ilegal o que incumple las normas;</li>
            <li>tu nombre y tu correo (no hace falta si se trata de abusos sexuales a menores);</li>
            <li>y que lo comunicas de buena fe.</li>
          </ul>
          <p>Te confirmaremos que lo hemos recibido y te contaremos qué hemos decidido.</p>
          <p>
            <strong>Cómo decidimos.</strong> No revisamos de antemano lo que publicáis: los hogares son privados.
            Actuamos cuando nos llega un aviso o sabemos de algo ilegal. Las decisiones las toma una persona, de forma
            diligente, objetiva y proporcionada, sin sistemas automáticos.
          </p>
          <p>
            <strong>Qué podemos hacer.</strong> Según la gravedad: retirar o bloquear un contenido, limitar alguna
            función, o suspender o cerrar una cuenta. Si hay una amenaza para la vida o la seguridad de alguien,
            avisaremos a las autoridades.
          </p>
          <p>
            <strong>Te explicamos por qué.</strong> Si tomamos una medida que te afecta, te diremos qué hemos hecho y
            por qué, salvo que la ley no lo permita. Si no estás de acuerdo, responde a ese correo o escríbenos a{" "}
            <Mail to={CONTACT_EMAIL} /> y lo volveremos a revisar. También puedes acudir a los tribunales.
          </p>
        </>
      ),
    },
    {
      id: "baja",
      title: "10. Borrar tu cuenta y cierre del servicio",
      body: (
        <ul>
          <li>
            Puedes borrar tu cuenta cuando quieras desde Tu perfil → Borrar mi cuenta. Si debes dinero o tienes gastos
            o pagos sin confirmar en algún hogar, te pediremos que lo resuelvas antes, para no dejar a los demás con
            cuentas que no cuadran. Si no puedes resolverlo, escríbenos a <Mail to={PRIVACY_EMAIL} /> y te ayudamos a
            borrarla.
          </li>
          <li>
            Podemos suspender o cerrar tu cuenta si incumples estas normas de forma grave o repetida, o si lo exige la
            ley. Salvo urgencia o que la ley lo impida, te avisaremos antes y te explicaremos el motivo.
          </li>
          <li>
            Si algún día dejamos de ofrecer HAPPA, os avisaremos con al menos 30 días de antelación para que podáis
            guardar lo que necesitéis.
          </li>
        </ul>
      ),
    },
    {
      id: "servicio",
      title: "11. Funcionamiento del servicio",
      body: (
        <p>
          Hacemos lo posible para que HAPPA funcione bien y sea segura, pero puede haber fallos, interrupciones o pausas
          por mantenimiento. Podemos mejorar, cambiar o quitar funciones. Si un cambio te perjudica de forma
          importante, te avisaremos con antelación.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "12. Responsabilidad",
      body: (
        <ul>
          <li>
            Respondemos de los daños que te causemos con dolo o culpa grave, y en todo lo que la ley no permita
            limitar.
          </li>
          <li>
            No respondemos de lo que publiquen o hagan otras personas en HAPPA, de los acuerdos entre las personas de un
            hogar (como los pagos o el reparto de tareas), ni de los daños causados por usar HAPPA en contra de estos
            términos o por causas que no podamos controlar (como cortes de internet).
          </li>
          <li>Nada de lo que dicen estos términos limita los derechos que te da la ley como consumidor.</li>
        </ul>
      ),
    },
    {
      id: "propiedad",
      title: "13. Propiedad intelectual",
      body: (
        <p>
          La app, el nombre y el logo de HAPPA, su diseño y su código son de <Owner field="name" lang="es" /> o de
          quienes nos dan licencia para usarlos. Puedes usar HAPPA como prevén estos términos, pero no copiarlos,
          modificarlos ni distribuirlos sin permiso, salvo en lo que permita la ley.
        </p>
      ),
    },
    {
      id: "privacidad",
      title: "14. Privacidad",
      body: (
        <p>
          Tratamos tus datos personales como explica la <Privacy>política de privacidad</Privacy>.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "15. Cambios en estos términos",
      body: (
        <p>
          Podemos cambiar estos términos, por ejemplo, por cambios en la ley o en HAPPA. Si el cambio es importante, te
          avisaremos en la app o por correo con al menos 15 días de antelación y, cuando haga falta, te pediremos que lo
          aceptes de nuevo. Si no estás de acuerdo, puedes borrar tu cuenta antes de que entre en vigor.
        </p>
      ),
    },
    {
      id: "ley",
      title: "16. Ley aplicable y reclamaciones",
      body: (
        <ul>
          <li>
            Estos términos se rigen por la ley española. Si eres consumidor y vives en otro país de la Unión Europea,
            también te protegen las normas de tu país que no se pueden dejar de aplicar.
          </li>
          <li>
            Si tienes una queja, escríbenos a <Mail to={CONTACT_EMAIL} /> e intentaremos resolverla. También puedes
            acudir a las autoridades de consumo de tu comunidad autónoma o a los tribunales de tu domicilio.
          </li>
          <li>
            Estos términos están en español y en inglés. Si hay alguna diferencia, vale la versión en español, salvo que
            la otra te sea más favorable.
          </li>
        </ul>
      ),
    },
  ],
};

export const termsEn: LegalDocument = {
  version: "1",
  updated: "8 October 2026",
  summary: [
    <>HAPPA is free and helps you run a shared home: shopping, expenses, chores, schedules, chat and the wheel.</>,
    <>You must be an adult to have an account. Minors can only use HAPPA through an account managed by their parent or guardian.</>,
    <>What you share in a home is seen by the people in that home. Your content is yours.</>,
    <>HAPPA doesn’t move money: Expenses only records what you pay and works out the balances.</>,
    <>No illegal content, harassment or scams. If you see something like that, tell us at <Mail to={CONTACT_EMAIL} />.</>,
    <>You can delete your account whenever you want.</>,
  ],
  sections: [
    {
      id: "quienes-somos",
      title: "1. Who is behind HAPPA",
      body: (
        <>
          <p>
            HAPPA (the app and the website happa.es) is a service of <Owner field="name" lang="en" />, tax ID{" "}
            <Owner field="taxId" lang="en" />, with its address at <Owner field="address" lang="en" />
            {LEGAL_OWNER.registry ? <>, registered in {LEGAL_OWNER.registry}</> : null}.
          </p>
          <p>
            You can write to us at <Mail to={CONTACT_EMAIL} />, which is also our single point of contact for users
            and authorities (in Spanish or English). For anything about your personal data: <Mail to={PRIVACY_EMAIL} />.
          </p>
          <p>In these terms, “HAPPA” or “we” means the owner of the service, and “you” means the person using it.</p>
        </>
      ),
    },
    {
      id: "que-es",
      title: "2. What HAPPA is",
      body: (
        <>
          <p>
            HAPPA is an app to organise life in a shared home: a student flat, a couple or a family. Among other things,
            it lets you create homes and invite other people, keep a shared shopping list and a personal one, record and
            split expenses, organise chores and schedules, talk in the home’s chat, spin the wheel to decide who does
            something, and get notifications.
          </p>
          <p>
            HAPPA is currently free. If we add paid features or services for professionals in the future, they will
            have their own conditions, which you will see and accept separately before buying anything.
          </p>
        </>
      ),
    },
    {
      id: "aceptacion",
      title: "3. Acceptance",
      body: (
        <p>
          By creating your account you accept these terms and the <Privacy>privacy policy</Privacy>. We keep a record
          of which version you accepted and when. If you don’t agree, don’t use HAPPA.
        </p>
      ),
    },
    {
      id: "cuenta",
      title: "4. Your account",
      body: (
        <>
          <ul>
            <li>You must be 18 or older to create an account.</li>
            <li>The details you give us (such as your email) must be true, and each account belongs to one person.</li>
            <li>
              Keep your password safe and don’t share it. If you think someone has got into your account, change it and
              write to us.
            </li>
            <li>
              You are responsible for what is done from your account, unless it happens through no fault of yours (for
              example, because of a mistake on our side).
            </li>
          </ul>
          <h3 id="menores">Minors</h3>
          <p>
            Minors cannot create their own account. They can only use HAPPA through a minor account created and managed
            by their parent or legal guardian within a family home, once that feature is available. Whoever manages it
            gives the necessary consent, decides how it is used and is responsible for that use. Minor accounts have
            limited features: for example, they have no profile photo and cannot spin the wheel.
          </p>
        </>
      ),
    },
    {
      id: "hogares",
      title: "5. Homes and living together",
      body: (
        <ul>
          <li>
            Whoever creates a home is its admin: they can invite people with the code, decide how many places it has
            and change its settings. A home can have more than one admin.
          </li>
          <li>
            What you share in a home (messages, expenses, chores, the shared list, your name and your photo) is seen by
            the other people in that home who have access to that part. Only share what you want them to see.
          </li>
          <li>
            If you leave a home or delete your account, what you contributed to that home (for example, expenses or
            messages) stays, so that the others’ balances still add up. If you delete your account, you will appear as
            “Deleted user”.
          </li>
          <li>
            HAPPA is just a tool: we are not a party to your household arrangements or your rental contract, and we are
            not a landlord, property manager or estate agent. Disagreements between the people in a home are for them
            to resolve.
          </li>
        </ul>
      ),
    },
    {
      id: "gastos",
      title: "6. Expenses and payments",
      body: (
        <ul>
          <li>
            The Expenses section is for recording what each person pays and working out the balances. HAPPA doesn’t move
            money, doesn’t charge or pay on anyone’s behalf and is not a payment institution.
          </li>
          <li>
            Balances are calculated from what you record. We don’t check that it is correct, so review it before paying.
          </li>
          <li>
            Marking a payment as done only records it in the app. You move the money yourselves, however you choose
            (cash, bank transfer, payment apps…).
          </li>
        </ul>
      ),
    },
    {
      id: "normas",
      title: "7. Rules of use",
      body: (
        <>
          <p>Use HAPPA in good faith and respect others. In particular, you must not:</p>
          <ul>
            <li>
              Post or send illegal content, or content that harasses, threatens, insults, discriminates against or
              incites hatred or violence.
            </li>
            <li>Post sexual content, or anything that could harm minors.</li>
            <li>Share other people’s personal data or photos without their permission, or impersonate anyone.</li>
            <li>Send spam, advertising we haven’t authorised, misleading links (phishing) or malicious software.</li>
            <li>
              Try to access other people’s accounts or homes, get around the app’s limits, interfere with how it works or
              overload it.
            </li>
            <li>
              Use bots or automated programs to use HAPPA or copy its content, or use it for commercial purposes without
              our permission.
            </li>
          </ul>
          <p>
            If you break these rules, we may take the measures in <a href="#moderacion">section 9</a>.
          </p>
        </>
      ),
    },
    {
      id: "contenido",
      title: "8. Your content",
      body: (
        <ul>
          <li>What you upload to HAPPA (messages, photos, expenses, lists…) is yours.</li>
          <li>
            So that we can provide the service, you allow us to store it, adapt it technically (for example, reduce the
            size of a photo) and show it to the people you share it with. This permission is free, non-exclusive, only
            for that purpose and only for as long as needed. We don’t sell your content or use it for advertising.
          </li>
          <li>
            Only upload content you have the right to share. Your profile photo must be of you or have the permission of
            whoever appears in it.
          </li>
        </ul>
      ),
    },
    {
      id: "moderacion",
      title: "9. Illegal content, moderation and measures",
      body: (
        <>
          <p>
            <strong>How to report.</strong> If you see something on HAPPA that you think is illegal or breaks these
            rules, write to <Mail to={CONTACT_EMAIL} /> stating:
          </p>
          <ul>
            <li>where it is (the home and the screen);</li>
            <li>why you think it is illegal or breaks the rules;</li>
            <li>your name and email (not needed if it concerns child sexual abuse);</li>
            <li>and that you are reporting it in good faith.</li>
          </ul>
          <p>We will confirm that we have received it and tell you what we have decided.</p>
          <p>
            <strong>How we decide.</strong> We don’t review what you post in advance: homes are private. We act when we
            receive a report or become aware of something illegal. Decisions are made by a person, diligently,
            objectively and proportionately, without automated systems.
          </p>
          <p>
            <strong>What we can do.</strong> Depending on how serious it is: remove or block content, limit a feature, or
            suspend or close an account. If there is a threat to someone’s life or safety, we will inform the
            authorities.
          </p>
          <p>
            <strong>We explain why.</strong> If we take a measure that affects you, we will tell you what we did and why,
            unless the law doesn’t allow it. If you disagree, reply to that email or write to <Mail to={CONTACT_EMAIL} />{" "}
            and we will review it again. You can also go to the courts.
          </p>
        </>
      ),
    },
    {
      id: "baja",
      title: "10. Deleting your account and closing the service",
      body: (
        <ul>
          <li>
            You can delete your account whenever you want from Your profile → Delete my account. If you owe money or
            have unconfirmed expenses or payments in any home, we will ask you to sort them out first, so the others
            aren’t left with balances that don’t add up. If you can’t, write to <Mail to={PRIVACY_EMAIL} /> and we will
            help you delete it.
          </li>
          <li>
            We may suspend or close your account if you break these rules seriously or repeatedly, or if the law
            requires it. Unless it is urgent or the law prevents it, we will warn you first and explain why.
          </li>
          <li>
            If we ever stop offering HAPPA, we will give you at least 30 days’ notice so you can save whatever you need.
          </li>
        </ul>
      ),
    },
    {
      id: "servicio",
      title: "11. How the service works",
      body: (
        <p>
          We do our best to keep HAPPA working well and securely, but there may be errors, interruptions or maintenance
          breaks. We may improve, change or remove features. If a change significantly affects you, we will let you know
          in advance.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "12. Liability",
      body: (
        <ul>
          <li>We are liable for damage we cause you intentionally or through gross negligence, and for anything the law doesn’t allow us to limit.</li>
          <li>
            We are not liable for what other people post or do on HAPPA, for arrangements between the people in a home
            (such as payments or sharing chores), or for damage caused by using HAPPA against these terms or by causes
            beyond our control (such as internet outages).
          </li>
          <li>Nothing in these terms limits your rights as a consumer under the law.</li>
        </ul>
      ),
    },
    {
      id: "propiedad",
      title: "13. Intellectual property",
      body: (
        <p>
          The app, the HAPPA name and logo, its design and its code belong to <Owner field="name" lang="en" /> or to
          those who license them to us. You may use HAPPA as these terms allow, but not copy, modify or distribute them
          without permission, except as the law allows.
        </p>
      ),
    },
    {
      id: "privacidad",
      title: "14. Privacy",
      body: (
        <p>
          We process your personal data as explained in the <Privacy>privacy policy</Privacy>.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "15. Changes to these terms",
      body: (
        <p>
          We may change these terms, for example because of changes in the law or in HAPPA. If a change is significant,
          we will tell you in the app or by email at least 15 days in advance and, where needed, ask you to accept it
          again. If you don’t agree, you can delete your account before it takes effect.
        </p>
      ),
    },
    {
      id: "ley",
      title: "16. Applicable law and complaints",
      body: (
        <ul>
          <li>
            These terms are governed by Spanish law. If you are a consumer living in another EU country, you are also
            protected by the mandatory rules of your country.
          </li>
          <li>
            If you have a complaint, write to <Mail to={CONTACT_EMAIL} /> and we will try to resolve it. You can also
            contact the consumer authorities where you live or go to the courts of your place of residence.
          </li>
          <li>
            These terms are available in Spanish and English. If there is any difference, the Spanish version applies,
            unless the other one is more favourable to you.
          </li>
        </ul>
      ),
    },
  ],
};

export const TERMS: Record<Lang, LegalDocument> = { es: termsEs, en: termsEn };
