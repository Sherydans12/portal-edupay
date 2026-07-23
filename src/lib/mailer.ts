import { Resend } from "resend";
import {
  EmailStatus,
  EmailType,
  type Transaction,
} from "@prisma/client";
import prisma from "@/lib/prisma";

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_EMAIL_FROM =
  "Soporte Colegio Conquistadores <soporte@edupay.cl>";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(date);

type SendEmailInput = {
  tenantId: string;
  to: string;
  subject: string;
  type: EmailType;
  html: string;
  simulationMessage: string;
  failureMessage: string;
};

async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn(`[EMAIL CONSOLE MODE] ${input.simulationMessage}`);
    await createEmailLog(input, EmailStatus.SIMULATED);

    return { ok: true, status: EmailStatus.SIMULATED };
  }

  const resend = new Resend(apiKey);
  let sendError: Error | null = null;

  try {
    const result = await resend.emails.send({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (result.error) {
      sendError = new Error(result.error.message);
    }
  } catch (error) {
    sendError = normalizeError(error);
  }

  if (sendError) {
    const failure = new Error(`${input.failureMessage}: ${sendError.message}`);
    await createEmailLog(input, EmailStatus.FAILED, failure.message);
    throw failure;
  }

  await createEmailLog(input, EmailStatus.SENT);
  return { ok: true, status: EmailStatus.SENT };
}

function createEmailLog(
  input: SendEmailInput,
  status: EmailStatus,
  error?: string,
) {
  return prisma.emailLog.create({
    data: {
      tenantId: input.tenantId,
      to: input.to,
      subject: input.subject,
      type: input.type,
      status,
      error,
    },
  });
}

function getEmailFrom() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    DEFAULT_EMAIL_FROM
  );
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export async function sendPasswordResetEmail(
  tenantId: string,
  email: string,
  token: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
  const resetUrl = new URL("/reset-password", appUrl);
  resetUrl.searchParams.set("token", token);
  const subject = "Restablece tu contraseña";

  return sendEmail({
    tenantId,
    to: email,
    subject,
    type: EmailType.FORGOT_PASSWORD,
    simulationMessage: `Simulando envío de recuperación a ${email}. URL mágica: ${resetUrl.toString()}`,
    failureMessage: "No fue posible enviar el correo de recuperación",
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
}

export async function sendPaymentReceiptEmail(
  email: string,
  tx: Transaction,
) {
  const authorizationCode = tx.authorizationCode ?? "No disponible";
  const amount = formatCurrency(tx.amount);
  const paymentDate = formatDate(tx.updatedAt);
  const subject = `Pago aprobado - ${tx.buyOrder}`;

  return sendEmail({
    tenantId: tx.tenantId,
    to: email,
    subject,
    type: EmailType.PAYMENT_RECEIPT,
    simulationMessage: `Comprobante de pago para ${email}: ${tx.buyOrder}, ${amount}, autorización ${authorizationCode}, fecha ${paymentDate}`,
    failureMessage: "No fue posible enviar el comprobante de pago",
    html: `
      <div style="margin: 0; padding: 32px 16px; background: #f1f5f9; font-family: Arial, sans-serif; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
          <div style="padding: 28px 32px; background: #0f766e; color: #ffffff;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; opacity: 0.8;">Colegio Conquistadores</p>
            <h1 style="margin: 0; font-size: 26px; line-height: 1.25;">Pago recibido exitosamente</h1>
          </div>
          <div style="padding: 32px;">
            <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #a7f3d0; border-radius: 12px; background: #ecfdf5; color: #047857;">
              <strong>Transbank autorizó tu pago.</strong><br />
              El comprobante queda registrado en el Portal de Pagos.
            </div>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Monto</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Orden de compra</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${tx.buyOrder}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Código de autorización</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${authorizationCode}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #64748b;">Fecha</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #0f172a;">${paymentDate}</td>
              </tr>
            </table>
            <p style="margin: 28px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
              Conserva este correo como respaldo de la operación. También puedes consultar y descargar el comprobante desde el portal.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
