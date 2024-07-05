//@ts-nocheck
import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateFilterProps {
    value: Date | null;
    onChange: (val: { year: number, month: number }) => void;
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
    return ({ year, month,date});
  };

  const handleChange = (date: Date | null) => {
    // date &&console.log(monthYear(date));
    date &&props.onChange(monthYear(date));
  };
  // const ExampleCustomInput = forwardRef<HTMLDivElement, { value?: string, onClick?: () => void }>(
  //   ({ value, onClick }, ref) => (
  //     <InputDiv value={value} onClick={onClick} ref={ref} id="date" onChange={() => null} />
  //   )
  // );
  const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
    <input className="input" onClick={onClick} ref={ref} value={value} placeholder='filter by date' />
  ));

  return (
    <DatePicker
      selected={props.value}
      // @ts-ignore
      renderMonthContent={renderMonthContent}
      onChange={handleChange}
      showMonthYearPicker
      dateFormat="MM/yyyy"
      customInput={<ExampleCustomInput />}
    />
  );
};

export default DateFilter;
