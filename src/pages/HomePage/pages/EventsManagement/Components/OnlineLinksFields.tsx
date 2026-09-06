import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Field, useFormikContext } from "formik";
import {
  ONLINE_PLATFORMS,
  onlineLinkWarning,
  type OnlineLinkFormValues,
} from "../utils/onlinePlatforms";

/**
 * One optional URL field per streaming platform, shared by the schedule form
 * and the view page's Online Access modal so both validate identically.
 * Neither field is required — an event can have one link, both, or none.
 */
export const OnlineLinksFields = () => {
  const { values } = useFormikContext<OnlineLinkFormValues>();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ONLINE_PLATFORMS.map((platform) => {
        const value = String(values[platform.field] ?? "");
        const warning = onlineLinkWarning(platform, value);

        return (
          <div key={platform.key} className="space-y-1">
            <Field
              component={FormikInputDiv}
              label={`${platform.label} link`}
              type="text"
              id={platform.field}
              name={platform.field}
              placeholder={platform.placeholder}
              value={value}
            />
            {warning ? (
              <p className="text-sma text-primaryGray">{warning}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default OnlineLinksFields;
