import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { applyPortalEnv } from "./support/env";

type InitWebpayPayload = {
  amount: number;
  sessionId: string;
  edupayPayload: number[];
  receiptItems: Array<{
    installmentId: number;
    studentName: string;
    concept: string;
    month: string;
    amount: number;
  }>;
};

applyPortalEnv();

const prisma = new PrismaClient();
const tenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? "colegio-pruebas";
const guardianRut = "12.345.678-9";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("Un apoderado inicia sesion, selecciona una cuota y paga con Webpay", async ({
  page,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("baseURL no esta configurada en Playwright.");
  }

  const tokenWs = `e2e-token-${Date.now()}`;
  const buyOrder = `E2E-WEBPAY-${Date.now()}`;
  let initRequestPayload: InitWebpayPayload | null = null;

  await prisma.transaction.deleteMany({
    where: {
      OR: [{ tokenWs }, { buyOrder }, { buyOrder: { startsWith: "E2E-WEBPAY-" } }],
    },
  });

  await page.route("**/api/webpay/init", async (route) => {
    const payload = JSON.parse(route.request().postData() ?? "{}") as InitWebpayPayload;

    expect(payload.amount).toBeGreaterThan(0);
    expect(payload.sessionId).toMatch(/^portal-multi-/);
    expect(payload.edupayPayload.length).toBeGreaterThan(0);
    expect(payload.edupayPayload.every(Number.isInteger)).toBe(true);
    expect(payload.receiptItems).toHaveLength(payload.edupayPayload.length);
    expect(
      payload.receiptItems.reduce((total, item) => total + item.amount, 0),
    ).toBe(payload.amount);

    const guardian = await prisma.guardianUser.findFirstOrThrow({
      where: {
        tenantId,
        rut: guardianRut,
      },
    });

    await prisma.transaction.create({
      data: {
        tenantId,
        guardianId: guardian.id,
        buyOrder,
        sessionId: payload.sessionId,
        tokenWs,
        amount: payload.amount,
        status: "AUTHORIZED",
        authorizationCode: "E2E-AUTH",
        edupayPayload: payload.edupayPayload,
        receiptItems: payload.receiptItems,
        edupaySynced: true,
      },
    });

    initRequestPayload = payload;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "https://webpay.e2e.test/webpay-plus",
        token_ws: tokenWs,
      }),
    });
  });

  await page.route("https://webpay.e2e.test/**", async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        location: `${baseURL}/api/webpay/return?token_ws=${tokenWs}`,
      },
    });
  });

  await page.route("**/api/webpay/return**", async (route) => {
    const url = new URL(route.request().url());

    expect(url.searchParams.get("token_ws")).toBe(tokenWs);

    await route.fulfill({
      status: 302,
      headers: {
        location: `${baseURL}/voucher?token_ws=${tokenWs}`,
      },
    });
  });

  await page.goto("/login");
  await page
    .getByPlaceholder("12.345.678-9 o nombre@empresa.cl")
    .fill(guardianRut);
  await page.getByPlaceholder("Tu contraseña").fill("demo123");

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/"),
    page.getByRole("button", { name: "Entrar al portal" }).click(),
  ]);

  await expect(
    page.getByRole("heading", { name: /Estado de Cuenta Familiar/i }),
  ).toBeVisible();

  const pendingInstallment = page
    .locator("label")
    .filter({ hasText: "PENDIENTE" })
    .filter({ has: page.locator('input[type="checkbox"]:not(:disabled)') })
    .first();

  await expect(pendingInstallment).toBeVisible();
  await pendingInstallment.locator('input[type="checkbox"]').first().check();

  await expect(page.getByRole("button", { name: "Pagar con Webpay" })).toBeVisible();
  await page.getByRole("button", { name: "Pagar con Webpay" }).click();

  await expect(page).toHaveURL(new RegExp(`/voucher\\?token_ws=${tokenWs}$`));
  await expect(page.getByRole("heading", { name: /Pago aprobado/i })).toBeVisible();
  await expect(page.getByText("E2E-AUTH")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Imprimir / Guardar Comprobante" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cuotas pagadas" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Alumno" })).toBeVisible();
  expect(initRequestPayload).not.toBeNull();
});
