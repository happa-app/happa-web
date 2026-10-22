# Correos de HAPPA (Supabase Auth)

Plantillas de los correos que manda Supabase, en español o en inglés según el idioma de la cuenta
(`.Data.locale`: el que se eligió al registrarse, y después el de Perfil → Idioma; si no hay, en español).

En un proyecto de Supabase en la nube, las plantillas **no se leen de esta carpeta**: se copian a mano
en Supabase → Authentication → Emails. Aquí se guardan para tenerlas en git y poder cambiarlas.
En la base de datos local sí se usan (`supabase/config.toml`): los correos llegan a http://127.0.0.1:54324.

| En Supabase | Archivo | Asunto (Subject) |
|---|---|---|
| Templates → Confirm sign up | `confirmation.html` | `{{ if eq (print .Data.locale) "en" }}Confirm your HAPPA account{{ else }}Confirma tu cuenta de HAPPA{{ end }}` |
| Templates → Change email address | `email_change.html` | `{{ if eq (print .Data.locale) "en" }}Confirm your new email for HAPPA{{ else }}Confirma tu correo nuevo en HAPPA{{ end }}` |
| Templates → Reset password | `recovery.html` | `{{ if eq (print .Data.locale) "en" }}Reset your HAPPA password{{ else }}Cambia tu contraseña de HAPPA{{ end }}` |
| Security → Password changed (activarla) | `password_changed_notification.html` | `{{ if eq (print .Data.locale) "en" }}Your HAPPA password has changed{{ else }}Tu contraseña de HAPPA ha cambiado{{ end }}` |
| Security → Email address changed (activarla) | `email_changed_notification.html` | `{{ if eq (print .Data.locale) "en" }}Your HAPPA email has changed{{ else }}El correo de tu cuenta de HAPPA ha cambiado{{ end }}` |

Reglas:

- **Nada que escriba el usuario entra en un correo** (ni su nombre): cualquiera puede registrarse con el
  correo de otra persona, y así nadie puede usar HAPPA para mandarle textos suyos (phishing).
- Solo se usan `.RedirectTo`, `.TokenHash`, `.Email`, `.NewEmail`, `.OldEmail` y `.Data.locale`.
- Los enlaces son `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=…` y no `{{ .ConfirmationURL }}`:
  así funcionan aunque el correo se abra en otro dispositivo (ver `src/app/auth/confirm/route.ts`).
  `.RedirectTo` es la dirección que pide la app (`…/auth/confirm?next=…`), y Supabase solo la respeta si
  está en Authentication → URL Configuration → Redirect URLs (en la oficial: `https://happa.es/**`).
- Si cambias algo, compruébalo en local en los dos idiomas: regístrate en `/registro` y en `/en/registro`
  y abre los correos en http://127.0.0.1:54324.
