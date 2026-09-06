import { useState } from "react";
import { Form, Formik } from "formik";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { EventOnlineLink } from "@/utils/api/events/interfaces";
import { OnlineLinksFields } from "./OnlineLinksFields";
import {
  formValuesToOnlineLinks,
  hasOnlineLinkErrors,
  onlineLinksToFormValues,
  validateOnlineLinks,
  type OnlineLinkFormValues,
} from "../utils/onlinePlatforms";

interface OnlineLinkModalProps {
  open: boolean;
  eventId: string | number;
  links: EventOnlineLink[];
  onClose: () => void;
  /**
   * Awaited before closing, so a refetch that changes `links` cannot land
   * while the form is still mounted and silently reinitialize live input.
   */
  onSaved: () => void | Promise<void>;
}

/**
 * "Online Access" modal opened from the event view page. Wraps the same
 * `OnlineLinksFields` the schedule form uses, so validation and field
 * rendering stay identical, but saves through the dedicated
 * `event/online-links` endpoint instead of the full event update.
 */
const OnlineLinkModal = ({
  open,
  eventId,
  links,
  onClose,
  onSaved,
}: OnlineLinkModalProps) => {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values: OnlineLinkFormValues) => {
    setSaving(true);
    try {
      await api.put.updateEventOnlineLinks(
        { links: formValuesToOnlineLinks(values) },
        { id: eventId }
      );
      showNotification("Online links updated", "success");
      await onSaved();
      onClose();
    } catch {
      showNotification("Unable to update the online links", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg p-6">
      <Formik<OnlineLinkFormValues>
        initialValues={onlineLinksToFormValues(links)}
        enableReinitialize
        validate={validateOnlineLinks}
        onSubmit={handleSubmit}
      >
        {(form) => (
          <Form className="flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="H400 text-primary">Online Access</h2>
              <p className="text-sma text-primaryGray">
                Both fields are optional. Clearing a field removes that
                platform&apos;s link from the event.
              </p>
            </div>

            <OnlineLinksFields />

            <div className="mt-2 flex justify-end gap-3 border-t border-lightGray pt-4">
              <Button value="Cancel" variant="secondary" onClick={onClose} />
              <Button
                value="Save"
                type="submit"
                variant="primary"
                loading={saving}
                disabled={
                  saving || form.isSubmitting || hasOnlineLinkErrors(form.values)
                }
              />
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default OnlineLinkModal;
