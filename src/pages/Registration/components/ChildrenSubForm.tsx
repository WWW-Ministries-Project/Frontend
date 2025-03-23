import Button from "@/components/Button";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/pages/HomePage/Components/subforms/PersonalDetails";
import FormHeaderWrapper from "@/Wrappers/FormHeaderWrapper";
import FullWidthWrapper from "@/Wrappers/FullWidthWrapper";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { FieldArray, useFormikContext } from "formik";

const ChildrenSubFormComponent = () => {
  const { values } = useFormikContext<IChildrenSubForm>();

  return (
    <SubFormWrapper>
      <FormHeaderWrapper>Children</FormHeaderWrapper>
      <FieldArray name="children">
        {({ unshift, remove }) => (
          <>
            <FullWidthWrapper $justify={"right"}>
              <Button
                value="Add Another Child"
                className="default"
                type="button"
                onClick={() => unshift(initialValues.children[0])}
              />
            </FullWidthWrapper>
            {values.children.map((_, index) => (
              <>
                {index > 0 && <HorizontalLine />}
                {index > 0 && (
                  <FullWidthWrapper $justify={"right"}>
                    <Button
                      value="Remove"
                      className="secondary"
                      type="button"
                      onClick={() => remove(index)}
                    />
                  </FullWidthWrapper>
                )}
                <PersonalDetails key={index} />
              </>
            ))}
          </>
        )}
      </FieldArray>
    </SubFormWrapper>
  );
};

export interface IChildrenSubForm {
  children: IPersonalDetails[];
}

const initialValues = {
  children: [PersonalDetails.initialValues],
};

export const ChildrenSubForm = Object.assign(ChildrenSubFormComponent, {
  initialValues,
});
