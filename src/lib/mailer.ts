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
const SUPPORT_EMAIL = "soporte@edupay.cl";
const EMAIL_ADDRESS_PATTERN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

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
    await createEmailLog(input, EmailStatus.SIMULATED, input.simulationMessage);

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
      error: error ? redactSensitiveValues(error) : undefined,
      body:
        status === EmailStatus.SENT
          ? undefined
          : redactSensitiveValues(input.html),
    },
  });
}

function getEmailFrom() {
  const configuredFrom =
    process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim();

  if (!configuredFrom) {
    return DEFAULT_EMAIL_FROM;
  }

  const simpleEmail = configuredFrom.trim();
  if (EMAIL_ADDRESS_PATTERN.test(simpleEmail)) {
    return simpleEmail;
  }

  const rfcMatch = configuredFrom.match(/^(.+?)\s*<([^<>]+)>$/);
  if (rfcMatch) {
    const displayName = rfcMatch[1]
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .replace(/\s+/g, " ");
    const emailAddress = rfcMatch[2].trim();

    if (EMAIL_ADDRESS_PATTERN.test(emailAddress)) {
      return displayName
        ? `${displayName} <${emailAddress}>`
        : emailAddress;
    }
  }

  console.warn(
    "RESEND_FROM_EMAIL/EMAIL_FROM no tiene un formato válido; se usará el remitente por defecto.",
  );
  return DEFAULT_EMAIL_FROM;
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
  const safeResetUrl = htmlEscape(resetUrl.toString());
  const subject = "Restablece tu contraseña";

  return sendEmail({
    tenantId,
    to: email,
    subject,
    type: EmailType.FORGOT_PASSWORD,
    simulationMessage: `Simulando envío de recuperación a ${email}. URL mágica: ${resetUrl.toString()}`,
    failureMessage: "No fue posible enviar el correo de recuperación",
    html: `
      <div style="margin:0;padding:32px 16px;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;color:#153243;line-height:1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
              <tr><td style="padding:30px 32px;background:#123b4a;color:#ffffff;">
                <div style="font-size:24px;font-weight:800;letter-spacing:-.5px;">Edu<span style="color:#8bd3c7;">Pay</span></div>
                <div style="margin-top:5px;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#b7d5d2;">Portal de pagos</div>
              </td></tr>
              <tr><td style="padding:36px 32px 24px;">
                <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#e7f7f3;color:#087f70;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;">Seguridad de tu cuenta</div>
                <h1 style="margin:18px 0 10px;color:#102a36;font-size:28px;line-height:1.2;">Restablece tu contraseña</h1>
                <p style="margin:0;color:#52636d;font-size:16px;line-height:1.7;">Recibimos una solicitud para crear una nueva contraseña para tu cuenta del portal de pagos.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border-collapse:collapse;"><tr><td align="center">
                  <a href="${safeResetUrl}" style="display:inline-block;padding:15px 26px;border-radius:10px;background:#0f8b7a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;">Restablecer contraseña</a>
                </td></tr></table>
                <div style="padding:14px 16px;border:1px solid #f5d58b;border-radius:10px;background:#fff9e9;color:#7b5b13;font-size:14px;line-height:1.6;"><strong>Este enlace expira en 1 hora.</strong> Por seguridad, úsalo solo si tú solicitaste este cambio.</div>
                <p style="margin:24px 0 8px;color:#52636d;font-size:14px;">Si el botón no funciona, copia y pega este enlace:</p>
                <p style="margin:0;word-break:break-all;color:#0f8b7a;font-size:13px;">${safeResetUrl}</p>
                <p style="margin:24px 0 0;color:#7b8a92;font-size:14px;line-height:1.6;">Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña actual seguirá siendo válida.</p>
              </td></tr>
              <tr><td style="padding:20px 32px 28px;border-top:1px solid #edf1f3;color:#7b8a92;font-size:12px;line-height:1.6;">Este correo fue enviado automáticamente por EduPay. Si necesitas ayuda, escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color:#0f8b7a;text-decoration:none;">${SUPPORT_EMAIL}</a>.</td></tr>
            </table>
          </td></tr>
        </table>
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
  const receiptItems = parseReceiptItems(tx.receiptItems);
  const receiptRows = receiptItems.length
    ? receiptItems
        .map(
          (item) => `
            <tr>
              <td style="padding:14px 10px 14px 0;border-bottom:1px solid #edf1f3;color:#29434e;font-size:14px;vertical-align:top;">${htmlEscape(item.studentName)}</td>
              <td style="padding:14px 10px;border-bottom:1px solid #edf1f3;color:#52636d;font-size:14px;vertical-align:top;"><strong style="color:#29434e;">${htmlEscape(item.concept)}</strong><br /><span style="font-size:12px;color:#82919a;">${htmlEscape(item.month)}</span></td>
              <td style="padding:14px 0 14px 10px;border-bottom:1px solid #edf1f3;text-align:right;color:#153243;font-size:14px;font-weight:700;vertical-align:top;white-space:nowrap;">${formatCurrency(item.amount)}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" style="padding:16px 0;color:#64748b;font-size:14px;">Detalle de cuotas disponible en el Portal de Pagos.</td></tr>`;
  const subject = `Pago aprobado - ${tx.buyOrder}`;

  return sendEmail({
    tenantId: tx.tenantId,
    to: email,
    subject,
    type: EmailType.PAYMENT_RECEIPT,
    simulationMessage: `Comprobante de pago para ${email}: ${tx.buyOrder}, ${amount}, autorización ${authorizationCode}, fecha ${paymentDate}`,
    failureMessage: "No fue posible enviar el comprobante de pago",
    html: `
      <div style="margin:0;padding:32px 16px;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif;color:#153243;line-height:1.5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
            <tr><td style="padding:30px 32px;background:#123b4a;color:#ffffff;">
              <div style="font-size:24px;font-weight:800;letter-spacing:-.5px;">Edu<span style="color:#8bd3c7;">Pay</span></div>
              <div style="margin-top:5px;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#b7d5d2;">Colegio Conquistadores · Comprobante de pago</div>
            </td></tr>
            <tr><td style="padding:34px 32px 18px;">
              <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#e7f7f3;color:#087f70;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;">Pago autorizado</div>
              <h1 style="margin:18px 0 10px;color:#102a36;font-size:28px;line-height:1.2;">¡Gracias por tu pago!</h1>
              <p style="margin:0;color:#52636d;font-size:16px;line-height:1.7;">Transbank autorizó correctamente tu operación. Guarda este correo como respaldo de tu pago.</p>
            </td></tr>
            <tr><td style="padding:0 32px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
              <td style="width:50%;padding:20px 16px;border:1px solid #c7ebe4;border-radius:12px 0 0 12px;background:#eefaf7;"><div style="font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#478b83;">Monto total</div><div style="margin-top:6px;color:#0b6f64;font-size:28px;font-weight:800;">${amount}</div></td>
              <td style="width:50%;padding:20px 16px;border:1px solid #c7ebe4;border-left:0;border-radius:0 12px 12px 0;background:#eefaf7;"><div style="font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#478b83;">Orden de compra</div><div style="margin-top:8px;color:#153243;font-size:16px;font-weight:800;word-break:break-word;">${htmlEscape(tx.buyOrder)}</div><div style="margin-top:5px;color:#52636d;font-size:12px;">Autorización: ${htmlEscape(authorizationCode)}</div></td>
            </tr></table></td></tr>
            <tr><td style="padding:0 32px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:12px 0;border-bottom:1px solid #edf1f3;color:#82919a;font-size:13px;">Fecha de operación</td><td style="padding:12px 0;border-bottom:1px solid #edf1f3;text-align:right;color:#29434e;font-size:13px;font-weight:700;">${htmlEscape(paymentDate)}</td></tr><tr><td style="padding:12px 0;color:#82919a;font-size:13px;">Código de autorización</td><td style="padding:12px 0;text-align:right;color:#29434e;font-size:13px;font-weight:700;">${htmlEscape(authorizationCode)}</td></tr></table></td></tr>
            <tr><td style="padding:0 32px 30px;"><h2 style="margin:0 0 12px;color:#153243;font-size:17px;">Detalle de cuotas canceladas</h2><table class="receipt-items" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><thead><tr><th align="left" style="padding:10px 10px 10px 0;border-bottom:2px solid #dce8e8;color:#82919a;font-size:11px;letter-spacing:.8px;text-transform:uppercase;">Alumno beneficiario</th><th align="left" style="padding:10px;border-bottom:2px solid #dce8e8;color:#82919a;font-size:11px;letter-spacing:.8px;text-transform:uppercase;">Concepto</th><th align="right" style="padding:10px 0;border-bottom:2px solid #dce8e8;color:#82919a;font-size:11px;letter-spacing:.8px;text-transform:uppercase;">Monto</th></tr></thead><tbody>${receiptRows}</tbody></table></td></tr>
            <tr><td style="padding:20px 32px 28px;border-top:1px solid #edf1f3;color:#7b8a92;font-size:12px;line-height:1.7;">Este comprobante es un respaldo de la operación electrónica y no reemplaza la documentación tributaria que corresponda. Puedes consultar tus pagos en el Portal de Pagos. Para soporte, escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color:#0f8b7a;text-decoration:none;">${SUPPORT_EMAIL}</a>.</td></tr>
          </table>
        </td></tr></table>
      </div>
    `,
  });
}

type ReceiptEmailItem = {
  studentName: string;
  concept: string;
  month: string;
  amount: number;
};

function parseReceiptItems(value: unknown): ReceiptEmailItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const studentName = cleanReceiptText(record.studentName);
    const concept = cleanReceiptText(record.concept);
    const month = cleanReceiptText(record.month);
    const amount = Number(record.amount);

    if (!studentName || !concept || !month || !Number.isInteger(amount) || amount <= 0) {
      return [];
    }

    return [{ studentName, concept, month, amount }];
  });
}

function cleanReceiptText(value: unknown) {
  return typeof value === "string" && value.trim().length <= 120
    ? value.trim()
    : "";
}

function htmlEscape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function redactSensitiveValues(value: string) {
  return value.replace(/([?&]token=)[^&\s<"]+/gi, "$1[redacted]");
}
