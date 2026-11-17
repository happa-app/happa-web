// Términos y condiciones de uso de HAPPA, en español y en inglés. Texto de la versión 3 de los textos legales
// (revisada el 11/11/2026; el PDF está fuera del repo, en referencias-legales-happa). Si hay diferencias entre
// idiomas, vale el español (apartado 17.4).
//
// Si cambias algo importante: sube la versión en ../versions.ts y cambia aquí la versión y la fecha.
import { CONTACT_EMAIL, PRIVACY_EMAIL } from "../owner";
import { CookiesLink, type Lang, Mail, NoticeLink, Owner, PrivacyLink } from "./shared";
import type { LegalDocument } from "./types";

const termsEs: LegalDocument = {
  version: "3",
  updated: "17 de noviembre de 2026",
  summaryTitle: "Lo esencial",
  summary: [
    <>HAPPA es una aplicación gratuita para organizar un hogar compartido: compra, gastos, tareas, horarios, chat y ruleta.</>,
    <>Para usarla hay que tener 16 años o más.</>,
    <>Lo que comparte en un hogar lo ven las personas de ese hogar. Su contenido es suyo.</>,
    <>HAPPA no mueve dinero: los gastos y las deudas que se apuntan son registros informales, no contratos.</>,
    <>
      No se permite contenido ilegal, acoso ni engaños. Puede avisarnos en <Mail to={CONTACT_EMAIL} />.
    </>,
    <>Puede borrar su cuenta cuando quiera.</>,
  ],
  sections: [
    {
      id: "titular",
      title: "1. Quién presta el servicio",
      body: (
        <>
          <p>
            1.1. HAPPA (la aplicación y el sitio web happa.es) es un servicio de <Owner field="name" lang="es" />, con
            NIF <Owner field="taxId" lang="es" /> y domicilio en <Owner field="address" lang="es" />. El resto de los
            datos del titular figuran en el <NoticeLink>Aviso legal</NoticeLink>.
          </p>
          <p>
            1.2. El correo <Mail to={CONTACT_EMAIL} /> es el punto de contacto único y la vía de comunicación
            electrónica directa con HAPPA, tanto para los usuarios como para las autoridades de los Estados miembros, la
            Comisión Europea y la Junta Europea de Servicios Digitales (arts. 11 y 12 del Reglamento (UE) 2022/2065, de
            Servicios Digitales). Se puede usar en español o en inglés. Para todo lo relacionado con sus datos
            personales, escriba a <Mail to={PRIVACY_EMAIL} />.
          </p>
        </>
      ),
    },
    {
      id: "servicio",
      title: "2. Qué es HAPPA",
      body: (
        <>
          <p>
            2.1. HAPPA es una aplicación para organizar la vida en un hogar compartido, ya sea un piso de estudiantes,
            una pareja o una familia. Permite:
          </p>
          <ul>
            <li>crear hogares e invitar a otras personas con un código;</li>
            <li>
              llevar una lista de la compra común del hogar y una lista personal, que se puede compartir con un hogar;
            </li>
            <li>
              apuntar gastos, repartirlos y llevar las cuentas de quién debe a quién, incluidos los gastos fijos que se
              repiten;
            </li>
            <li>organizar tareas, horarios y ausencias;</li>
            <li>hablar en el chat del hogar y hacer votaciones;</li>
            <li>usar la ruleta para decidir al azar a quién le toca algo;</li>
            <li>recibir avisos en la aplicación y, si los activa, en el móvil.</li>
          </ul>
          <p>
            2.2. HAPPA es gratuita y no muestra publicidad. Si en el futuro se añaden funciones de pago, tendrán sus
            propias condiciones, que usted podrá leer y aceptar aparte antes de contratar nada.
          </p>
        </>
      ),
    },
    {
      id: "aceptacion",
      title: "3. Aceptación",
      body: (
        <>
          <p>
            3.1. Para crear una cuenta debe aceptar estos términos marcando la casilla del formulario de registro (o en
            la pantalla «Antes de empezar» si entra con Google). Guardamos qué versión aceptó y cuándo.
          </p>
          <p>3.2. Si no está de acuerdo con estos términos, no debe usar HAPPA.</p>
        </>
      ),
    },
    {
      id: "cuenta",
      title: "4. Requisitos y cuenta de usuario",
      body: (
        <>
          <p>
            4.1. <strong>Edad mínima.</strong> Para crear una cuenta debe tener 16 años o más. Las personas menores de 16
            años no pueden usar HAPPA.
          </p>
          <p>
            4.2. Si tiene 16 o 17 años, puede usar HAPPA por sí mismo. Le recomendamos que lo comente con su padre, madre
            o tutor. Al registrarse, declara que tiene la edad necesaria.
          </p>
          <p>
            4.3. Los datos que facilite deben ser ciertos y estar actualizados. Cada cuenta es personal: solo la puede
            usar la persona que la creó.
          </p>
          <p>
            4.4. Puede registrarse con su correo y una contraseña o entrar con su cuenta de Google. Guarde su contraseña
            con cuidado y no la comparta. Si cree que alguien ha accedido a su cuenta, cámbiela y avísenos.
          </p>
          <p>
            4.5. Usted es responsable de lo que se haga desde su cuenta, salvo que ocurra sin culpa suya (por ejemplo,
            por un fallo de seguridad nuestro).
          </p>
        </>
      ),
    },
    {
      id: "hogares",
      title: "5. Hogares y convivencia",
      body: (
        <>
          <p>
            5.1. Quien crea un hogar es su administrador. Puede invitar a otras personas con el código del hogar,
            decidir cuántas plazas tiene (entre 1 y 20) y cambiar su configuración. Un hogar puede tener varios
            administradores. El resto de las personas del hogar son miembros.
          </p>
          <p>
            5.2. Lo que comparte en un hogar (su nombre y foto, mensajes, votos, gastos, pagos, tareas, horarios,
            ausencias y la lista común) lo ven las demás personas de ese hogar. Comparta solo lo que quiera que vean.
            Usted decide a quién invita y qué comparte.
          </p>
          <p>
            5.3. Si sale de un hogar, deja de tener acceso a él y a su chat. Lo que aportó (por ejemplo, gastos o
            mensajes) permanece en el hogar, para que las cuentas del resto sigan cuadrando.
          </p>
          <p>
            5.4. <strong>Cuentas pendientes.</strong> Si al salir tiene un saldo pendiente con alguien del hogar (debe
            dinero o se lo deben), se abre una conversación aparte, «Cuentas pendientes», solo entre usted y las
            personas con las que tiene ese saldo. En ella podrán ver lo que queda por pagar, hablar y marcar los pagos.
            Esa conversación se cierra cuando el saldo queda a cero. Usted no verá el chat del hogar ni a las personas
            que entren después de su salida.
          </p>
          <p>
            5.5. HAPPA es solo una herramienta. No somos parte de los acuerdos de convivencia entre las personas de un
            hogar ni del contrato de alquiler, y no actuamos como casero, administrador de fincas ni intermediario
            inmobiliario. Los desacuerdos entre las personas de un hogar se resuelven entre ellas.
          </p>
        </>
      ),
    },
    {
      id: "gastos",
      title: "6. Gastos y pagos",
      body: (
        <>
          <p>
            6.1. La sección de gastos sirve para apuntar lo que paga cada persona y calcular cómo quedan las cuentas.
            HAPPA no mueve dinero: no cobra ni paga por nadie y no es una entidad de pago.
          </p>
          <p>
            6.2. Los gastos, deudas, saldos y pagos que se apuntan en HAPPA son registros informales entre las personas
            del hogar y no constituyen contratos ni documentos con valor legal. Los saldos se calculan con los datos que
            introducen los usuarios. No comprobamos que sean ciertos, así que revíselos antes de pagar.
          </p>
          <p>
            6.3. Un gasto nuevo lo confirman las personas que participan en él. Hasta que se confirma, puede editarlo o
            borrarlo quien lo creó o un administrador; después, solo un administrador.
          </p>
          <p>
            6.4. Un pago lo marca quien paga y lo confirma quien lo recibe. Marcarlo solo deja constancia en la
            aplicación. El dinero lo mueven ustedes por el medio que elijan (efectivo, Bizum, transferencia...).
          </p>
          <p>
            6.5. Los gastos fijos (como internet, la luz o una suscripción) se apuntan solos con la periodicidad que
            ustedes configuren. Conviene revisar que el importe sigue siendo correcto.
          </p>
        </>
      ),
    },
    {
      id: "funciones",
      title: "7. Otras funciones",
      body: (
        <>
          <p>
            7.1. <strong>Tareas.</strong> Una tarea cuenta como hecha cuando se marca. Cualquier adulto del hogar puede
            indicar que no está hecha, y entonces vuelve a quedar pendiente.
          </p>
          <p>
            7.2. <strong>Horarios y ausencias.</strong> Sirven para que el hogar sepa quién está en casa. Las personas del
            hogar verán cuándo usted está fuera, así que valore qué quiere compartir.
          </p>
          <p>
            7.3. <strong>Chat y votaciones.</strong> Los mensajes y los votos son visibles para las personas del hogar
            que tienen acceso al chat. Los votos no son secretos.
          </p>
          <p>
            7.4. <strong>Ruleta.</strong> El resultado es aleatorio. Lo que el hogar decida a partir de él es
            responsabilidad de sus miembros.
          </p>
        </>
      ),
    },
    {
      id: "normas",
      title: "8. Normas de uso",
      body: (
        <>
          <p>8.1. Debe usar HAPPA de buena fe, respetando la ley y a las demás personas. En concreto, no puede:</p>
          <ul>
            <li>
              publicar o enviar contenido ilegal, o que acose, amenace, insulte, discrimine o incite al odio o a la
              violencia;
            </li>
            <li>publicar contenido sexual o cualquier contenido que pueda perjudicar a menores;</li>
            <li>
              compartir datos personales o imágenes de otras personas sin su permiso, ni hacerse pasar por otra persona;
            </li>
            <li>enviar spam, publicidad no autorizada, enlaces engañosos (phishing) o programas dañinos;</li>
            <li>
              intentar acceder a cuentas u hogares ajenos, saltarse los límites de la aplicación, interferir en su
              funcionamiento o sobrecargarla;
            </li>
            <li>
              usar robots u otros medios automáticos para usar HAPPA o copiar su contenido, o usarla con fines
              comerciales sin nuestro permiso.
            </li>
          </ul>
          <p>8.2. Si incumple estas normas, podremos aplicar las medidas del apartado 10.</p>
        </>
      ),
    },
    {
      id: "contenido",
      title: "9. Su contenido",
      body: (
        <>
          <p>9.1. Lo que usted sube a HAPPA (mensajes, fotos, gastos, listas...) es suyo.</p>
          <p>
            9.2. Para poder prestarle el servicio, nos autoriza a almacenarlo, adaptarlo técnicamente (por ejemplo,
            reducir el tamaño de una foto) y mostrarlo a las personas con las que lo comparte. Es una autorización
            gratuita, no exclusiva, limitada a ese fin y al tiempo necesario. No vendemos su contenido ni lo usamos con
            fines publicitarios.
          </p>
          <p>
            9.3. Solo puede subir contenido que tenga derecho a compartir. Su foto de perfil debe ser suya o contar con
            el permiso de quien aparece en ella.
          </p>
        </>
      ),
    },
    {
      id: "moderacion",
      title: "10. Contenido ilegal, moderación y medidas",
      body: (
        <>
          <p>
            10.1. <strong>Cómo avisarnos.</strong> Si encuentra en HAPPA algo que considere ilegal o contrario a estos
            términos, escriba a <Mail to={CONTACT_EMAIL} /> indicando dónde está (el hogar y la pantalla), por qué cree
            que es ilegal o incumple las normas, su nombre y correo (no es necesario si se trata de abusos sexuales a
            menores) y que lo comunica de buena fe. Le confirmaremos la recepción y le informaremos de nuestra decisión.
          </p>
          <p>
            10.2. <strong>Cómo decidimos.</strong> Los hogares son privados y no revisamos de antemano lo que se publica.
            Actuamos cuando recibimos un aviso o tenemos conocimiento de algo ilegal. Las decisiones las toma una
            persona, de forma diligente, objetiva y proporcionada, sin sistemas automáticos.
          </p>
          <p>
            10.3. <strong>Qué medidas podemos tomar.</strong> Según la gravedad: retirar o bloquear un contenido, limitar
            alguna función, o suspender o cerrar una cuenta. Si existe una amenaza para la vida o la seguridad de
            alguien, lo comunicaremos a las autoridades.
          </p>
          <p>
            10.4. <strong>Motivación y revisión.</strong> Si tomamos una medida que le afecta, le explicaremos qué hemos
            hecho y por qué, salvo que la ley lo impida. Si no está de acuerdo, puede responder a ese correo o escribir a{" "}
            <Mail to={CONTACT_EMAIL} /> y lo revisaremos de nuevo. También puede acudir a los tribunales.
          </p>
        </>
      ),
    },
    {
      id: "baja",
      title: "11. Baja, suspensión y cierre del servicio",
      body: (
        <>
          <p>
            11.1. Puede borrar su cuenta en cualquier momento desde Perfil → Borrar mi cuenta. Si tiene saldos
            pendientes o gastos y pagos sin confirmar, se lo advertiremos antes de confirmar el borrado, pero la
            decisión es suya y no le impediremos borrar la cuenta. Los saldos seguirán apuntados para el resto del hogar
            a nombre de «Usuario eliminado». Como explica el apartado 6, se trata de registros informales: cualquier
            reclamación entre las personas del hogar queda al margen de HAPPA.
          </p>
          <p>
            11.2. Antes de borrar la cuenta, tenga en cuenta que los mensajes que envió al chat se mantienen para el
            resto del hogar a nombre de «Usuario eliminado» (ver la <PrivacyLink>Política de privacidad</PrivacyLink>).
            Si quiere que borremos algún mensaje concreto, escriba a <Mail to={PRIVACY_EMAIL} />.
          </p>
          <p>
            11.3. Podemos suspender o cerrar su cuenta si incumple estos términos de forma grave o reiterada, o si lo
            exige la ley. Salvo urgencia o impedimento legal, le avisaremos antes y le explicaremos el motivo.
          </p>
          <p>
            11.4. Si dejamos de ofrecer HAPPA, avisaremos con al menos 30 días de antelación para que pueda guardar la
            información que necesite.
          </p>
        </>
      ),
    },
    {
      id: "funcionamiento",
      title: "12. Funcionamiento del servicio",
      body: (
        <p>
          Hacemos lo posible para que HAPPA funcione bien y sea segura, pero puede haber fallos, interrupciones o paradas
          por mantenimiento. Podemos mejorar, cambiar o retirar funciones. Si un cambio le perjudica de forma
          importante, le avisaremos con antelación.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "13. Responsabilidad",
      body: (
        <>
          <p>
            13.1. Respondemos de los daños que le causemos con dolo o culpa grave y en todos los casos en que la ley no
            permita limitar la responsabilidad.
          </p>
          <p>
            13.2. No respondemos de lo que publiquen o hagan otros usuarios, de los acuerdos entre las personas de un
            hogar (como los pagos o el reparto de tareas), ni de los daños causados por un uso de HAPPA contrario a
            estos términos o por causas ajenas a nuestro control (como cortes de internet).
          </p>
          <p>13.3. Nada de lo dispuesto en estos términos limita los derechos que la ley le reconoce como consumidor.</p>
        </>
      ),
    },
    {
      id: "propiedad",
      title: "14. Propiedad intelectual",
      body: (
        <p>
          La aplicación, el nombre y el logotipo de HAPPA, su diseño y su código pertenecen al titular o a quienes le
          autorizan a usarlos. Puede usar HAPPA en los términos previstos aquí, pero no copiarla, modificarla ni
          distribuirla sin permiso, salvo en lo que permita la ley.
        </p>
      ),
    },
    {
      id: "privacidad",
      title: "15. Privacidad",
      body: (
        <p>
          Tratamos sus datos personales según se explica en la <PrivacyLink>Política de privacidad</PrivacyLink> y en la{" "}
          <CookiesLink>Política de cookies</CookiesLink>.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "16. Cambios en estos términos",
      body: (
        <p>
          Podemos modificar estos términos, por ejemplo, por cambios legales o en HAPPA. Si el cambio es importante, le
          avisaremos en la aplicación o por correo con al menos 15 días de antelación y, cuando sea necesario, le
          pediremos que los acepte de nuevo. Si no está de acuerdo, puede borrar su cuenta antes de que entren en vigor.
        </p>
      ),
    },
    {
      id: "ley",
      title: "17. Ley aplicable y reclamaciones",
      body: (
        <>
          <p>
            17.1. Estos términos se rigen por la ley española. Si usted es consumidor y reside en otro país de la Unión
            Europea, conservará la protección que le den las normas imperativas de su país.
          </p>
          <p>
            17.2. Si tiene una queja, escríbanos a <Mail to={CONTACT_EMAIL} /> e intentaremos resolverla. También puede
            acudir a los servicios de consumo de su comunidad autónoma o de su país de residencia, o a los juzgados y
            tribunales de su domicilio.
          </p>
          <p>17.3. No estamos adheridos a ningún sistema de resolución alternativa de litigios de consumo.</p>
          <p>
            17.4. Estos términos están disponibles en español y en inglés. Si hay alguna diferencia, prevalece la versión
            en español, salvo que la otra le resulte más favorable.
          </p>
        </>
      ),
    },
  ],
};

const termsEn: LegalDocument = {
  version: "3",
  updated: "17 November 2026",
  summaryTitle: "Key points",
  summary: [
    <>HAPPA is a free app for organising a shared home: shopping, expenses, chores, schedules, chat and the wheel.</>,
    <>You must be 16 or older to use it.</>,
    <>What you share in a home is seen by the people in that home. Your content is yours.</>,
    <>HAPPA does not move money: the expenses and debts you record are informal records, not contracts.</>,
    <>
      Illegal content, harassment and scams are not allowed. You can report them to <Mail to={CONTACT_EMAIL} />.
    </>,
    <>You can delete your account whenever you want.</>,
  ],
  sections: [
    {
      id: "titular",
      title: "1. Who provides the service",
      body: (
        <>
          <p>
            1.1. HAPPA (the app and the website happa.es) is a service provided by <Owner field="name" lang="en" />,
            tax ID <Owner field="taxId" lang="en" />, with address at <Owner field="address" lang="en" />. The rest of
            the owner’s details are in the <NoticeLink>Legal notice</NoticeLink>.
          </p>
          <p>
            1.2. The email address <Mail to={CONTACT_EMAIL} /> is the single point of contact and the direct electronic
            channel with HAPPA, both for users and for the authorities of the Member States, the European Commission
            and the European Board for Digital Services (Arts. 11 and 12 of Regulation (EU) 2022/2065, the Digital
            Services Act). You can write in Spanish or English. For anything related to your personal data, write to{" "}
            <Mail to={PRIVACY_EMAIL} />.
          </p>
        </>
      ),
    },
    {
      id: "servicio",
      title: "2. What HAPPA is",
      body: (
        <>
          <p>
            2.1. HAPPA is an app for organising life in a shared home, whether it is a student flat, a couple or a
            family. It lets you:
          </p>
          <ul>
            <li>create homes and invite other people with a code;</li>
            <li>keep a shared shopping list for the home and a personal list, which you can share with a home;</li>
            <li>record expenses, split them and keep track of who owes whom, including recurring fixed expenses;</li>
            <li>organise chores, schedules and absences;</li>
            <li>talk in the home chat and create polls;</li>
            <li>use the wheel to decide at random whose turn it is;</li>
            <li>receive notifications in the app and, if you turn them on, on your phone.</li>
          </ul>
          <p>
            2.2. HAPPA is free and shows no advertising. If paid features are added in the future, they will have their
            own conditions, which you will be able to read and accept separately before buying anything.
          </p>
        </>
      ),
    },
    {
      id: "aceptacion",
      title: "3. Acceptance",
      body: (
        <>
          <p>
            3.1. To create an account you must accept these terms by ticking the box on the sign-up form (or on the
            “Before you start” screen if you sign in with Google). We keep a record of which version you accepted and
            when.
          </p>
          <p>3.2. If you do not agree with these terms, you must not use HAPPA.</p>
        </>
      ),
    },
    {
      id: "cuenta",
      title: "4. Requirements and user account",
      body: (
        <>
          <p>
            4.1. <strong>Minimum age.</strong> You must be 16 or older to create an account. People under 16 may not use
            HAPPA.
          </p>
          <p>
            4.2. If you are 16 or 17, you can use HAPPA on your own. We recommend that you talk about it with your parent
            or guardian. When you sign up, you declare that you meet the age requirement.
          </p>
          <p>
            4.3. The information you provide must be true and up to date. Each account is personal: only the person who
            created it may use it.
          </p>
          <p>
            4.4. You can sign up with your email and a password or sign in with your Google account. Keep your password
            safe and do not share it. If you think someone has accessed your account, change it and let us know.
          </p>
          <p>
            4.5. You are responsible for what is done from your account, unless it happens through no fault of your own
            (for example, because of a security failure on our side).
          </p>
        </>
      ),
    },
    {
      id: "hogares",
      title: "5. Homes and living together",
      body: (
        <>
          <p>
            5.1. Whoever creates a home is its admin. They can invite other people with the home code, decide how many
            places it has (between 1 and 20) and change its settings. A home can have several admins. Everyone else in
            the home is a member.
          </p>
          <p>
            5.2. What you share in a home (your name and photo, messages, votes, expenses, payments, chores, schedules,
            absences and the shared list) is seen by the other people in that home. Only share what you want them to
            see. You decide whom you invite and what you share.
          </p>
          <p>
            5.3. If you leave a home, you lose access to it and to its chat. What you contributed (for example,
            expenses or messages) stays in the home, so that everyone else’s accounts still add up.
          </p>
          <p>
            5.4. <strong>Outstanding balances.</strong> If, when you leave, you have an outstanding balance with someone
            in the home (you owe money or are owed money), a separate conversation, “Outstanding balances”, is opened
            only between you and the people you have that balance with. There you can see what is left to pay, talk and
            mark payments. That conversation closes when the balance reaches zero. You will not see the home chat or
            the people who join after you leave.
          </p>
          <p>
            5.5. HAPPA is only a tool. We are not a party to the living arrangements between the people in a home or to
            the rental contract, and we do not act as landlord, property manager or estate agent. Disagreements between
            the people in a home are for them to resolve.
          </p>
        </>
      ),
    },
    {
      id: "gastos",
      title: "6. Expenses and payments",
      body: (
        <>
          <p>
            6.1. The expenses section is for recording what each person pays and working out how the accounts stand.
            HAPPA does not move money: it does not charge or pay on anyone’s behalf and is not a payment institution.
          </p>
          <p>
            6.2. The expenses, debts, balances and payments recorded in HAPPA are informal records between the people in
            the home and are not contracts or legally binding documents. Balances are calculated from the data users
            enter. We do not check that it is correct, so please review it before paying.
          </p>
          <p>
            6.3. A new expense is confirmed by the people taking part in it. Until it is confirmed, it can be edited or
            deleted by whoever created it or by an admin; after that, only by an admin.
          </p>
          <p>
            6.4. A payment is marked by whoever pays and confirmed by whoever receives it. Marking it only records it in
            the app. You move the money yourselves by whatever means you choose (cash, Bizum, bank transfer...).
          </p>
          <p>
            6.5. Fixed expenses (such as internet, electricity or a subscription) are added automatically at the
            frequency you set. It is a good idea to check that the amount is still correct.
          </p>
        </>
      ),
    },
    {
      id: "funciones",
      title: "7. Other features",
      body: (
        <>
          <p>
            7.1. <strong>Chores.</strong> A chore counts as done when it is ticked. Any adult in the home can say it has
            not been done, and it goes back to pending.
          </p>
          <p>
            7.2. <strong>Schedules and absences.</strong> They let the home know who is in. The people in the home will
            see when you are away, so think about what you want to share.
          </p>
          <p>
            7.3. <strong>Chat and polls.</strong> Messages and votes are visible to the people in the home who have
            access to the chat. Votes are not secret.
          </p>
          <p>
            7.4. <strong>Wheel.</strong> The result is random. What the home decides based on it is the responsibility
            of its members.
          </p>
        </>
      ),
    },
    {
      id: "normas",
      title: "8. Rules of use",
      body: (
        <>
          <p>8.1. You must use HAPPA in good faith, respecting the law and other people. In particular, you must not:</p>
          <ul>
            <li>
              post or send illegal content, or content that harasses, threatens, insults, discriminates or incites hatred
              or violence;
            </li>
            <li>post sexual content or any content that may harm minors;</li>
            <li>share other people’s personal data or images without their permission, or impersonate anyone;</li>
            <li>send spam, unauthorised advertising, misleading links (phishing) or malicious software;</li>
            <li>
              try to access other people’s accounts or homes, get around the app’s limits, interfere with how it works
              or overload it;
            </li>
            <li>
              use robots or other automated means to use HAPPA or copy its content, or use it for commercial purposes
              without our permission.
            </li>
          </ul>
          <p>8.2. If you break these rules, we may take the measures described in section 10.</p>
        </>
      ),
    },
    {
      id: "contenido",
      title: "9. Your content",
      body: (
        <>
          <p>9.1. What you upload to HAPPA (messages, photos, expenses, lists...) is yours.</p>
          <p>
            9.2. So that we can provide the service, you authorise us to store it, adapt it technically (for example,
            reduce the size of a photo) and show it to the people you share it with. This authorisation is free,
            non-exclusive and limited to that purpose and to the time needed. We do not sell your content or use it for
            advertising.
          </p>
          <p>
            9.3. You may only upload content you have the right to share. Your profile photo must be of you or have the
            permission of whoever appears in it.
          </p>
        </>
      ),
    },
    {
      id: "moderacion",
      title: "10. Illegal content, moderation and measures",
      body: (
        <>
          <p>
            10.1. <strong>How to report.</strong> If you find something in HAPPA that you consider illegal or contrary
            to these terms, write to <Mail to={CONTACT_EMAIL} /> stating where it is (the home and the screen), why you
            believe it is illegal or breaks the rules, your name and email (not needed for child sexual abuse) and that
            you are reporting it in good faith. We will confirm receipt and let you know our decision.
          </p>
          <p>
            10.2. <strong>How we decide.</strong> Homes are private and we do not review what is posted in advance. We
            act when we receive a report or become aware of something illegal. Decisions are made by a person,
            diligently, objectively and proportionately, without automated systems.
          </p>
          <p>
            10.3. <strong>What measures we can take.</strong> Depending on how serious it is: removing or blocking
            content, limiting a feature, or suspending or closing an account. If there is a threat to someone’s life or
            safety, we will inform the authorities.
          </p>
          <p>
            10.4. <strong>Reasons and review.</strong> If we take a measure that affects you, we will explain what we
            have done and why, unless the law prevents it. If you disagree, you can reply to that email or write to{" "}
            <Mail to={CONTACT_EMAIL} /> and we will review it again. You can also go to court.
          </p>
        </>
      ),
    },
    {
      id: "baja",
      title: "11. Closing your account, suspension and end of the service",
      body: (
        <>
          <p>
            11.1. You can delete your account at any time from Profile → Delete my account. If you have outstanding
            balances or unconfirmed expenses and payments, we will warn you before you confirm, but the decision is
            yours and we will not stop you from deleting your account. The balances will remain recorded for the rest of
            the home under the name “Deleted user”. As explained in section 6, these are informal records: any claim
            between the people in the home is outside HAPPA.
          </p>
          <p>
            11.2. Before deleting your account, bear in mind that the messages you sent to the chat remain for the rest
            of the home under the name “Deleted user” (see the <PrivacyLink>Privacy policy</PrivacyLink>). If you want
            us to delete a specific message, write to <Mail to={PRIVACY_EMAIL} />.
          </p>
          <p>
            11.3. We may suspend or close your account if you seriously or repeatedly break these terms, or if the law
            requires it. Except in urgent cases or where the law prevents it, we will warn you first and explain why.
          </p>
          <p>
            11.4. If we stop offering HAPPA, we will give at least 30 days’ notice so that you can save any information
            you need.
          </p>
        </>
      ),
    },
    {
      id: "funcionamiento",
      title: "12. How the service works",
      body: (
        <p>
          We do our best to make HAPPA work well and be secure, but there may be faults, interruptions or downtime for
          maintenance. We may improve, change or remove features. If a change significantly harms you, we will let you
          know in advance.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "13. Liability",
      body: (
        <>
          <p>
            13.1. We are liable for damage we cause you intentionally or through gross negligence, and in all cases
            where the law does not allow liability to be limited.
          </p>
          <p>
            13.2. We are not liable for what other users post or do, for agreements between the people in a home (such
            as payments or how chores are shared), or for damage caused by using HAPPA in breach of these terms or by
            causes beyond our control (such as internet outages).
          </p>
          <p>13.3. Nothing in these terms limits the rights the law gives you as a consumer.</p>
        </>
      ),
    },
    {
      id: "propiedad",
      title: "14. Intellectual property",
      body: (
        <p>
          The app, the HAPPA name and logo, its design and its code belong to the owner or to those who authorise the
          owner to use them. You may use HAPPA as provided in these terms, but you may not copy, modify or distribute it
          without permission, except as the law allows.
        </p>
      ),
    },
    {
      id: "privacidad",
      title: "15. Privacy",
      body: (
        <p>
          We process your personal data as explained in the <PrivacyLink>Privacy policy</PrivacyLink> and the{" "}
          <CookiesLink>Cookie policy</CookiesLink>.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "16. Changes to these terms",
      body: (
        <p>
          We may change these terms, for example because of legal changes or changes to HAPPA. If the change is
          significant, we will let you know in the app or by email at least 15 days in advance and, where necessary, ask
          you to accept them again. If you do not agree, you can delete your account before they take effect.
        </p>
      ),
    },
    {
      id: "ley",
      title: "17. Governing law and complaints",
      body: (
        <>
          <p>
            17.1. These terms are governed by Spanish law. If you are a consumer living in another EU country, you keep
            the protection given to you by the mandatory rules of your country.
          </p>
          <p>
            17.2. If you have a complaint, write to us at <Mail to={CONTACT_EMAIL} /> and we will try to resolve it.
            You can also go to the consumer services of your region or country of residence, or to the courts of your
            place of residence.
          </p>
          <p>17.3. We do not participate in any alternative consumer dispute resolution scheme.</p>
          <p>
            17.4. These terms are available in Spanish and English. If there is any difference, the Spanish version
            prevails, unless the other is more favourable to you.
          </p>
        </>
      ),
    },
  ],
};

export const TERMS: Record<Lang, LegalDocument> = { es: termsEs, en: termsEn };
