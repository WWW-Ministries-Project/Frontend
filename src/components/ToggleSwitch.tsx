import PropTypes from "prop-types";

interface IProps {
  onChange: (name: string, checked: boolean) => void;
  name: string;
  disabled: boolean;
  isChecked: boolean;
}

export const ToggleSwitch = (props: IProps) => {
  const toggleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange(props.name, event.target.checked);
  };

  return (
    <label className="inline-flex items-center cursor-pointer">
      <span className="me-3 text-sm font-medium text-gray-900 ">
        {"Deactivate"}
      </span>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={props.isChecked}
        onChange={toggleSwitch}
        disabled={props.disabled}
      />
      <div className="relative w-11 h-6 bg-lightGray rounded-full peer  peer-focus:none  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
      <span className="ms-3 text-sm font-medium text-gray-900 ">
        {"Activate"}
      </span>
    </label>
  );
};

ToggleSwitch.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  isChecked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
