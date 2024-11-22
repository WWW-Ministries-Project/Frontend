import * as Yup from "yup";

export const addRequisitionSchema = Yup.object({
  requester_name: Yup.string(),
  department_id: Yup.string().required("department is a required field"),
  event_id: Yup.string().required("program is a required field"),
  request_date: Yup.string().required("date is a required field"),
  currency: Yup.string().required(),
  comment: Yup.string().required(),
});
