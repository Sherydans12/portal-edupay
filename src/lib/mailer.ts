import { Resend } from "resend";

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_EMAIL_FROM =
  "Soporte Colegio Conquistadores <soporte@edupay.cl>";

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
  const resetUrl = new URL("/reset-password", appUrl);
  resetUrl.searchParams.set("token", token);

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[EMAIL CONSOLE MODE] Simulando envío de recuperación a ${email}. URL mágica: ${resetUrl.toString()}`,
    );

    return { ok: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM,
    to: email,
    subject: "Restablece tu contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Restablece tu contraseña</h1>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta del portal de pagos.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl.toString()}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700; display: inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #0f766e;">${resetUrl.toString()}</p>
        <p style="color: #64748b; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`No fue posible enviar el correo de recuperación: ${error.message}`);
  }

  return { ok: true };
}
