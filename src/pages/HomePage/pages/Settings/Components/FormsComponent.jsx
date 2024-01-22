import React from 'react';
import InputDiv from '../../../Components/reusable/InputDiv';
import Button from '../../../../../components/Button';
import SelectField from '../../../Components/reusable/SelectField';
import TextField from '../../../Components/reusable/TextField';


const FormsComponent = (props) => {

    function handleChange(name, value) {
        // console.log(name, typeof value);
        if (name === 'department_head') {
            props.onChange(name, Number(value));
        }else if (name === 'department_id') {
            props.onChange(name, +value);
        }
        else props.onChange(name, value);
    }

    function onSubmit() {
        props.onSubmit();
    }
    return (
        <>
            <div className={"userInfo fixed right-0 top-0 h-full z-10 text-mainGray bg-white p-5 text-sma overflow-y-scroll shadow-lg" + props.className}>
                <div className="py-5 border-b border-[#F5F5F5] text-primaryGray text-lg font-manrope font-bold">
                    Create {props.inputLabel}
                </div>
                {props.children ? props.children :
                <form className="mt-5">
                    <div className="flex flex-col gap-6 mb-5 border-b border-[#F5F5F5]">
                        <InputDiv onChange={handleChange} type="text" id={props.inputId} label={props.inputLabel} value={props.inputValue.name} className="w-full" />
                        <SelectField onChange={handleChange} label={props.selectLabel} id={props.selectId} options={props.selectOptions} placeholder={props.selectLabel} />
                        <TextField onChange={handleChange} value={props.inputValue.description} />
                    </div>
                    <div className="flex gap-2 justify-end mt-10">
                        <Button
                            value="Close"
                            className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
                            onClick={props.CloseForm}
                        />
                        <Button value="Save" className={" p-3 text-white"} onClick={onSubmit} loading={props.loading} />
                    </div>
                </form>
                }
            </div>
        </>
    )
}

export default FormsComponent;
