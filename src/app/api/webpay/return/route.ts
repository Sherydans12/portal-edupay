import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/app-url";
import { getEdupayTenantId, syncPaymentWithEduPay } from "@/lib/edupay";
import { sendPaymentReceiptEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { webpayTransaction } from "@/lib/transbank";

type WebpayCallbackParams = {
  tokenWs: string | null;
  tbkToken: string | null;
  tbkBuyOrder: string | null;
};

type WebpayCommitResponse = {
  amount?: number;
  authorization_code?: string | number;
  buy_order?: string;
  card_detail?: { card_number?: string };
  installments_number?: number;
  payment_type_code?: string;
  response_code?: number;
  status?: string;
  transaction_date?: string;
};

export async function GET(request: NextRequest) {
  return handleCallback(request, readSearchParams(request.nextUrl.searchParams));
}

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectToVoucher(getPublicAppUrl(request), "timeout");
  }

  return handleCallback(request, {
    tokenWs: formValue(formData, "token_ws"),
    tbkToken: formValue(formData, "TBK_TOKEN"),
    tbkBuyOrder: formValue(formData, "TBK_ORDEN_COMPRA"),
  });
}

async function handleCallback(
  request: NextRequest,
  params: WebpayCallbackParams,
) {
  const publicAppUrl = getPublicAppUrl(request);

  if (!params.tokenWs) {
    const status = params.tbkToken ? "cancelled" : "timeout";
    return redirectToVoucher(publicAppUrl, status);
  }

  const tokenWs = params.tokenWs;
  const tenantId = getEdupayTenantId();
  const voucherUrl = new URL("/voucher", publicAppUrl);
  voucherUrl.searchParams.set("token_ws", tokenWs);

  let localTransaction = await prisma.transaction.findFirst({
    where: { tokenWs, tenantId },
    include: { guardian: true },
  });

  if (!localTransaction) {
    voucherUrl.searchParams.set("status", "not_found");
    return NextResponse.redirect(voucherUrl, 303);
  }

  // A repeated browser callback must return the already-created receipt without
  // asking Transbank to commit the same token a second time.
  if (localTransaction.status === "AUTHORIZED") {
    return NextResponse.redirect(voucherUrl, 303);
  }

  let response: WebpayCommitResponse;

  try {
    response = (await webpayTransaction.commit(tokenWs)) as WebpayCommitResponse;
  } catch (error) {
    localTransaction = await prisma.transaction.findFirst({
      where: { tokenWs, tenantId },
      include: { guardian: true },
    });

    if (localTransaction?.status === "AUTHORIZED") {
      return NextResponse.redirect(voucherUrl, 303);
    }

    if (!localTransaction) {
      voucherUrl.searchParams.set("status", "not_found");
      return NextResponse.redirect(voucherUrl, 303);
    }

    if (isAlreadyCommittedError(error)) {
      try {
        response = (await webpayTransaction.status(tokenWs)) as WebpayCommitResponse;
      } catch (statusError) {
        console.error("No se pudo recuperar una transacción ya confirmada", statusError);
        voucherUrl.searchParams.set("status", "processing");
        return NextResponse.redirect(voucherUrl, 303);
      }
    } else {
      console.error("Falló el commit de Webpay", error);
      await prisma.transaction.updateMany({
        where: { tokenWs, tenantId, status: { not: "AUTHORIZED" } },
        data: { status: "FAILED" },
      });
      return NextResponse.redirect(voucherUrl, 303);
    }
  }

  const isAuthorized =
    response.response_code === 0 && response.status === "AUTHORIZED";
  const responseMatchesLocalTransaction =
    (!response.buy_order || response.buy_order === localTransaction.buyOrder) &&
    (response.amount === undefined || response.amount === localTransaction.amount);

  if (isAuthorized && !responseMatchesLocalTransaction) {
    console.error("La respuesta de Webpay no coincide con la intención local", {
      tokenWs,
      tenantId,
      expectedBuyOrder: localTransaction.buyOrder,
      receivedBuyOrder: response.buy_order,
      expectedAmount: localTransaction.amount,
      receivedAmount: response.amount,
    });
    await prisma.transaction.updateMany({
      where: { tokenWs, tenantId, status: { not: "AUTHORIZED" } },
      data: { status: "FAILED" },
    });
    return NextResponse.redirect(voucherUrl, 303);
  }

  const cardLastFour = normalizeCardLastFour(response.card_detail?.card_number);
  const transactionDate = parseTransactionDate(response.transaction_date);

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findFirst({
      where: { tokenWs, tenantId },
      include: { guardian: true },
    });

    if (!current || current.status === "AUTHORIZED") {
      return { transaction: current, becameAuthorized: false };
    }

    const transaction = await tx.transaction.update({
      where: { id: current.id },
      data: {
        status: isAuthorized ? "AUTHORIZED" : "REJECTED",
        edupaySynced: isAuthorized ? false : current.edupaySynced,
        authorizationCode: response.authorization_code
          ? String(response.authorization_code)
          : null,
        cardLastFour,
        paymentTypeCode: response.payment_type_code ?? null,
        installmentsNumber: response.installments_number ?? null,
        transactionDate,
      },
      include: { guardian: true },
    });

    return { transaction, becameAuthorized: isAuthorized };
  });

  const updatedTransaction = result.transaction;

  if (updatedTransaction && result.becameAuthorized) {
    const chargeIds = parseChargeIds(updatedTransaction.edupayPayload);

    if (chargeIds.length > 0) {
      try {
        const syncResponse = await syncPaymentWithEduPay(
          {
            buyOrder: updatedTransaction.buyOrder,
            amount: updatedTransaction.amount,
            authorizationCode: response.authorization_code,
            cardNumber: response.card_detail?.card_number,
            chargeIds,
          },
          tenantId,
        );

        if (syncResponse.synced) {
          await prisma.transaction.updateMany({
            where: {
              id: updatedTransaction.id,
              tenantId,
              status: "AUTHORIZED",
            },
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

  return NextResponse.redirect(voucherUrl, 303);
}

function readSearchParams(params: URLSearchParams): WebpayCallbackParams {
  return {
    tokenWs: params.get("token_ws"),
    tbkToken: params.get("TBK_TOKEN"),
    tbkBuyOrder: params.get("TBK_ORDEN_COMPRA"),
  };
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function redirectToVoucher(publicAppUrl: string, status: string) {
  const voucherUrl = new URL("/voucher", publicAppUrl);
  voucherUrl.searchParams.set("status", status);
  return NextResponse.redirect(voucherUrl, 303);
}

function isAlreadyCommittedError(error: unknown) {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message} ${JSON.stringify(error)}`
      : String(error);

  return /already\s+(?:been\s+)?committed|transaction\s+already\s+committed|ya\s+(?:fue\s+)?confirmad[ao]/i.test(
    message,
  );
}

function normalizeCardLastFour(cardNumber: unknown) {
  if (typeof cardNumber !== "string" && typeof cardNumber !== "number") {
    return null;
  }

  const digits = String(cardNumber).replace(/\D/g, "");
  return digits ? digits.slice(-4) : null;
}

function parseTransactionDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseChargeIds(payload: unknown) {
  if (!Array.isArray(payload)) {
    return [];
  }

  const chargeIds = payload.map((id) => Number(id));
  return chargeIds.length > 0 &&
    chargeIds.every(
      (id) => typeof id === "number" && Number.isInteger(id),
    )
    ? chargeIds
    : [];
}
