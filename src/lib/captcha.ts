// El código del captcha que manda el formulario (lo pone el componente Captcha). Las acciones del servidor
// se lo pasan a Supabase, que es quien lo comprueba con Cloudflare. Si el captcha está desactivado en
// Supabase, lo ignora.
export function captchaToken(formData: FormData): string | undefined {
  const value = formData.get("cf-turnstile-response");
  return typeof value === "string" && value ? value : undefined;
}
