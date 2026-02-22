import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateFilterProps {
  value: Date | null;
  onChange: (val: { year: number; month: number; date: Date }) => void;
}

const DateFilter: React.FC<DateFilterProps> = (props) => {
  const renderMonthContent = (
    month: string,
    shortMonth: string,
    longMonth: string,
    day: number
  ) => {
    const fullYear = new Date(day).getFullYear();
    const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;

    return <span title={tooltipText}>{shortMonth}</span>;
  };
  const monthYear = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return { year, month, date };
  };

  const handleChange = (date: Date | null) => {
    if (date) {
      props.onChange(monthYear(date));
    }
  };

  const CustomInput = forwardRef<
    HTMLInputElement,
    { value?: string; onClick?: () => void }
  >(({ value, onClick }, ref) => (
    <input
      className=" border p-2 rounded-lg border-primary cursor-pointer"
      onClick={onClick}
      ref={ref}
      value={value || ""}
      readOnly
      placeholder="Filter by date"
    />
  ));
  CustomInput.displayName = "DateFilterInput";

  return (
    <DatePicker
      selected={props.value}
      renderMonthContent={renderMonthContent}
      onChange={handleChange}
      showMonthYearPicker
      dateFormat="MM/yyyy"
      customInput={<CustomInput />}
    />
  );
};

export default DateFilter;
