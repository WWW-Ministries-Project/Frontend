import { Button } from "@/components";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/components/subform/PersonalDetails";
import { FormHeader, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { FieldArray, getIn, useFormikContext } from "formik";
import { Fragment, useMemo } from "react";
import { array, object } from "yup";

const ChildrenSubFormComponent = ({
  disabled = false,
}: {
  disabled?: boolean;
}) => {
  const { values: entire } = useFormikContext<object>();
  const children: IChildrenSubForm["children"] = useMemo(
    () => getIn(entire, "children") || initialValues.children,
    [entire]
  );

  return (
    <>
      <FormHeader>Children</FormHeader>
      <FieldArray name="children">
        {({ unshift, remove }) => (
          <>
            
            {children.map((_, index) => (
              <Fragment key={index}>
                {index > 0 && <HorizontalLine />}
                {index > 0 && (
                  <FullWidth $justify={"right"}>
                    <Button
                      value="Remove"
                      variant="secondary"
                      type="button"
                      onClick={() => remove(index)}
                    />
                  </FullWidth>
                )}
                <PersonalDetails
                  key={index}
                  disabled={disabled}
                  prefix={`children.${index}`}
                />
              </Fragment>
            ))}
            <FullWidth $justify={"right"}>
              <Button
                value="Add Another Child"
                variant="ghost"
                type="button"
                onClick={() => unshift(initialValues.children[0])}
              />
            </FullWidth>
          </>
        )}
      </FieldArray>
    </>
  );
};

export interface IChildrenSubForm {
  children: IPersonalDetails[];
}

const initialValues = {
  children: [PersonalDetails.initialValues],
};

const validationSchema = {
  children: array()
    .when("personal_info.has_children", {
      is: true,
      then: (schema) => schema.of(object().shape(PersonalDetails.validationSchema)).min(1),
      otherwise: (schema) => schema.default([]), 
    })
};
export const ChildrenSubForm = Object.assign(ChildrenSubFormComponent, {
  initialValues,
  validationSchema,
});
