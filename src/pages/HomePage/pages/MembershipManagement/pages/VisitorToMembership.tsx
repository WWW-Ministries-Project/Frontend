import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";

import {
  CellText,
  GridColumn,
  GridTable,
  Pill,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  formatDate,
  plural,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import {
  ManagerEmpty,
  ManagerSection,
  ShowMoreRows,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/ManagerSection";
import { useRowLimit } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useRowLimit";
import {
  buildVisitorPrefillForm,
  matchesQuery,
  memberManagePath,
  phoneLabel,
  visitorMembershipPath,
  visitorSourceLabel,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import { useManagerData } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useManagerData";
import type { VisitorType } from "@/utils/api/visitors/interfaces";

const visitorName = (visitor: VisitorType) =>
  [visitor.title, visitor.firstName, visitor.lastName].filter(Boolean).join(" ") || "—";

export const VisitorToMembership = () => {
  const navigate = useNavigate();
  const { hasAction } = useAccessControl();
  // Converting adds a member, so it also needs Members › Add members.
  const canConvert =
    (hasAction("Membership_Management.convert_visitor") || hasAction("Visitors.convert_to_member")) &&
    hasAction("Members.create");
  const { visitors, visitorsLoading } = useManagerData();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      visitors.filter((visitor) =>
        matchesQuery(query, [
          visitor.firstName,
          visitor.otherName,
          visitor.lastName,
          visitor.email,
          visitor.phone,
        ])
      ),
    [visitors, query]
  );
  const { visible, remaining, showMore } = useRowLimit(rows, query);

  const convert = (visitor: VisitorType) =>
    navigate(memberManagePath, {
      state: {
        afterSubmitPath: visitorMembershipPath,
        prefillMemberForm: buildVisitorPrefillForm(visitor),
        prefillSourceLabel: visitorSourceLabel(visitor),
        sourceVisitorId: visitor.id,
      },
    });

  const columns: GridColumn<VisitorType>[] = [
    {
      key: "visitor",
      header: "Visitor",
      width: "minmax(200px,2fr)",
      render: (visitor) => (
        <CellText strong main={visitorName(visitor)} sub={visitor.email || "No email"} />
      ),
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.2fr",
      render: (visitor) => <CellText main={phoneLabel(visitor.country_code, visitor.phone)} />,
    },
    {
      key: "visits",
      header: "Visits",
      width: "1.2fr",
      render: (visitor) => {
        // The list only exposes the first visit date, not the latest one.
        const first = visitor.visitDate ?? visitor.createdAt;
        return (
          <CellText
            main={plural(visitor.visitCount ?? 0, "visit")}
            sub={first ? `First visit ${formatDate(first as string)}` : undefined}
          />
        );
      },
    },
    {
      key: "interest",
      header: "Membership interest",
      width: "1.2fr",
      render: (visitor) =>
        visitor.membershipWish ? (
          <Pill tone="success">Wants membership</Pill>
        ) : (
          <Pill tone="neutral">Not asked yet</Pill>
        ),
    },
  ];

  return (
    <ManagerSection
      title="Visitors not yet members"
      description="Visitors who asked about membership are listed first. Converting opens the member form with their details filled in."
      query={query}
      onQueryChange={setQuery}
    >
      {rows.length > 0 || (visitorsLoading && visitors.length === 0) ? (
        <>
          <GridTable
            columns={columns}
            rows={visible}
            getRowId={(visitor) => String(visitor.id)}
            loading={visitorsLoading}
            actionsWidth="180px"
            renderActions={
              canConvert
                ? (visitor) => (
                    <UiButton tone="primary" size="sm" onClick={() => convert(visitor)}>
                      Convert to member
                    </UiButton>
                  )
                : undefined
            }
          />
          <ShowMoreRows remaining={remaining} onClick={showMore} />
        </>
      ) : (
        <ManagerEmpty
          query={query}
          onResetQuery={() => setQuery("")}
          title="No visitors to convert"
          text="Visitors appear here until they become members."
        />
      )}
    </ManagerSection>
  );
};

export default VisitorToMembership;
