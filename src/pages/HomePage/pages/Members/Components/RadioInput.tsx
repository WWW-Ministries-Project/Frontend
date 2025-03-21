import { useField } from "formik";

interface RadioInputProps {
  name: string;
}

const RadioInputComponent: React.FC<RadioInputProps> = ({ name }) => {
  const [field, , { setValue }] = useField(name);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value === "true");
  };

  return (
    <div className="flex gap-12">
      <label>
        <input
          type="radio"
          value="true"
          checked={field.value === true}
          onChange={handleChange}
          className="mr-2"
        />
        Yes
      </label>
      <label>
        <input
          type="radio"
          value="false"
          checked={field.value === false}
          onChange={handleChange}
          className="mr-2"
        />
        No
      </label>
    </div>
  );
};

export const RadioInput = Object.assign(RadioInputComponent,{
  initialValues:{is_user:false},
  validationSchema:{}
})
// const RadioInput = Object.assign(RadioInputComponent,{
//   initialValues:{is_user:false},
//   validationSchema:{}
// })
