import Button from "@/components/Button";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/pages/HomePage/Components/subforms/PersonalDetails";
import { FieldArray, getIn, useFormikContext } from "formik";
import { useMemo } from "react";

const ChildrenSubFormComponent = () => {
  const { values:entire } = useFormikContext<object>();
  const values: IChildrenSubForm["children"] = useMemo(() => getIn(entire, "children")|| initialValues, [entire]);

  return (
    <FormLayout>
      <FormHeader>Children</FormHeader>
      <FieldArray name="children">
        {({ unshift, remove }) => (
          <>
            <FullWidth $justify={"right"}>
              <Button
                value="Add Another Child"
                className="default"
                type="button"
                onClick={() => unshift(initialValues.children[0])}
              />
            </FullWidth>
            {values.map((_, index) => (
              <>
                {index > 0 && <HorizontalLine />}
                {index > 0 && (
                  <FullWidth $justify={"right"}>
                    <Button
                      value="Remove"
                      className="secondary"
                      type="button"
                      onClick={() => remove(index)}
                    />
                  </FullWidth>
                )}
                <PersonalDetails key={index} prefix={`children.${index}`} />
              </>
            ))}
          </>
        )}
      </FieldArray>
    </FormLayout>
  );
};

export interface IChildrenSubForm {
  children: IPersonalDetails[];
}

const initialValues = {
  children: [PersonalDetails.initialValues],
};

const validationSchema = {};
export const ChildrenSubForm = Object.assign(ChildrenSubFormComponent, {
  initialValues,
  validationSchema,
});
