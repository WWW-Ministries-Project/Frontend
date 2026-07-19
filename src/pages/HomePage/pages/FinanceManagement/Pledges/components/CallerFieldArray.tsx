import { FieldArray, useFormikContext } from "formik";
import type { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import PersonFields from "./PersonFields";
import { emptyPerson, type PledgeFormValues } from "../utils/pledgeHelpers";

interface CallerFieldArrayProps {
  membersOptions: ISelectOption<string | number>[];
}

/** Repeatable list of the people who called for the pledge (members or guests). */
const CallerFieldArray = ({ membersOptions }: CallerFieldArrayProps) => {
  const { values } = useFormikContext<PledgeFormValues>();

  return (
    <FieldArray name="callers">
      {({ push, remove }) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Callers</h4>
            <button
              type="button"
              className="text-sm text-primary"
              onClick={() => push(emptyPerson())}
            >
              + Add caller
            </button>
          </div>
          {values.callers.length === 0 && (
            <p className="text-sm text-gray-400">No callers added yet.</p>
          )}
          {values.callers.map((_caller, i) => (
            <div key={i} className="flex items-start gap-2 border rounded-md p-3">
              <div className="flex-1">
                <PersonFields basePath={`callers[${i}]`} membersOptions={membersOptions} />
              </div>
              <button
                type="button"
                className="text-sm text-red-500 mt-1"
                onClick={() => remove(i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </FieldArray>
  );
};

export default CallerFieldArray;
