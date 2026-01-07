import { PDFDocument } from "pdf-lib";
import certificate from "@/assets/certificate/certificate.pdf"

interface CertificatePayload {
  recipient_name: string;
  program_title: string;
  completion_date: string;
  certificate_id: string;
}

export async function generateCertificatePDF(data: CertificatePayload) {
  const templateBytes = await fetch(
    certificate
  ).then(res => res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(templateBytes);

  // ✅ Access form
  const form = pdfDoc.getForm();

  // ✅ Fill fields (TRUE replacement)
//   form.getTextField("recipient_name").setText(data.recipient_name);
//   form.getTextField("program_title").setText(data.program_title);
//   form.getTextField("completion_date").setText(data.completion_date);
  form.getTextField("certificate_id").setText(data.certificate_id);

  // ✅ Lock fields (optional but recommended)
  form.flatten();

  const pdfBytes = await pdfDoc.save();

  // Download
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.recipientFullName}-Certificate.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}