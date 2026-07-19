import { FieldArray, useFormikContext, getIn } from "formik";
import type { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import PersonFields from "./PersonFields";
import {
  emptyPledger,
  type PledgeFormValues,
  type PledgerFormValue,
} from "../utils/pledgeHelpers";

interface PledgerFieldArrayProps {
  /** Formik path to the pledgers array, e.g. "groups[0].pledgers" */
  name: string;
  /** Group's called amount, used to pre-fill a new pledger's amount */
  calledAmount: number | "";
  membersOptions: ISelectOption<string | number>[];
}

/** Repeatable list of pledgers within one group. */
const PledgerFieldArray = ({ name, calledAmount, membersOptions }: PledgerFieldArrayProps) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<PledgeFormValues>();
  const pledgers = (getIn(values, name) as PledgerFormValue[]) ?? [];

  return (
    <FieldArray name={name}>
      {({ push, remove }) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Pledgers</h5>
            <button
              type="button"
              className="text-sm text-primary"
              onClick={() => push(emptyPledger(calledAmount))}
            >
              + Add pledger
            </button>
          </div>
          {pledgers.map((_pledger, i) => {
            const amtPath = `${name}[${i}].pledged_amount`;
            const amtError = getIn(touched, amtPath)
              ? (getIn(errors, amtPath) as string | undefined)
              : undefined;
            return (
              <div key={i} className="flex items-start gap-2 border rounded-md p-3">
                <div className="flex-1 flex flex-col gap-2">
                  <PersonFields basePath={`${name}[${i}]`} membersOptions={membersOptions} />
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-500">Pledged amount</label>
                    <input
                      type="number"
                      className="border rounded-md p-2 text-sm w-40"
                      value={getIn(values, amtPath) ?? ""}
                      onChange={(e) =>
                        setFieldValue(
                          amtPath,
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                    {amtError && <span className="text-xs text-red-500">{amtError}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-500 mt-1"
                  onClick={() => remove(i)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </FieldArray>
  );
};

export default PledgerFieldArray;
