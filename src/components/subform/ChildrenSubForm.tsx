import Button from "@/components/Button";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/components/subform/PersonalDetails";
import { FormHeader, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { FieldArray, getIn, useFormikContext } from "formik";
import { Fragment, useMemo } from "react";
import { array, object } from "yup";

const ChildrenSubFormComponent = () => {
  const { values: entire } = useFormikContext<object>();
  const values: IChildrenSubForm["children"] = useMemo(
    () => getIn(entire, "children") || initialValues,
    [entire]
  );

  return (
    <>
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
              <Fragment key={index}>
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
              </Fragment>
            ))}
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
  children: array().of(object().shape(PersonalDetails.validationSchema)),
};
export const ChildrenSubForm = Object.assign(ChildrenSubFormComponent, {
  initialValues,
  validationSchema,
});
