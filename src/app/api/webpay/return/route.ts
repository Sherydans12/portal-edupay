import { NextRequest, NextResponse } from "next/server";
import { syncPaymentWithEduPay } from "@/lib/edupay";
import { sendPaymentReceiptEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { webpayTransaction } from "@/lib/transbank";

export async function GET(request: NextRequest) {
  const tokenWs = request.nextUrl.searchParams.get("token_ws");
  const voucherUrl = new URL("/voucher", request.nextUrl.origin);

  if (!tokenWs) {
    voucherUrl.searchParams.set("status", "cancelled");
    return NextResponse.redirect(voucherUrl);
  }

  voucherUrl.searchParams.set("token_ws", tokenWs);

  try {
    const response = await webpayTransaction.commit(tokenWs);
    const isAuthorized =
      response.response_code === 0 && response.status === "AUTHORIZED";
    const transaction = await prisma.transaction.findUnique({
      where: { tokenWs },
      include: { guardian: true },
    });

    if (!transaction) {
      return NextResponse.redirect(voucherUrl);
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { tokenWs },
      data: {
        status: isAuthorized ? "AUTHORIZED" : "REJECTED",
        edupaySynced: isAuthorized ? false : undefined,
        authorizationCode: response.authorization_code
          ? String(response.authorization_code)
          : null,
      },
      include: { guardian: true },
    });

    if (isAuthorized) {
      const installmentsIds = Array.isArray(updatedTransaction.edupayPayload)
        ? updatedTransaction.edupayPayload.map(Number)
        : [];

      if (
        installmentsIds.length > 0 &&
        installmentsIds.every((id) => Number.isInteger(id))
      ) {
        try {
          const syncResponse = await syncPaymentWithEduPay(
            updatedTransaction.buyOrder,
            updatedTransaction.amount,
            updatedTransaction.updatedAt.toISOString(),
            installmentsIds,
            updatedTransaction.tenantId,
          );

          if (syncResponse.synced) {
            await prisma.transaction.update({
              where: { buyOrder: updatedTransaction.buyOrder },
              data: { edupaySynced: true },
            });
          }
        } catch (error) {
          console.error("No se pudo sincronizar el pago con EduPay", error);
        }
      } else {
        console.error(
          "La transacción autorizada no contiene IDs de cuotas válidos",
          updatedTransaction.buyOrder,
        );
      }

      if (updatedTransaction.guardian.email) {
        try {
          await sendPaymentReceiptEmail(
            updatedTransaction.guardian.email,
            updatedTransaction,
          );
        } catch (error) {
          console.error("No se pudo enviar el comprobante por correo", error);
        }
      }
    }
  } catch {
    await prisma.transaction.updateMany({
      where: { tokenWs },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.redirect(voucherUrl);
}
