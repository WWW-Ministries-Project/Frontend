import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { InlineAlert, notify } from "@/components/feedback";
import { UnsavedBar } from "@/pages/HomePage/pages/Settings/Components/settingsUi";
import { cn } from "@/utils/cn";

import { ApplyAttendanceDialog } from "./dialogs/ApplyAttendanceDialog";
import {
  isSectionKey,
  PART_SECTION,
  SECTION_GROUPS,
  SECTION_KEYS,
  SECTION_LABEL,
  selectClass,
  type SectionKey,
} from "./generalModel";
import { AttendanceSection } from "./sections/AttendanceSection";
import { BranchesSection } from "./sections/BranchesSection";
import { EligibilitySection } from "./sections/EligibilitySection";
import { LogsSection } from "./sections/LogsSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { PositionsSection } from "./sections/PositionsSection";
import { ReportsSection } from "./sections/ReportsSection";
import { type AttendanceApply, useRulesDraft } from "./useRulesDraft";

const GeneralConfiguration = () => {
  const { canManage, canAdmin } = useAccessControl();
  const canEdit = canManage("Settings");
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const section: SectionKey = isSectionKey(requested) ? requested : "branches";
  const rules = useRulesDraft();
  const [askApply, setAskApply] = useState(false);

  const pick = (next: SectionKey) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        copy.set("section", next);
        return copy;
      },
      { replace: true }
    );

  const dirtySections = rules.dirtyParts.map((part) => PART_SECTION[part]);
  const dirtyLabels = SECTION_KEYS.filter((key) => dirtySections.includes(key)).map((key) => SECTION_LABEL[key]);

  const save = async (apply?: AttendanceApply, monthLabel?: string) => {
    const ok = await rules.commit(apply);
    if (!ok) return;
    setAskApply(false);
    notify.success({
      title: "Settings saved",
      message: !apply
        ? "Your changes are live."
        : apply.applyToExisting
          ? `Attendance from ${monthLabel} onwards is being reclassified.`
          : "New timing rules apply to attendance recorded from now on.",
    });
  };

  const onSave = () => {
    if (rules.dirtyParts.includes("att")) {
      if (rules.attInvalid) {
        notify.error({ title: "Check attendance timing", message: "Each rule needs a whole number above zero." });
        pick("attendance");
        return;
      }
      setAskApply(true);
      return;
    }
    void save();
  };

  const sectionBody = () => {
    switch (section) {
      case "branches":
        return <BranchesSection canEdit={canEdit} canDelete={canAdmin("Settings")} />;
      case "positions":
        return <PositionsSection canEdit={canManage("Positions")} canDelete={canAdmin("Positions")} />;
      case "attendance":
        return <AttendanceSection rules={rules} canEdit={canEdit} />;
      case "eligibility":
        return <EligibilitySection rules={rules} canEdit={canEdit} />;
      case "reports":
        return <ReportsSection rules={rules} canEdit={canEdit} />;
      case "notifications":
        return <NotificationsSection />;
      case "logs":
        return <LogsSection rules={rules} canEdit={canEdit} />;
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 tablet:px-6 tablet:py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-8 text-primary">General configuration</h1>
          <p className="text-base leading-6 text-[#4B5563]">
            Branches, positions and the rules that shape attendance, reports, eligibility and alerts.
          </p>
        </div>

        {!canEdit && (
          <InlineAlert tone="info">
            You can view these settings but not change them. Ask someone with Manage access to Settings.
          </InlineAlert>
        )}

        <div className="grid items-start gap-6 min-[900px]:grid-cols-[232px_minmax(0,1fr)]">
          <nav
            aria-label="Configuration sections"
            className="sticky top-4 hidden flex-col rounded-xl border border-lightGray bg-white p-2 min-[900px]:flex"
          >
            {SECTION_GROUPS.map((group) => (
              <div key={group.heading} className="flex flex-col">
                <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.04em] text-[#6B7280]">
                  {group.heading}
                </p>
                {group.items.map((key) => {
                  const on = key === section;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => pick(key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-[#F3F4F6]",
                        on ? "bg-lightGray/50 font-semibold" : "font-normal"
                      )}
                    >
                      {SECTION_LABEL[key]}
                      {dirtySections.includes(key) && (
                        <span aria-label="Unsaved" className="h-2 w-2 rounded-full bg-[#B45309]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            <p className="mt-2 border-t border-[#E5E7EB] p-3 text-xs text-[#6B7280]">
              Requisition timing now lives in{" "}
              <Link to="/home/settings/approvals" className="text-primary underline">
                Approvals
              </Link>
              .
            </p>
          </nav>

          <label className="flex flex-col gap-1 text-sm font-medium text-primary min-[900px]:hidden">
            Section
            <select
              value={section}
              onChange={(event) => pick(event.target.value as SectionKey)}
              className={cn(selectClass, "w-full font-normal")}
            >
              {SECTION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SECTION_LABEL[key]}
                  {dirtySections.includes(key) ? " •" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex min-w-0 flex-col gap-4">{sectionBody()}</div>
        </div>
      </div>

      {canEdit && dirtyLabels.length > 0 && (
        <UnsavedBar
          title={`Unsaved changes in ${dirtyLabels.join(", ")}`}
          saving={rules.saving}
          onDiscard={rules.discard}
          onSave={onSave}
        />
      )}

      <ApplyAttendanceDialog
        open={askApply}
        busy={rules.saving}
        onClose={() => setAskApply(false)}
        onConfirm={(apply, label) => void save(apply, label)}
      />
    </div>
  );
};

export default GeneralConfiguration;
