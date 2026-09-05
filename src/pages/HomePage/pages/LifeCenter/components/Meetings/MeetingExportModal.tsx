import { useMemo, useState } from "react";
import { format, startOfMonth, startOfYear, subMonths } from "date-fns";

import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { downloadBlobFile } from "@/utils/helperFunctions";
import type { MeetingExportFormat } from "@/utils/api/lifeCenter/interfaces";
import { cn } from "@/utils/cn";

interface IProps {
  lifeCenterId: string;
  onClose: () => void;
}

type PresetId = "this-month" | "last-3-months" | "this-year" | "all-time";

type DateRange = { from: string; to: string };

const toInputDate = (date: Date) => format(date, "yyyy-MM-dd");

const PRESETS: Array<{ id: PresetId; label: string; range: () => DateRange }> = [
  {
    id: "this-month",
    label: "This month",
    range: () => ({
      from: toInputDate(startOfMonth(new Date())),
      to: toInputDate(new Date()),
    }),
  },
  {
    id: "last-3-months",
    label: "Last 3 months",
    range: () => ({
      from: toInputDate(subMonths(new Date(), 3)),
      to: toInputDate(new Date()),
    }),
  },
  {
    id: "this-year",
    label: "This year",
    range: () => ({
      from: toInputDate(startOfYear(new Date())),
      to: toInputDate(new Date()),
    }),
  },
  // An empty range is what tells the backend to export every meeting.
  { id: "all-time", label: "All time", range: () => ({ from: "", to: "" }) },
];

const FORMATS: Array<{ id: MeetingExportFormat; label: string; hint: string }> =
  [
    { id: "pdf", label: "PDF", hint: "For printing and sharing" },
    { id: "docx", label: "Word", hint: "Editable document" },
    { id: "xlsx", label: "Spreadsheet", hint: "For analysis in Excel" },
  ];

export const MeetingExportModal = ({ lifeCenterId, onClose }: IProps) => {
  const [{ from, to }, setRange] = useState<DateRange>(() =>
    PRESETS[0].range(),
  );
  const [activePreset, setActivePreset] = useState<PresetId | null>(
    "this-month",
  );
  const [downloading, setDownloading] = useState<MeetingExportFormat | null>(
    null,
  );

  const today = useMemo(() => toInputDate(new Date()), []);
  const rangeIsInverted = Boolean(from && to && from > to);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setRange(preset.range());
    setActivePreset(preset.id);
  };

  // Editing either bound by hand no longer matches whichever preset filled it.
  const updateBound = (bound: keyof DateRange, value: string) => {
    setRange((current) => ({ ...current, [bound]: value }));
    setActivePreset(null);
  };

  const handleDownload = async (exportFormat: MeetingExportFormat) => {
    if (rangeIsInverted) {
      showNotification("The start date must come before the end date", "error");
      return;
    }

    setDownloading(exportFormat);
    try {
      const file = await api.fetch.downloadLifeCenterMeetings({
        lifeCenterId,
        format: exportFormat,
        from: from || undefined,
        to: to || undefined,
      });
      downloadBlobFile(file.blob, file.fileName);
      showNotification("Download ready", "success");
      onClose();
    } catch {
      // The API layer already surfaces the server's message, so leave the modal
      // open for the range to be adjusted rather than notifying twice.
    } finally {
      setDownloading(null);
    }
  };

  const isBusy = downloading !== null;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="sticky top-0 z-10 bg-primary text-white">
        <FormHeader>
          <p className="text-lg font-semibold">Download meetings</p>
          <p className="text-sm">
            Pick the period you want, then choose a format.
          </p>
        </FormHeader>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="space-y-2">
          <p className="font-semibold text-primary">Period</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={isBusy}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                  activePreset === preset.id
                    ? "border-primary bg-primary text-white"
                    : "border-lightGray bg-white text-primary hover:bg-lightGray/40",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              className="font-semibold text-primary"
              htmlFor="export-from"
            >
              From
            </label>
            <input
              id="export-from"
              type="date"
              value={from}
              max={today}
              disabled={isBusy}
              onChange={(e) => updateBound("from", e.target.value)}
              className="w-full rounded-lg border border-lightGray px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none disabled:opacity-60"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-primary" htmlFor="export-to">
              To
            </label>
            <input
              id="export-to"
              type="date"
              value={to}
              max={today}
              disabled={isBusy}
              onChange={(e) => updateBound("to", e.target.value)}
              className="w-full rounded-lg border border-lightGray px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {rangeIsInverted && (
          <p className="text-sm text-red-600">
            The start date must come before the end date.
          </p>
        )}

        {!from && !to && (
          <p className="text-sm text-gray-500">
            Every meeting on record will be included.
          </p>
        )}

        <div className="space-y-2">
          <p className="font-semibold text-primary">Format</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {FORMATS.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={isBusy || rangeIsInverted}
                onClick={() => handleDownload(option.id)}
                className="flex flex-col items-start rounded-lg border border-lightGray px-4 py-3 text-left transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-primary">
                  {downloading === option.id
                    ? "Preparing…"
                    : option.label}
                </span>
                <span className="text-xs text-gray-500">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            value="Cancel"
            variant="secondary"
            disabled={isBusy}
            requireManageAccess={false}
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};
