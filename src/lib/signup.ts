// Registro cerrado mientras la web es una demo (hasta tener listos los términos y condiciones).
// Está cerrado por defecto: para abrirlo hay que poner NEXT_PUBLIC_SIGNUP_OPEN=true en las variables de
// Vercel (y en .env.local para probarlo en local) y volver a desplegar. Al revés sería peligroso: si un
// día faltara la variable, el registro se abriría solo.
// Esto solo cambia lo que enseña la web: lo que de verdad impide crear cuentas (también con Google) es
// tener apagado "Allow new users to sign up" en Supabase → Authentication.
export const SIGNUP_CLOSED = process.env.NEXT_PUBLIC_SIGNUP_OPEN !== "true";
