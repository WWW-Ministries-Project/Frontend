import { useFormikContext, getIn } from "formik";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import type { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import type { PersonFormValue } from "../utils/pledgeHelpers";

interface PersonFieldsProps {
  /** Formik path to this person object, e.g. "callers[0]" or "groups[0].pledgers[1]" */
  basePath: string;
  membersOptions: ISelectOption<string | number>[];
}

/** Member/guest toggle + the matching identity inputs for one person. */
const PersonFields = ({ basePath, membersOptions }: PersonFieldsProps) => {
  const { values, setFieldValue, errors, touched } =
    useFormikContext<Record<string, unknown>>();
  const person = getIn(values, basePath) as PersonFormValue | undefined;
  const isGuest = person?.isGuest ?? false;

  const err = (field: string): string | undefined => {
    const path = `${basePath}.${field}`;
    return getIn(touched, path) ? (getIn(errors, path) as string | undefined) : undefined;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            checked={!isGuest}
            onChange={() => setFieldValue(`${basePath}.isGuest`, false)}
          />
          Member
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            checked={isGuest}
            onChange={() => setFieldValue(`${basePath}.isGuest`, true)}
          />
          Guest
        </label>
      </div>

      {isGuest ? (
        <div className="grid md:grid-cols-2 gap-2">
          <div className="flex flex-col">
            <input
              className="border rounded-md p-2 text-sm"
              placeholder="Guest name"
              value={person?.guest_name ?? ""}
              onChange={(e) => setFieldValue(`${basePath}.guest_name`, e.target.value)}
            />
            {err("guest_name") && (
              <span className="text-xs text-red-500">{err("guest_name")}</span>
            )}
          </div>
          <div className="flex flex-col">
            <input
              className="border rounded-md p-2 text-sm"
              placeholder="Guest phone"
              value={person?.guest_phone ?? ""}
              onChange={(e) => setFieldValue(`${basePath}.guest_phone`, e.target.value)}
            />
            {err("guest_phone") && (
              <span className="text-xs text-red-500">{err("guest_phone")}</span>
            )}
          </div>
        </div>
      ) : (
        <SelectField
          id={`${basePath}.user_id`}
          placeholder="Select member"
          searchable
          options={membersOptions}
          value={person?.user_id ?? ""}
          onChange={(_name, value) =>
            setFieldValue(`${basePath}.user_id`, value === "" || value == null ? "" : Number(value))
          }
          error={err("user_id")}
        />
      )}
    </div>
  );
};

export default PersonFields;
