import React, { useMemo } from "react";
import StatusPill from "@/components/StatusPill";
import { DateTime } from "luxon";
import {
  IRequestSummary,
  RequisitionStatusType,
} from "../types/requestInterface";

const amountFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const RequisitionSummaryComponent = ({
  summary,
  currency,
  status,
}: Readonly<{
  summary: IRequestSummary | undefined;
  currency: string | undefined;
  status?: RequisitionStatusType;
}>) => {
    const requestDate = useMemo(() => {
      const parsed = summary?.request_date
        ? DateTime.fromISO(summary.request_date)
        : null;

      return parsed?.isValid ? parsed.toFormat("dd LLL yyyy") : "N/A";
    }, [summary?.request_date]);

    const eventName =
      summary?.event_name || summary?.event || summary?.program || "N/A";

    const items = [
      {
        title: "Requisition ID",
        value: summary?.requisition_id || "N/A",
      },
      {
        title: "Department",
        value: summary?.department || "N/A",
      },
      {
        title: "Event",
        value: eventName,
      },
      {
        title: "Requisition Date",
        value: requestDate,
      },
      {
        title: "Total Cost",
        value: `${currency || "GHS"} ${amountFormatter.format(
          Number(summary?.total_cost ?? 0)
        )}`,
      },
    ];

    return (
      <aside className="app-card h-fit p-4">
        <h3 className="text-base font-semibold text-primary">Requisition Summary</h3>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="grid grid-cols-[110px_1fr] items-start gap-2 text-sm"
            >
              <span className="font-medium text-primaryGray">{item.title}</span>
              <span className="font-medium text-primary">{item.value}</span>
            </div>
          ))}

          <div className="grid grid-cols-[110px_1fr] items-center gap-2 text-sm">
            <span className="font-medium text-primaryGray">Status</span>
            <StatusPill
              text={(status || summary?.status || "Draft") as RequisitionStatusType}
            />
          </div>
        </div>
      </aside>
    );
  };

const RequisitionSummary = React.memo(RequisitionSummaryComponent);

RequisitionSummaryComponent.displayName = "RequisitionSummary";
RequisitionSummary.displayName = "RequisitionSummary";

export default RequisitionSummary;
