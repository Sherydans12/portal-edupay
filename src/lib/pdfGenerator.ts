import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  paymentId: string,
  amount: number,
  date: string,
  studentName: string,
  tenantName: string,
) {
  const doc = new jsPDF();
  const issuedAt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Comprobante de Pago", 105, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(tenantName, 105, 38, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Orden de pago: ${paymentId}`, 20, 58);
  doc.text(`Fecha de pago: ${issuedAt}`, 20, 68);
  doc.text(`Alumno(a): ${studentName}`, 20, 78);

  autoTable(doc, {
    startY: 94,
    head: [["Concepto", "Monto"]],
    body: [["Pago de mensualidad", formatCurrency(amount)]],
    foot: [["Total pagado", formatCurrency(amount)]],
    theme: "grid",
    headStyles: { fillColor: [27, 94, 124] },
    footStyles: { fillColor: [240, 249, 255], textColor: [15, 23, 42] },
  });

  doc.text(
    "Gracias por mantener sus pagos al dia. Conserve este comprobante como respaldo.",
    20,
    145,
  );

  doc.save(`comprobante_pago_${safeFilePart(paymentId)}.pdf`);
}
