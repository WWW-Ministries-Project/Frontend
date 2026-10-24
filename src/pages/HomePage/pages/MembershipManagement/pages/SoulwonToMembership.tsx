import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CellText,
  GridColumn,
  GridTable,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  daysAgoLabel,
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import {
  ManagerEmpty,
  ManagerSection,
  ShowMoreRows,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/ManagerSection";
import { useRowLimit } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useRowLimit";
import {
  buildSoulPrefillForm,
  matchesQuery,
  memberManagePath,
  phoneLabel,
  soulCountryCode,
  SoulwonRecord,
  soulwonMembershipPath,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import { useManagerData } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useManagerData";

const soulName = (record: SoulwonRecord) =>
  [record.title, record.first_name, record.other_name, record.last_name]
    .filter(Boolean)
    .join(" ") || "—";

const capitalize = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : undefined;

export const SoulwonToMembership = () => {
  const navigate = useNavigate();
  const { souls, soulsLoading, soulsError } = useManagerData();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      souls.filter((record) =>
        matchesQuery(query, [
          record.first_name,
          record.other_name,
          record.last_name,
          record.contact_email,
          record.contact_number,
          record.lifeCenterName,
          record.wonBy?.name,
        ])
      ),
    [souls, query]
  );
  const { visible, remaining, showMore } = useRowLimit(rows, query);

  const convert = (record: SoulwonRecord) =>
    navigate(memberManagePath, {
      state: {
        afterSubmitPath: soulwonMembershipPath,
        prefillMemberForm: buildSoulPrefillForm(record),
        prefillSourceLabel: `${record.first_name || "Soulwon record"} from ${record.lifeCenterName}`,
        sourceSoulWonId: record.id,
      },
    });

  const columns: GridColumn<SoulwonRecord>[] = [
    {
      key: "name",
      header: "Name",
      width: "minmax(200px,2fr)",
      render: (record) => (
        <CellText strong main={soulName(record)} sub={capitalize(record.gender)} />
      ),
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.2fr",
      render: (record) => (
        <CellText main={phoneLabel(soulCountryCode(record), record.contact_number)} />
      ),
    },
    {
      key: "lifeCenter",
      header: "Life center",
      width: "1.6fr",
      render: (record) => (
        <CellText
          main={record.lifeCenterName}
          sub={record.wonBy?.name ? `Won by ${record.wonBy.name}` : undefined}
        />
      ),
    },
    {
      key: "date",
      header: "Date won",
      width: "1fr",
      render: (record) => (
        <CellText main={formatDate(record.date_won)} sub={daysAgoLabel(record.date_won)} />
      ),
    },
  ];

  return (
    <ManagerSection
      title="Souls won through life centers"
      description="Convert soul-winning records into member records once they are ready to join."
      query={query}
      onQueryChange={setQuery}
    >
      {soulsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load soul-winning records right now.
        </div>
      ) : null}

      {rows.length > 0 || (soulsLoading && souls.length === 0) ? (
        <>
          <GridTable
            columns={columns}
            rows={visible}
            getRowId={(record) => `${record.lifeCenterId}-${record.id}`}
            loading={soulsLoading}
            actionsWidth="180px"
            renderActions={(record) => (
              <UiButton tone="primary" size="sm" onClick={() => convert(record)}>
                Convert to member
              </UiButton>
            )}
          />
          <ShowMoreRows remaining={remaining} onClick={showMore} />
        </>
      ) : soulsError ? null : (
        <ManagerEmpty
          query={query}
          onResetQuery={() => setQuery("")}
          title="No records to convert"
          text="Souls won through life centers appear here."
        />
      )}
    </ManagerSection>
  );
};

export default SoulwonToMembership;
