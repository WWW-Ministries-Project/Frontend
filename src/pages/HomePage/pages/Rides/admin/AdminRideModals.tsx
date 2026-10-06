import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { FormHeader } from "@/components/ui";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  AdminRideArea,
  AdminRideOffer,
  AdminRidePickupPoint,
  RideReport,
} from "@/utils/api/rides/interfaces";
import { clockLabel, plural, rideErrorMessage } from "../utils/rideHelpers";
import { inputClass, textareaClass } from "./AdminRideShared";
import {
  AreaRouteEditor,
  parseMinutes,
  type RouteRow,
} from "./AreaRouteEditor";

const NAME_MAX = 120;
const CANCEL_REASON_MAX = 300;
const RESOLUTION_NOTE_MAX = 2000;

interface ModalFrameProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  dismissLabel?: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  className?: string;
}

/** Header / body / footer shell shared by every ride admin modal. */
const ModalFrame = ({
  title,
  subtitle,
  submitLabel,
  dismissLabel = "Cancel",
  submitting,
  error,
  onClose,
  onSubmit,
  children,
  className = "max-w-xl",
}: ModalFrameProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submitting) onSubmit();
  };

  return (
    <Modal
      open
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={title}
      description={subtitle ?? title}
      className={className}
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
        <FormHeader>
          <p className="text-lg font-semibold">{title}</p>
          {subtitle ? <p className="text-sm text-white/90">{subtitle}</p> : null}
        </FormHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          {children}
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-error/40 bg-errorBG px-3 py-2 text-sm text-error"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-lightGray bg-white px-6 py-4">
          <Button
            variant="secondary"
            value={dismissLabel}
            onClick={onClose}
            disabled={submitting}
          />
          <Button
            type="submit"
            value={submitLabel}
            loading={submitting}
            disabled={submitting}
          />
        </div>
      </form>
    </Modal>
  );
};

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}

const Field = ({ id, label, hint, children }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium text-primary">
      {label}
    </label>
    {children}
    {hint ? <div className="text-xs text-primaryGray">{hint}</div> : null}
  </div>
);

const Counter = ({ value, max }: { value: string; max: number }) => (
  <span className="tabular-nums">
    {value.length}/{max}
  </span>
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

interface CancelRideModalProps {
  ride: AdminRideOffer;
  onClose: () => void;
  onCancelled: () => void;
}

/** Church office takes a ride down; the driver and anyone booked are told. */
export const CancelRideModal = ({
  ride,
  onClose,
  onCancelled,
}: CancelRideModalProps) => {
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
      showNotification(
        notified
          ? `Ride cancelled. ${ride.driver.name} and ${plural(notified, "passenger")} have been notified.`
          : `Ride cancelled. ${ride.driver.name} has been notified.`,
        "success"
      );
      onCancelled();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't cancel this ride."));
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="Cancel this ride?"
      subtitle={`${ride.driver.name}'s ride from ${ride.area.name} · sets off ${clockLabel(ride.depart_time)}`}
      submitLabel="Cancel ride"
      dismissLabel="Keep ride"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="rounded-xl bg-lightGray/30 p-4 text-sm text-primary">
        <p>
          <strong>{ride.driver.name}</strong> will be told the church office
          removed the ride{reason.trim() ? ", with your reason" : ""}.
        </p>
        <p className="mt-1">
          {affected
            ? `${plural(affected, "passenger")} with a seat or a pending request will be told their seat was released so they can find another ride.`
            : "No passengers hold a seat or a pending request on this ride."}
        </p>
        <p className="mt-1 text-primaryGray">This can&apos;t be undone.</p>
      </div>
      <Field
        id="ride-cancel-reason"
        label="Reason (optional)"
        hint={
          <div className="flex justify-between gap-3">
            <span>Shared with the driver in their notification.</span>
            <Counter value={reason} max={CANCEL_REASON_MAX} />
          </div>
        }
      >
        <textarea
          id="ride-cancel-reason"
          className={textareaClass}
          value={reason}
          maxLength={CANCEL_REASON_MAX}
          disabled={submitting}
          placeholder="e.g. Following a safety report — please contact the church office."
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
    </ModalFrame>
  );
};

/* ------------------------------------------------------------------ */
/* Resolve a safety report                                             */
/* ------------------------------------------------------------------ */

interface ResolveReportModalProps {
  report: RideReport;
  onClose: () => void;
  onResolved: () => void;
}

export const ResolveReportModal = ({
  report,
  onClose,
  onResolved,
}: ResolveReportModalProps) => {
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
      showNotification("Report resolved", "success");
      onResolved();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't resolve this report."));
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="Resolve safety report"
      subtitle={`${report.reason} · reported by ${report.reporter.name}`}
      submitLabel="Mark resolved"
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <p className="text-sm text-primaryGray">
        Resolve once the safety team has spoken with the member who reported
        it and acted on the concern. Blocks between the members stay in place
        — lift them from the Blocks tab if appropriate.
      </p>
      <Field
        id="ride-report-resolution"
        label="Resolution note (optional)"
        hint={
          <div className="flex justify-between gap-3">
            <span>Seen by the safety team only.</span>
            <Counter value={note} max={RESOLUTION_NOTE_MAX} />
          </div>
        }
      >
        <textarea
          id="ride-report-resolution"
          className={textareaClass}
          value={note}
          maxLength={RESOLUTION_NOTE_MAX}
          disabled={submitting}
          placeholder="What was done — e.g. called both members, driver reminded of the guidelines."
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
    </ModalFrame>
  );
};

/* ------------------------------------------------------------------ */
/* Pickup point                                                        */
/* ------------------------------------------------------------------ */

interface PickupPointModalProps {
  /** Null to add a new pickup point. */
  point: AdminRidePickupPoint | null;
  onClose: () => void;
  onSaved: () => void;
}

export const PickupPointModal = ({
  point,
  onClose,
  onSaved,
}: PickupPointModalProps) => {
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
      setError("Enter the landmark's name and the area it's in.");
      return;
    }
    if (order === null) {
      setError("Sort order must be a whole number, 0 or more.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      name: cleanName,
      area_label: cleanArea,
      sort_order: order,
    };
    try {
      if (point) {
        await api.put.updateRidePickupPoint(point.id, payload);
      } else {
        await api.post.createRidePickupPoint(payload);
      }
      showNotification(
        point ? "Pickup point updated" : "Pickup point added",
        "success"
      );
      onSaved();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't save this pickup point."));
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={point ? "Edit pickup point" : "Add pickup point"}
      subtitle="Public landmarks only — never a home address."
      submitLabel={point ? "Save changes" : "Add pickup point"}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <Field
        id="ride-point-name"
        label="Landmark name *"
        hint={<Counter value={name} max={NAME_MAX} />}
      >
        <input
          id="ride-point-name"
          className={inputClass}
          value={name}
          maxLength={NAME_MAX}
          disabled={submitting}
          required
          placeholder="e.g. Accra Mall main entrance"
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field
        id="ride-point-area"
        label="Area *"
        hint="The district members see under the landmark's name."
      >
        <input
          id="ride-point-area"
          className={inputClass}
          value={areaLabel}
          maxLength={NAME_MAX}
          disabled={submitting}
          required
          placeholder="e.g. Spintex Road"
          onChange={(event) => setAreaLabel(event.target.value)}
        />
      </Field>
      <Field
        id="ride-point-sort"
        label="Sort order"
        hint="Lower numbers are listed first."
      >
        <input
          id="ride-point-sort"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          className={`${inputClass} w-32`}
          value={sortOrder}
          disabled={submitting}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </Field>
    </ModalFrame>
  );
};

/* ------------------------------------------------------------------ */
/* Area and its suggested route                                        */
/* ------------------------------------------------------------------ */

interface AreaModalProps {
  /** Null to add a new area. */
  area: AdminRideArea | null;
  pickupPoints: AdminRidePickupPoint[];
  onClose: () => void;
  onSaved: () => void;
}

const routeRowsOf = (area: AdminRideArea | null): RouteRow[] =>
  [...(area?.route ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      pickup_point_id: stop.pickup_point_id,
      minutes: String(stop.minutes_from_start),
    }));

export const AreaModal = ({
  area,
  pickupPoints,
  onClose,
  onSaved,
}: AreaModalProps) => {
  const [name, setName] = useState(area?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(area?.sort_order ?? 0));
  const [isActive, setIsActive] = useState(area?.is_active ?? true);
  const [route, setRoute] = useState<RouteRow[]>(() => routeRowsOf(area));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const cleanName = name.trim();
    const order = parseSortOrder(sortOrder);
    if (!cleanName) {
      setError("Enter the area's name.");
      return;
    }
    if (order === null) {
      setError("Sort order must be a whole number, 0 or more.");
      return;
    }
    const stops = route.map((stop) => ({
      pickup_point_id: stop.pickup_point_id,
      minutes: parseMinutes(stop.minutes),
    }));
    if (stops.some((stop) => stop.minutes === null)) {
      setError("Enter minutes from setting off (0 or more) for every stop.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      name: cleanName,
      sort_order: order,
      route: stops.map((stop) => ({
        pickup_point_id: stop.pickup_point_id,
        minutes: stop.minutes as number,
      })),
    };
    try {
      if (area) {
        await api.put.updateRideArea(area.id, {
          ...payload,
          is_active: isActive,
        });
      } else {
        await api.post.createRideArea(payload);
      }
      showNotification(area ? "Area updated" : "Area added", "success");
      onSaved();
    } catch (caught) {
      setError(rideErrorMessage(caught, "Couldn't save this area."));
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={area ? "Edit area" : "Add area"}
      subtitle="A neighbourhood drivers set off from, and the landmarks they usually pass."
      submitLabel={area ? "Save changes" : "Add area"}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={submit}
      className="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <Field
          id="ride-area-name"
          label="Area name *"
          hint={<Counter value={name} max={NAME_MAX} />}
        >
          <input
            id="ride-area-name"
            className={inputClass}
            value={name}
            maxLength={NAME_MAX}
            disabled={submitting}
            required
            placeholder="e.g. East Legon"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field id="ride-area-sort" label="Sort order" hint="Lower first.">
          <input
            id="ride-area-sort"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className={`${inputClass} sm:w-28`}
            value={sortOrder}
            disabled={submitting}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </Field>
      </div>

      {area ? (
        <label className="flex items-start gap-3 text-sm text-primary">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            checked={isActive}
            disabled={submitting}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>
            Active
            <span className="block text-xs text-primaryGray">
              Hidden areas can&apos;t be chosen for new rides. Rides already
              published keep their area.
            </span>
          </span>
        </label>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-primary">
          Suggested route
        </legend>
        <p className="text-xs text-primaryGray">
          Suggested landmarks drivers from this area usually pass, with typical
          minutes from setting off. Used to suggest pickup points and estimate
          pickup times.
        </p>
        <AreaRouteEditor
          route={route}
          onChange={setRoute}
          pickupPoints={pickupPoints}
          disabled={submitting}
        />
      </fieldset>
    </ModalFrame>
  );
};
