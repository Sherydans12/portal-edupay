import jsPDF from "jspdf";

const locale = "es-CL";

function formatToday() {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function safeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function generateCertificate(
  type: "ALUMNO_REGULAR" | "DEUDA_CERO",
  studentName: string,
  guardianRut: string,
  tenantName: string,
) {
  const doc = new jsPDF();
  const certificateName =
    type === "ALUMNO_REGULAR"
      ? "Certificado de Alumno Regular"
      : "Certificado de Deuda Cero";
  const body =
    type === "ALUMNO_REGULAR"
      ? `Por medio del presente, ${tenantName} certifica que ${studentName} se encuentra matriculado(a) y mantiene la calidad de alumno(a) regular en esta institucion.`
      : `Por medio del presente, ${tenantName} certifica que ${studentName} no registra deuda pendiente asociada a mensualidades en nuestros registros a la fecha de emision.`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(certificateName, 105, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(tenantName, 105, 38, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Fecha de emision: ${formatToday()}`, 20, 58);
  doc.text(`RUT apoderado: ${guardianRut}`, 20, 68);
  doc.text(`Alumno(a): ${studentName}`, 20, 78);

  const lines = doc.splitTextToSize(body, 170);
  doc.text(lines, 20, 100);

  doc.text(
    "Este documento se emite para los fines que el apoderado estime convenientes.",
    20,
    132,
  );

  doc.setFont("helvetica", "bold");
  doc.text(tenantName, 105, 170, { align: "center" });

  const fileName =
    type === "ALUMNO_REGULAR"
      ? "certificado_alumno_regular.pdf"
      : "certificado_deuda_cero.pdf";

  doc.save(fileName);
}

export function generateReceipt(
  amount: number,
  buyOrder: string,
  authorizationCode: string | null,
  paymentDate: string,
  isAuthorized: boolean,
) {
  const doc = new jsPDF();
  const issuedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(paymentDate));
  const authCode = authorizationCode ?? "No disponible";
  const primaryColor: [number, number, number] = isAuthorized
    ? [15, 118, 110]
    : [190, 18, 60];
  const statusBackground: [number, number, number] = isAuthorized
    ? [236, 253, 245]
    : [255, 241, 242];
  const statusBorder: [number, number, number] = isAuthorized
    ? [167, 243, 208]
    : [254, 205, 211];

  doc.setFillColor(...primaryColor);
  doc.roundedRect(15, 15, 180, 48, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("COLEGIO CONQUISTADORES", 25, 31);
  doc.setFontSize(22);
  doc.text("Comprobante de pago", 25, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Pago procesado mediante Webpay Plus", 25, 54);

  doc.setFillColor(...statusBackground);
  doc.setDrawColor(...statusBorder);
  doc.roundedRect(15, 72, 180, 25, 4, 4, "FD");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(isAuthorized ? "Pago autorizado" : "Pago no completado", 25, 83);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    isAuthorized
      ? "Transbank confirmó correctamente esta operación."
      : "Transbank no autorizó esta operación.",
    25,
    90,
  );

  const rows = [
    ["Fecha", issuedAt],
    ["Medio de pago", "Webpay Plus"],
    ["Orden de compra", buyOrder],
    ["Código de autorización", authCode],
  ];

  let y = 112;
  rows.forEach(([label, value]) => {
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, 20, y);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(value, 190, y, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, y + 6, 190, y + 6);
    y += 22;
  });

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, 202, 180, 35, 4, 4, "F");
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MONTO TOTAL", 25, 216);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.text(formatCurrency(amount), 185, 222, { align: "right" });

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Conserva este comprobante como respaldo de tu pago.",
    105,
    257,
    { align: "center" },
  );
  doc.text("Portal de Pagos - Colegio Conquistadores", 105, 264, {
    align: "center",
  });

  doc.save(`comprobante_pago_${safeFilePart(buyOrder)}.pdf`);
}
