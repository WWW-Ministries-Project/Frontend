import { useState } from "react";
import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type {
  AdminRideArea,
  AdminRideOffer,
  AdminRidePickupPoint,
  RideReport,
} from "@/utils/api/rides/interfaces";
import { RideSheet, SheetActions, SheetError } from "../components/RideSheet";
import {
  inputClass,
  textareaClass,
} from "../components/rideClasses";
import { clockLabel, plural, rideErrorMessage } from "../utils/rideHelpers";
import { AreaRouteEditor } from "./AreaRouteEditor";
import { type RouteRow, routeRowsOf, validateRoute } from "./areaRoute";

const NAME_MAX = 120;
const CANCEL_REASON_MAX = 300;
const RESOLUTION_NOTE_MAX = 2000;

const Optional = () => (
  <span className="font-normal text-mainGray"> (optional)</span>
);

/** Whole number, 0 or more; null when the field isn't valid. */
const parseSortOrder = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!/^\d{1,6}$/.test(trimmed)) return null;
  return Number(trimmed);
};

/* ------------------------------------------------------------------ */
/* Cancel a ride                                                       */
/* ------------------------------------------------------------------ */

/** The church office takes a ride down; the driver and anyone on it are told. */
export const CancelRideModal = ({
  ride,
  onClose,
  onCancelled,
}: {
  ride: AdminRideOffer;
  onClose: () => void;
  onCancelled: () => void;
}) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const affected = ride.requests.filter(
    (request) => request.status === "PENDING" || request.status === "ACCEPTED"
  ).length;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const trimmed = reason.trim();
    try {
      const response = await api.post.adminCancelRide(
        ride.id,
        trimmed ? { reason: trimmed } : {}
      );
      const notified = response.data?.passengers_notified ?? affected;
      notify.success({
        title: "Ride cancelled",
        message: notified
          ? `${ride.driver.name} and ${plural(notified, "member")} on it have been told.`
          : `${ride.driver.name} has been told.`,
      });
      onCancelled();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't cancel this ride."));
      setSubmitting(false);
    }
  };

  return (
    <RideSheet
      open
      onClose={onClose}
      locked={submitting}
      title={`Cancel ${ride.driver.name}’s ride?`}
      subtitle={`${ride.area.name} → Church · leaves ${clockLabel(ride.depart_time)}`}
      onSubmit={submit}
      footer={
        <SheetActions
          onCancel={onClose}
          cancelLabel="Keep ride"
          submitLabel="Cancel ride"
          submittingLabel="Cancelling…"
          submitting={submitting}
          danger
        />
      }
    >
      <p className="text-primaryGray">
        {affected
          ? `The driver and ${plural(affected, "member")} on it will be told it’s cancelled. This can’t be undone.`
          : "The driver will be told it’s cancelled. This can’t be undone."}
      </p>
      <label className="flex flex-col gap-1 font-medium">
        <span>
          Reason
          <span className="font-normal text-mainGray">
            {" "}
            (optional, shared with them)
          </span>
        </span>
        <input
          value={reason}
          maxLength={CANCEL_REASON_MAX}
          disabled={submitting}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Following a safety report. Contact the church office."
          className={inputClass}
        />
      </label>
      <SheetError message={error} />
    </RideSheet>
  );
};

/* ------------------------------------------------------------------ */
/* Resolve a safety report                                             */
/* ------------------------------------------------------------------ */

export const ResolveReportModal = ({
  report,
  onClose,
  onResolved,
}: {
  report: RideReport;
  onClose: () => void;
  onResolved: () => void;
}) => {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const trimmed = note.trim();
    try {
      await api.put.resolveRideReport(
        report.id,
        trimmed ? { resolution_note: trimmed } : {}
      );
      notify.success({
        title: "Report resolved",
        message: report.blocked
          ? "Blocks between the members stay in place."
          : `${report.reason} · reported by ${report.reporter.name}`,
      });
      onResolved();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't resolve this report."));
      setSubmitting(false);
    }
  };

  return (
    <RideSheet
      open
      onClose={onClose}
      locked={submitting}
      title="Resolve this report"
      subtitle="Resolve once the safety team has spoken with the member and acted on the concern."
      onSubmit={submit}
      footer={
        <SheetActions
          onCancel={onClose}
          submitLabel="Mark resolved"
          submittingLabel="Saving…"
          submitting={submitting}
        />
      }
    >
      <label className="flex flex-col gap-1 font-medium">
        <span>
          What was done
          <Optional />
        </span>
        <textarea
          value={note}
          rows={4}
          maxLength={RESOLUTION_NOTE_MAX}
          disabled={submitting}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Called both members on Monday. Driver warned."
          className={textareaClass}
        />
        <span className="text-xs font-normal text-mainGray">
          Seen by the safety team only. Blocks between the members stay in
          place.
        </span>
      </label>
      <SheetError message={error} />
    </RideSheet>
  );
};

/* ------------------------------------------------------------------ */
/* Pickup point                                                        */
/* ------------------------------------------------------------------ */

export const PickupPointModal = ({
  point,
  onClose,
  onSaved,
}: {
  /** Null to add a new pickup point. */
  point: AdminRidePickupPoint | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(point?.name ?? "");
  const [areaLabel, setAreaLabel] = useState(point?.area_label ?? "");
  const [sortOrder, setSortOrder] = useState(String(point?.sort_order ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const cleanName = name.trim();
    const cleanArea = areaLabel.trim();
    const order = parseSortOrder(sortOrder);
    if (!cleanName || !cleanArea) {
      setError("Enter the landmark and its area.");
      return;
    }
    if (order === null) {
      setError("List order must be a whole number, 0 or more.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = { name: cleanName, area_label: cleanArea, sort_order: order };
    try {
      if (point) await api.put.updateRidePickupPoint(point.id, payload);
      else await api.post.createRidePickupPoint(payload);
      notify.success({
        title: point ? "Pickup point updated" : "Pickup point added",
        message: cleanName,
      });
      onSaved();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't save this pickup point."));
      setSubmitting(false);
    }
  };

  return (
    <RideSheet
      open
      onClose={onClose}
      locked={submitting}
      title={point ? "Edit pickup point" : "New pickup point"}
      subtitle="A public landmark, never a home address."
      onSubmit={submit}
      footer={
        <SheetActions
          onCancel={onClose}
          submitLabel={point ? "Save" : "Add pickup point"}
          submittingLabel="Saving…"
          submitting={submitting}
        />
      }
    >
      <label className="flex flex-col gap-1 font-medium">
        Landmark
        <input
          value={name}
          maxLength={NAME_MAX}
          disabled={submitting}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder="e.g. Shell, Spintex Junction"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Area
        <input
          value={areaLabel}
          maxLength={NAME_MAX}
          disabled={submitting}
          onChange={(event) => {
            setAreaLabel(event.target.value);
            setError(null);
          }}
          placeholder="e.g. Spintex Road"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        <span>
          List order
          <Optional />
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={sortOrder}
          disabled={submitting}
          onChange={(event) => setSortOrder(event.target.value)}
          className={`${inputClass} w-32`}
        />
        <span className="text-xs font-normal text-mainGray">
          Lower numbers are listed first.
        </span>
      </label>
      <SheetError message={error} />
    </RideSheet>
  );
};

/* ------------------------------------------------------------------ */
/* Area and its usual route                                            */
/* ------------------------------------------------------------------ */

export const AreaModal = ({
  area,
  pickupPoints,
  onClose,
  onSaved,
}: {
  /** Null to add a new area. */
  area: AdminRideArea | null;
  pickupPoints: AdminRidePickupPoint[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(area?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(area?.sort_order ?? 0));
  const [route, setRoute] = useState<RouteRow[]>(() => routeRowsOf(area));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const cleanName = name.trim();
    const order = parseSortOrder(sortOrder);
    if (!cleanName) {
      setError("Enter the area name.");
      return;
    }
    if (order === null) {
      setError("List order must be a whole number, 0 or more.");
      return;
    }
    const checked = validateRoute(route);
    if ("error" in checked) {
      setError(checked.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = { name: cleanName, sort_order: order, route: checked.stops };
    try {
      if (area) await api.put.updateRideArea(area.id, payload);
      else await api.post.createRideArea(payload);
      notify.success({
        title: area ? "Area updated" : "Area added",
        message: `${cleanName} · ${plural(checked.stops.length, "stop")}`,
      });
      onSaved();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't save this area."));
      setSubmitting(false);
    }
  };

  return (
    <RideSheet
      open
      onClose={onClose}
      locked={submitting}
      title={area ? "Edit area" : "New area"}
      subtitle="A neighbourhood drivers set off from, and the landmarks they usually pass."
      onSubmit={submit}
      footer={
        <SheetActions
          onCancel={onClose}
          submitLabel={area ? "Save area" : "Add area"}
          submittingLabel="Saving…"
          submitting={submitting}
        />
      }
    >
      <div className="grid gap-4 tablet:grid-cols-[1fr_auto]">
        <label className="flex flex-col gap-1 font-medium">
          Area name
          <input
            value={name}
            maxLength={NAME_MAX}
            disabled={submitting}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="e.g. Tema Community 25"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 font-medium">
          <span>
            List order
            <Optional />
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={sortOrder}
            disabled={submitting}
            onChange={(event) => setSortOrder(event.target.value)}
            className={`${inputClass} tablet:w-28`}
          />
        </label>
      </div>
      <AreaRouteEditor
        route={route}
        onChange={(next) => {
          setRoute(next);
          setError(null);
        }}
        pickupPoints={pickupPoints}
        disabled={submitting}
      />
      <SheetError message={error} />
    </RideSheet>
  );
};
