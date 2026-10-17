import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import { useEffect, useRef, useState } from "react";
import { runAction } from "../runAction";
import { fmtDate } from "../somUtils";
import { Btn, EmptyBlock, Panel, SimpleTable } from "../ui";

type Issued = { id: number; certificateNumber: string; issuedAt: string; userId: number; name: string };

/**
 * Certificates for a program. The certificate itself is the existing
 * server-rendered PDF (certificatePdfService); this tab only lists, previews,
 * downloads and issues.
 */
export const ProgramCertificates = ({ programId, canIssue }: { programId: number; canIssue: boolean }) => {
  const { data, loading, refetch } = useFetch(
    api.fetch.fetchProgramCertificates,
    { programId: String(programId) },
    !canIssue
  );
  const previewRequest = useRef(0);
  const [issuing, setIssuing] = useState(false);
  const [preview, setPreview] = useState<{ cert: Issued; url: string | null } | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  // Invalidate any in-flight preview on unmount.
  useEffect(
    () => () => {
      previewRequest.current += 1;
    },
    []
  );

  const closePreview = () => {
    previewRequest.current += 1;
    setPreview(null);
  };

  const issued = data?.data?.issued ?? [];
  const eligible = data?.data?.eligible ?? [];

  const openPreview = async (cert: Issued) => {
    const request = ++previewRequest.current;
    setPreview({ cert, url: null });
    try {
      const file = await api.fetch.downloadCertificatePdf(cert.certificateNumber);
      if (request !== previewRequest.current) return; // closed or superseded
      setPreview({ cert, url: URL.createObjectURL(file.blob) });
    } catch {
      if (request !== previewRequest.current) return;
      setPreview(null);
      showNotification("Could not load the certificate", "error");
    }
  };

  const download = async (cert: Issued) => {
    try {
      const file = await api.fetch.downloadCertificatePdf(cert.certificateNumber);
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || `${cert.certificateNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showNotification("Could not download the certificate", "error");
    }
  };

  const issue = async (userIds: number[]) => {
    setIssuing(true);
    let issuedCount = 0;
    const ok = await runAction(
      async () => {
        const res = await api.post.issueCertificates({ programId, userIds });
        issuedCount = res.data?.issued ?? 0;
      },
      { failure: "Could not issue certificates" }
    );
    setIssuing(false);
    if (ok) {
      showNotification(
        issuedCount === userIds.length
          ? `Issued ${issuedCount} certificate${issuedCount === 1 ? "" : "s"}`
          : `Issued ${issuedCount} of ${userIds.length}. Some learners have not passed every unit.`,
        issuedCount === userIds.length ? "success" : "error"
      );
      refetch();
    }
  };

  if (!canIssue) {
    return <EmptyBlock msg="Certificates are managed by instructors and School of Ministry managers. Learners download theirs from My learning." />;
  }
  if (loading && !data) return <SkeletonLoader />;

  return (
    <div className="grid gap-4 laptop:grid-cols-[minmax(0,1fr)_340px]">
      <Panel
        title={`Issued (${issued.length})`}
        action={issued[0] && <Btn size="sm" onClick={() => openPreview(issued[0])}>Preview design</Btn>}
      >
        <SimpleTable<Issued>
          rows={issued}
          rowKey={(c) => c.id}
          minWidth={560}
          empty={<EmptyBlock msg="No certificates issued for this program yet." />}
          columns={[
            { key: "n", header: "Learner", render: (c) => <span className="font-medium">{c.name}</span> },
            { key: "no", header: "Certificate no.", render: (c) => <span className="font-mono text-xs">{c.certificateNumber}</span> },
            { key: "d", header: "Issued", render: (c) => <span className="text-primaryGray">{fmtDate(c.issuedAt)}</span> },
            {
              key: "a",
              header: <span className="sr-only">Actions</span>,
              className: "text-right",
              render: (c) => (
                <div className="flex justify-end gap-1">
                  <Btn size="sm" onClick={() => openPreview(c)}>View</Btn>
                  <Btn size="sm" onClick={() => download(c)}>Download</Btn>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Panel
        title={`Ready to issue (${eligible.length})`}
        action={
          canIssue &&
          eligible.length > 0 && (
            <Btn size="sm" variant="primary" disabled={issuing} onClick={() => issue(eligible.map((e) => e.userId))}>
              Issue all
            </Btn>
          )
        }
      >
        {eligible.length === 0 ? (
          <p className="px-4 py-4 text-sm text-primaryGray">
            Learners appear here once they pass every unit. They can also download their certificate from My learning.
          </p>
        ) : (
          <ul>
            {eligible.map((e) => (
              <li key={e.userId} className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">{e.name}</p>
                  <p className="truncate text-xs text-mainGray">
                    {e.cohort} · {e.className}
                  </p>
                </div>
                {canIssue && (
                  <Btn size="sm" disabled={issuing} onClick={() => issue([e.userId])}>
                    Issue
                  </Btn>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-mainGray">
          Certificates use the standard WWM design generated by the server, with a QR code for verification.
        </p>
      </Panel>

      <Modal open={Boolean(preview)} onClose={closePreview} className="!max-w-4xl" title="Certificate">
        {preview && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-primary">{preview.cert.name}</h3>
                <p className="font-mono text-xs text-mainGray">{preview.cert.certificateNumber}</p>
              </div>
              <Btn size="sm" onClick={() => download(preview.cert)}>Download PDF</Btn>
            </div>
            {preview.url ? (
              <iframe title="Certificate PDF" src={preview.url} className="h-[70vh] w-full rounded-lg border border-gray-200" />
            ) : (
              <div className="flex h-[50vh] items-center justify-center text-sm text-primaryGray">Loading certificate…</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProgramCertificates;
