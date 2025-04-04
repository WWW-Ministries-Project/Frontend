import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas'; // Import html2canvas
import { ArrowLeftCircleIcon, PrinterIcon } from '@heroicons/react/24/solid';
import DownloadIcon from '@/assets/DownloadIcon';
import Button from '@/components/Button';
import PageOutline from '@/pages/HomePage/Components/PageOutline';
import ChurchLogo from '@/components/ChurchLogo';

const student = {
  id: 1,
  name: "Sarah Wilson",
  email: "sarah.w@example.com",
  phone: "+1 555-789-0123",
  applicationDate: "2023-05-08",
  status: "Active",
  attendance: 100,
  progress: 100,
  isMember: true,
  membershipType: "In-person Family",
  completionDate: "2023-08-28",
  topics: [
    { name: "Biblical Leadership Foundations", score: 98, status: "Pass" },
    { name: "Character Development", score: 95, status: "Pass" },
    { name: "Vision Casting", score: 92, status: "Pass" },
    { name: "Team Building", score: 94, status: "Pass" },
  ],
}

const classData = {
  id: 1,
  programId: 1,
  name: "Biblical Leadership - Monday Evening Class",
  instructor: "Pastor James Wilson",
  capacity: 15,
  enrolled: 12,
  format: "in-person",
  location: "Main Campus - Room 201",
  schedule: "Mondays, 7:00 PM - 9:00 PM",
  startDate: "2023-06-05",
  endDate: "2023-08-28",
  cohortName: "Spring 2023",
  programName: "Biblical Leadership",
}

const ViewCertificate = ({ loading }: any) => {
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=700,width=700');
    const certificateContent = certificateRef.current;
    if (certificateContent && printWindow) {
      printWindow.document.write('<html><head><style>');
      printWindow.document.write(`
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .certificate {
          width: 100%;
          max-width: 100%;
          padding: 2rem;
          margin: 0;
        }
        .text-center {
          text-align: center;
        }
        .mb-8 {
          margin-bottom: 2rem;
        }
        .font-bold {
          font-weight: bold;
        }
        .font-semibold {
          font-weight: 600;
        }
        .text-dark900 {
          color: #6539C3;
        }
        .border-4 {
          border-width: 4px;
        }
        .border-primary {
          border-color: #6539C3;
        }
        .text-muted-foreground {
          color: #6B7B8A;
        }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(certificateContent.innerHTML);
      printWindow.document.write('</body></html>');
    } else {
      console.error('Failed to open print window or certificate content is null.');
    }
    if (printWindow) {
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (certificateRef.current) {
      html2canvas(certificateRef.current, { scale: 2 }).then((canvas) => {
        // Create PDF
        const doc = new jsPDF('landscape', 'mm', 'a4'); // A4 Landscape
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate aspect ratio for fitting the certificate within the A4 landscape page
        const imgWidth = 297; // A4 landscape width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        doc.save('certificate.pdf');
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center p-4 border-b print:hidden">
          <h1 className="text-xl font-semibold ml-2">Loading Certificate...</h1>
        </div>
        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin text-dark900 mb-4"></div>
            <p className="text-muted-foreground">Generating certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student || !classData) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center p-4 border-b print:hidden">
          <ArrowLeftCircleIcon className="h-5 w-5" />
          <h1 className="text-xl font-semibold ml-2">Certificate Not Available</h1>
        </div>
        <div className="p-6 flex-1">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Certificate not available</h2>
            <p className="text-muted-foreground mb-6">
              The certificate you're looking for doesn't exist or the student hasn't completed the program.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageOutline className="p-0 text-dark900">
        <div className="flex items-center p-4 border-b border-lightGray print:hidden">
          <h1 className="text-xl font-semibold ml-2">Certificate of Completion</h1>
          <div className="ml-auto flex gap-2">
            <PrinterIcon className="h-4 w-4 mr-2" onClick={handlePrint} />
            Print
            <div className="h-4 w-4 mr-2">
              <DownloadIcon onClick={handleDownload} />
            </div>
            Download
          </div>
        </div>

        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl p-8 border-4 border-primary/50 m-4" ref={certificateRef}>
            <div className="text-center">
              <div className="mb-2 w-full flex justify-center">
                <ChurchLogo show />
              </div>
              <div className='mb-8'>
                <p className="text-muted-foreground">Certificate of Completion</p>
              </div>

              <div className="mb-8">
                <p className="text-lg mb-3">This certifies that</p>
                <h1 className="text-3xl font-bold mb-2">{student.name}</h1>
                <p className="text-lg">has successfully completed the</p>
                <h2 className="text-2xl font-semibold my-2">{classData.programName}</h2>
                <p className="text-lg">program with distinction</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <p className="text-muted-foreground mb-1">Date of Completion</p>
                  <p className="font-medium">{new Date(student.completionDate).toLocaleDateString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground mb-1">Instructor</p>
                  <p className="font-medium">{classData.instructor}</p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-dashed border-muted">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="h-px w-48 bg-foreground mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Pastor's Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="h-px w-48 bg-foreground mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Program Director</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-xs text-muted-foreground">
                <p>Grace Church Biblical Leadership Program</p>
                <p>
                  Certificate ID: {student.id}-{classData.id}-{new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageOutline>
    </div>
  );
};

export default ViewCertificate;
