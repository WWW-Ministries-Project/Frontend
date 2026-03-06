import { useFetch } from "@/CustomHooks/useFetch";
import EmptyState from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { useStore } from "@/store/useStore";
import { relativePath } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../Components/PageHeader";
import PageOutline from "../../../Components/PageOutline";
import TableComponent from "../../../Components/reusable/TableComponent";
import { Requisition } from "../types/requestInterface";
import {
  isAwaitingApprovalStatus,
  resolveRequisitionStatus,
} from "../utils/status";
import { tableColumns } from "../utils/tableColums";

const Requisitions = () => {
  const [filter, setFilter] = useState("");
  const myRequisitionPath = `${relativePath.home.main}/requests`;

  const { data, loading, error } = useFetch<ApiResponse<Requisition[]>>(
    api.fetch.fetchRequisitions as (
      query?: Record<string, string | number>
    ) => Promise<ApiResponse<Requisition[]>>
  );

  const { setRequests, requests } = useStore();

  useEffect(() => {
    setRequests(data?.data ?? []);
  }, [data, setRequests]);

  const metrics = useMemo(() => {
    const total = requests?.length ?? 0;
    const drafts =
      requests?.filter((request) => resolveRequisitionStatus(request) === "Draft")
        .length ??
      0;
    const awaiting =
      requests?.filter(
        (request) => isAwaitingApprovalStatus(resolveRequisitionStatus(request))
      ).length ?? 0;
    const approved =
      requests?.filter((request) => resolveRequisitionStatus(request) === "APPROVED")
        .length ?? 0;

    return { total, drafts, awaiting, approved };
  }, [requests]);

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    { label: "Requisition", link: myRequisitionPath },
    { label: "Requisitions", link: "" },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <div className="space-y-5">
        <div>
          <PageHeader title="Requisitions" />
          <p className="text-sm text-primaryGray">
            Track requisitions, approvals, and current processing status.
          </p>
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Requisitions", value: metrics.total },
            { label: "Drafts", value: metrics.drafts },
            { label: "Awaiting Approval", value: metrics.awaiting },
            { label: "Approved", value: metrics.approved },
          ].map((metric) => (
            <div key={metric.label} className="app-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primaryGray">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {metric.value}
              </p>
            </div>
          ))}
        </section>

        <section className="app-card p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-primary">
              Requisition Management
            </h3>
            <SearchBar
              className="w-full md:w-[340px]"
              placeholder="Search requisitions..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>

          {loading && (
            <div className="rounded-lg border border-lightGray p-4 text-sm text-primaryGray">
              Loading requisitions...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-error/40 bg-errorBG p-4 text-sm text-error">
              Failed to load requisitions. Please try again.
            </div>
          )}

          {!loading && !error && (requests ?? []).length === 0 && (
            <EmptyState
              scope="page"
              msg="No requisitions found"
              description="No requisitions have been created yet."
            />
          )}

          {!loading && !error && (requests ?? []).length > 0 && (
            <TableComponent
              columns={tableColumns}
              data={requests ?? []}
              displayedCount={10}
              filter={filter}
              setFilter={setFilter}
              rowClass="h-[70px]"
              headClass="text-xs uppercase tracking-wide"
            />
          )}
        </section>
      </div>
    </PageOutline>
  );
};

export default Requisitions;
