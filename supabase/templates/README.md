# Correos de HAPPA (Supabase Auth)

Plantillas de los correos que manda Supabase, en español o en inglés según el idioma con el que se
registró cada persona (`.Data.locale`; si no hay, en español).

En un proyecto de Supabase en la nube, las plantillas **no se leen de esta carpeta**: se copian a mano
en Supabase → Authentication → Emails. Aquí se guardan para tenerlas en git y poder cambiarlas.

| En Supabase | Archivo | Asunto (Subject) |
|---|---|---|
| Templates → Confirm sign up | `confirmation.html` | `{{ if eq (print .Data.locale) "en" }}Confirm your HAPPA account{{ else }}Confirma tu cuenta de HAPPA{{ end }}` |
| Templates → Change email address | `email_change.html` | `{{ if eq (print .Data.locale) "en" }}Confirm your new email for HAPPA{{ else }}Confirma tu correo nuevo en HAPPA{{ end }}` |
| Security → Password changed (activarla) | `password_changed_notification.html` | `{{ if eq (print .Data.locale) "en" }}Your HAPPA password has changed{{ else }}Tu contraseña de HAPPA ha cambiado{{ end }}` |
| Security → Email address changed (activarla) | `email_changed_notification.html` | `{{ if eq (print .Data.locale) "en" }}Your HAPPA email has changed{{ else }}El correo de tu cuenta de HAPPA ha cambiado{{ end }}` |

Reglas:

- **Nada que escriba el usuario entra en un correo** (ni su nombre): cualquiera puede registrarse con el
  correo de otra persona, y así nadie puede usar HAPPA para mandarle textos suyos (phishing).
- Solo se usan `.ConfirmationURL`, `.Email`, `.NewEmail`, `.OldEmail` y `.Data.locale`.
- Si cambias algo, comprueba los dos idiomas registrando una cuenta de prueba en `/registro` y en
  `/en/registro`.
