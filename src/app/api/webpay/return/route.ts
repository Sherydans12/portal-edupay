import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { webpayTransaction } from "@/lib/transbank";

export async function GET(request: NextRequest) {
  const tokenWs = request.nextUrl.searchParams.get("token_ws");
  const voucherUrl = new URL("/voucher", request.nextUrl.origin);

  if (!tokenWs) {
    voucherUrl.searchParams.set("status", "cancelled");
    return NextResponse.redirect(voucherUrl);
  }

  voucherUrl.searchParams.set("token", tokenWs);

  try {
    const response = await webpayTransaction.commit(tokenWs);
    const isAuthorized = response.response_code === 0;

    await prisma.transaction.updateMany({
      where: { tokenWs },
      data: {
        status: isAuthorized ? "AUTHORIZED" : "REJECTED",
        authorizationCode: response.authorization_code
          ? String(response.authorization_code)
          : null,
      },
    });
  } catch {
    await prisma.transaction.updateMany({
      where: { tokenWs },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.redirect(voucherUrl);
}
