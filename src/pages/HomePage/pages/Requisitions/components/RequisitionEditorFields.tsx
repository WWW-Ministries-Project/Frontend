import { Field, useFormikContext } from "formik";
import MultiImageComponent, {
  image,
} from "@/pages/HomePage/Components/MultiImageComponent";
import FormWrapperNew from "@/Wrappers/FormWrapperNew";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import EditableTable from "./EditableTable";
import RequestAttachments from "./RequestAttachments";
import type { DropdownOption, RequisitionFormValues } from "../types/requisitionForm";
import type { TableRow } from "../types/requestInterface";

type RequisitionEditorFieldsProps = {
  readOnly?: boolean;
  departmentOptions: DropdownOption[];
  eventOptions: DropdownOption[];
  currencies: DropdownOption[];
  departmentsLoading?: boolean;
  eventsLoading?: boolean;
  initialImages: image[];
  imageChange: (images: image[]) => void;
  onItemImageUpload: (file: File) => Promise<string | null>;
  imageUploadLoading?: boolean;
  tableData?: TableRow[];
  attachmentFiles?: { URL: string; id?: number }[];
};

const noop = () => undefined;

const RequisitionEditorFields = ({
  readOnly = false,
  departmentOptions,
  eventOptions,
  currencies,
  departmentsLoading = false,
  eventsLoading = false,
  initialImages,
  imageChange,
  onItemImageUpload,
  imageUploadLoading = false,
  tableData,
  attachmentFiles = [],
}: RequisitionEditorFieldsProps) => {
  const { values } = useFormikContext<RequisitionFormValues>();

  return (
    <>
      <section className="rounded-xl border border-lightGray p-4 md:p-5">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
          Requisition Information
        </h4>
        <FormWrapperNew>
          <Field
            component={FormikInputDiv}
            name="requester_name"
            label="Requester"
            id="requester_name"
            disabled
          />
          <Field
            component={FormikSelectField}
            name="department_id"
            label="Department"
            options={departmentOptions}
            id="department_id"
            placeholder="Select department"
            helperText={
              departmentOptions.length === 0
                ? departmentsLoading
                  ? "Loading departments..."
                  : "No departments available"
                : undefined
            }
            disabled={readOnly}
          />
          <Field
            component={FormikSelectField}
            name="event_id"
            label="Event"
            options={eventOptions}
            id="event_id"
            placeholder="Select event"
            helperText={
              eventOptions.length === 0
                ? eventsLoading
                  ? "Loading events..."
                  : "No events available"
                : undefined
            }
            disabled={readOnly}
          />
          <Field
            component={FormikInputDiv}
            name="request_date"
            label="Date of requisition"
            id="request_date"
            type="date"
            disabled={readOnly}
          />
          <Field
            component={FormikSelectField}
            name="currency"
            label="Currency"
            id="currency"
            options={currencies}
            placeholder="Select currency"
            helperText="Default: Ghana Cedi (GHS)"
            disabled={readOnly}
          />
          <span aria-hidden="true" />
          <Field
            component={FormikInputDiv}
            name="comment"
            label="Comment"
            id="comment"
            type="textarea"
            className="md:col-span-2"
            disabled={readOnly}
          />
        </FormWrapperNew>
      </section>

      <section className="rounded-xl border border-lightGray p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">
            Requisition Items
          </h4>
          <span className="text-xs text-primaryGray">Upload image per item row</span>
        </div>
        <EditableTable
          isEditable={!readOnly}
          data={tableData}
          onImageUpload={onItemImageUpload}
          imageUploadLoading={imageUploadLoading}
          currency={values.currency}
        />
      </section>

      <section className="rounded-xl border border-lightGray p-4 md:p-5">
        <div className="mb-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">
            General Attachments
          </h4>
          <p className="text-xs text-primaryGray">
            Optional supporting files for the overall requisition.
          </p>
        </div>
        {readOnly ? (
          <RequestAttachments
            attachments={attachmentFiles}
            isEditable={false}
            addAttachement={noop}
            removAttachment={noop}
            isLoading={false}
            action="comment"
            fileId=""
          />
        ) : (
          <MultiImageComponent
            placeholder="Attachments"
            imageChange={imageChange}
            initialImages={initialImages}
          />
        )}
      </section>
    </>
  );
};

export default RequisitionEditorFields;
