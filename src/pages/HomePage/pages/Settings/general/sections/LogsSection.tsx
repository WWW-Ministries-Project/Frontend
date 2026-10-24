import { selectClass } from "../generalModel";
import { LoadFailed, RowsSkeleton, SectionTitle } from "../generalUi";
import type { RulesDraft } from "../useRulesDraft";

export const LogsSection = ({ rules, canEdit }: { rules: RulesDraft; canEdit: boolean }) => {
  const logTo = rules.value("logTo");
  const saved = rules.logsConfig?.system_failure_recipient;
  const loading = rules.status.logTo === "loading" || logTo === undefined;

  return (
    <>
      <SectionTitle
        title="Logs"
        text="Who hears about system failures, such as failed background jobs and notification errors."
      />
      {rules.status.logTo === "error" ? (
        <LoadFailed what="failure alert settings" onRetry={() => void rules.load("logTo")} />
      ) : loading ? (
        <RowsSkeleton rows={1} />
      ) : (
        <div className="flex max-w-[560px] flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-primary">
            Send failure alerts to
            <select
              value={logTo ?? ""}
              disabled={!canEdit}
              onChange={(event) => {
                const next = event.target.value ? Number(event.target.value) : null;
                rules.set("logTo", () => next);
              }}
              className={`${selectClass} w-full font-normal`}
            >
              {logTo === null && <option value="">Choose an admin…</option>}
              {rules.admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.email ? `${admin.name} · ${admin.email}` : admin.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-gray-500">
              Only people with Full access to Settings can receive these.
            </span>
          </label>
          <p className="text-xs text-gray-600">
            Currently: <strong className="font-semibold">{saved?.name ?? "Backend default admin"}</strong>
          </p>
        </div>
      )}
    </>
  );
};
