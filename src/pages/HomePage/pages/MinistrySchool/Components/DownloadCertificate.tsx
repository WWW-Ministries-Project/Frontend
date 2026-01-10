import { generateCertificatePDF } from "@/pages/MembersPage/Component/generateCertificate";


export const DownloadCertificate = () => {
  const handleDownload = async () => {
    generateCertificatePDF({
  recipient_name: "John Doe",
  program_title: "Product Management Fundamentals",
  completion_date: "24 March 2025",
  certificate_id: "CERT-2025-000123",
});
    };
  return <button onClick={handleDownload}>Download Certificate</button>;
};