import * as Yup from "yup";

export const assetFormValidator = Yup.object({
  name: Yup.string()
    .required("Name is required"),
  status: Yup.string()
    .required("Status is required"),
  description: Yup.string()
    .required("Description is required"),
  department_assigned: Yup.string().when("status", (status, schema) => {
    if (typeof status === "string" && status === "ASSIGNED") {
      return schema.required("Department is required");
    }
    return schema.nullable();
  }),
});
