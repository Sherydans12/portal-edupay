import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const locale = "es-CL";
const tenantPrimary: [number, number, number] = [26, 39, 121];
const tenantSecondary: [number, number, number] = [232, 176, 77];
const slate950: [number, number, number] = [15, 23, 42];
const slate600: [number, number, number] = [71, 85, 105];
const slate200: [number, number, number] = [226, 232, 240];
const logoPath = "/logo-conquistadores.png";

export type ReceiptPdfItem = {
  studentName: string;
  concept: string;
  month: string;
  amount: number;
};

export type ReceiptPdfDetails = {
  items?: ReceiptPdfItem[];
  cardLastFour?: string | null;
  installmentsNumber?: number | null;
};

let logoDataUrlPromise: Promise<string> | null = null;

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

function createDocumentId(
  type: "ALUMNO_REGULAR" | "DEUDA_CERO",
  studentName: string,
  guardianRut: string,
) {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const source = `${type}-${studentName}-${guardianRut}`;
  const checksum = Array.from(source).reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 100000,
    17,
  );

  return `CC-${datePart}-${String(checksum).padStart(5, "0")}`;
}

async function getInstitutionLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(logoPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo cargar el logo institucional.");
        }
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () =>
              reject(new Error("No se pudo preparar el logo institucional."));
            reader.readAsDataURL(blob);
          }),
      );
  }

  return logoDataUrlPromise;
}

function addInstitutionalHeader(
  doc: jsPDF,
  logoDataUrl: string,
  documentType: string,
  tenantName: string,
) {
  doc.setFillColor(...tenantPrimary);
  doc.rect(0, 0, 210, 38, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 6, 27, 26, 2, 2, "F");
  doc.addImage(logoDataUrl, "PNG", 15, 7, 21, 23, undefined, "FAST");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(tenantName, 46, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Aprender con alegría", 46, 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(documentType.toUpperCase(), 195, 19, { align: "right" });

  doc.setFillColor(...tenantSecondary);
  doc.rect(0, 38, 210, 2, "F");
}

function addDocumentFooter(doc: jsPDF, documentId: string) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...slate200);
    doc.line(15, 280, 195, 280);
    doc.setTextColor(...slate600);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Documento ${documentId}`, 15, 287);
    doc.text(`Página ${page} de ${pageCount}`, 195, 287, { align: "right" });
  }
}

export async function generateCertificate(
  type: "ALUMNO_REGULAR" | "DEUDA_CERO",
  studentName: string,
  studentCourse: string,
  guardianRut: string,
  tenantName: string,
) {
  const logoDataUrl = await getInstitutionLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const documentId = createDocumentId(type, studentName, guardianRut);
  const certificateName =
    type === "ALUMNO_REGULAR"
      ? "Certificado de Alumno Regular"
      : "Certificado de Deuda Cero";
  const body =
    type === "ALUMNO_REGULAR"
      ? `${tenantName} certifica que ${studentName}, estudiante de ${studentCourse}, se encuentra matriculado(a) y mantiene la calidad de alumno(a) regular en esta institución educacional a la fecha de emisión del presente documento.`
      : `${tenantName} certifica que ${studentName}, estudiante de ${studentCourse}, no registra mensualidades pendientes en los antecedentes disponibles en el Portal de Pagos a la fecha de emisión del presente documento.`;

  doc.setProperties({
    title: certificateName,
    subject: `Documento institucional de ${studentName}`,
    author: tenantName,
    creator: "Portal de Pagos Colegio Conquistadores",
  });
  addInstitutionalHeader(doc, logoDataUrl, "Certificado institucional", tenantName);

  doc.setTextColor(...tenantPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(certificateName, 105, 63, { align: "center" });

  doc.setTextColor(...slate600);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Identificador: ${documentId}`, 105, 71, { align: "center" });

  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(...slate200);
  doc.roundedRect(20, 84, 170, 43, 3, 3, "FD");

  const details = [
    ["Estudiante", studentName],
    ["Curso", studentCourse],
    ["RUT del apoderado", guardianRut],
    ["Fecha de emisión", formatToday()],
  ];

  details.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 29 + column * 84;
    const y = 96 + row * 18;

    doc.setTextColor(...slate600);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, y);
    doc.setTextColor(...slate950);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(value), x, y + 6);
  });

  doc.setTextColor(...slate950);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setLineHeightFactor(1.65);
  const bodyLines = doc.splitTextToSize(body, 158);
  doc.text(bodyLines, 26, 149);

  const purposeText =
    "El presente certificado se emite a solicitud del apoderado para los fines que estime convenientes.";
  doc.setFontSize(10);
  doc.setTextColor(...slate600);
  doc.text(doc.splitTextToSize(purposeText, 158), 26, 177);

  doc.setDrawColor(148, 163, 184);
  doc.line(64, 219, 146, 219);
  doc.setTextColor(...tenantPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Emitido digitalmente por", 105, 226, { align: "center" });
  doc.setFontSize(11);
  doc.text(tenantName, 105, 233, { align: "center" });

  doc.setFillColor(255, 250, 240);
  doc.setDrawColor(245, 216, 157);
  doc.roundedRect(32, 246, 146, 20, 3, 3, "FD");
  doc.setTextColor(120, 83, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    "Documento generado electrónicamente desde el Portal de Pagos institucional.",
    105,
    255,
    { align: "center" },
  );
  doc.text(`Conserva el identificador ${documentId} junto con este archivo.`, 105, 261, {
    align: "center",
  });

  addDocumentFooter(doc, documentId);

  const typePart =
    type === "ALUMNO_REGULAR" ? "alumno_regular" : "deuda_cero";
  doc.save(
    `certificado_${typePart}_${safeFilePart(studentName)}.pdf`,
  );
}

export async function generateReceipt(
  amount: number,
  buyOrder: string,
  authorizationCode: string | null,
  paymentDate: string,
  isAuthorized: boolean,
  details: ReceiptPdfDetails = {},
) {
  const logoDataUrl = await getInstitutionLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const issuedAt = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  }).format(new Date(paymentDate));
  const authCode = authorizationCode ?? "No disponible";
  const documentId = `PAGO-${safeFilePart(buyOrder).toUpperCase()}`;
  const statusColor: [number, number, number] = isAuthorized
    ? [4, 120, 87]
    : [190, 18, 60];
  const statusBackground: [number, number, number] = isAuthorized
    ? [236, 253, 245]
    : [255, 241, 242];
  const statusBorder: [number, number, number] = isAuthorized
    ? [167, 243, 208]
    : [254, 205, 211];
  const items =
    details.items && details.items.length > 0
      ? details.items
      : [
          {
            studentName: "Detalle no disponible",
            concept: "Pago de mensualidad",
            month: "-",
            amount,
          },
        ];

  doc.setProperties({
    title: `Comprobante de pago ${buyOrder}`,
    subject: "Respaldo de pago procesado mediante Webpay Plus",
    author: "Colegio Conquistadores",
    creator: "Portal de Pagos Colegio Conquistadores",
  });
  addInstitutionalHeader(
    doc,
    logoDataUrl,
    "Comprobante de pago",
    "Colegio Conquistadores",
  );

  doc.setFillColor(...statusBackground);
  doc.setDrawColor(...statusBorder);
  doc.roundedRect(15, 50, 180, 27, 3, 3, "FD");
  doc.setTextColor(...statusColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(isAuthorized ? "Pago autorizado" : "Pago no completado", 24, 61);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    isAuthorized
      ? "Transbank confirmó correctamente esta operación."
      : "Transbank no autorizó esta operación.",
    24,
    68,
  );

  const cardLabel = details.cardLastFour
    ? `**** ${details.cardLastFour}`
    : "No disponible";
  const cardInstallments =
    details.installmentsNumber === null ||
    details.installmentsNumber === undefined
      ? "No disponible"
      : details.installmentsNumber > 0
        ? `${details.installmentsNumber} ${
            details.installmentsNumber === 1 ? "cuota" : "cuotas"
          }`
        : "Sin cuotas";
  const rows = [
    ["Fecha y hora", issuedAt],
    ["Medio de pago", "Webpay Plus"],
    ["Últimos 4 dígitos", cardLabel],
    ["Orden de compra", buyOrder],
    ["Código de autorización", authCode],
    ["Cuotas de la tarjeta", cardInstallments],
  ];

  rows.forEach(([label, value], index) => {
    const column = index < 3 ? 0 : 1;
    const row = index % 3;
    const x = column === 0 ? 20 : 109;
    const y = 93 + row * 18;

    doc.setTextColor(...slate600);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, y);
    doc.setTextColor(...slate950);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(String(value), x, y + 6, { maxWidth: 78 });
  });

  doc.setDrawColor(...slate200);
  doc.line(105, 86, 105, 137);

  doc.setTextColor(...tenantPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Detalle del pago", 15, 151);
  doc.setTextColor(...slate600);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Cuotas incluidas en esta operación.", 15, 158);

  autoTable(doc, {
    startY: 164,
    margin: { top: 50, left: 15, right: 15, bottom: 36 },
    head: [["Estudiante", "Concepto", "Mes", "Monto"]],
    body: items.map((item) => [
      item.studentName,
      item.concept,
      item.month,
      formatCurrency(item.amount),
    ]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: slate600,
      cellPadding: 3.5,
      lineColor: slate200,
      lineWidth: { bottom: 0.2 },
    },
    headStyles: {
      fillColor: [244, 246, 251],
      textColor: tenantPrimary,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50, textColor: slate950, fontStyle: "bold" },
      1: { cellWidth: 52 },
      2: { cellWidth: 38 },
      3: { cellWidth: 40, halign: "right", textColor: slate950, fontStyle: "bold" },
    },
    willDrawPage: () => {
      addInstitutionalHeader(
        doc,
        logoDataUrl,
        "Comprobante de pago",
        "Colegio Conquistadores",
      );
    },
  });

  const lastTableY =
    (
      doc as jsPDF & {
        lastAutoTable?: { finalY?: number };
      }
    ).lastAutoTable?.finalY ?? 190;
  let totalY = Math.max(lastTableY + 10, 205);

  if (totalY > 238) {
    doc.addPage();
    addInstitutionalHeader(
      doc,
      logoDataUrl,
      "Comprobante de pago",
      "Colegio Conquistadores",
    );
    totalY = 55;
  }

  doc.setFillColor(244, 246, 251);
  doc.roundedRect(15, totalY, 180, 27, 3, 3, "F");
  doc.setTextColor(...slate600);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MONTO TOTAL", 24, totalY + 11);
  doc.setTextColor(...tenantPrimary);
  doc.setFontSize(20);
  doc.text(formatCurrency(amount), 186, totalY + 17, { align: "right" });

  const disclaimerY = totalY + 39;
  doc.setTextColor(...slate600);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    "Este comprobante respalda la operación electrónica y no reemplaza la documentación tributaria que corresponda.",
    105,
    disclaimerY,
    { align: "center", maxWidth: 170 },
  );

  addDocumentFooter(doc, documentId);
  doc.save(`comprobante_pago_${safeFilePart(buyOrder)}.pdf`);
}
