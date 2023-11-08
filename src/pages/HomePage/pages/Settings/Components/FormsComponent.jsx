import React from 'react';
import InputDiv from '../../../Components/reusable/InputDiv';
import Button from '../../../../../components/Button';
import { useState } from 'react';
import SelectField from '../../../Components/reusable/SelectField';


const FormsComponent = (props) => {

    function onSubmit() {
        props.onSubmit();
    }
    return (
        <>
            <div className={"userInfo fixed right-0 top-0 h-full z-10 text-mainGray bg-white p-5 text-sma overflow-y-scroll " + props.className}>
                <div className="py-5 border-b border-[#F5F5F5] text-primaryGray text-lg font-manrope font-bold">
                    Create {props.selectId}
                </div>
                <form className="mt-5">
                    <div className="flex flex-col gap-6 mb-5 border-b border-[#F5F5F5]">
                        <InputDiv onChange={props.onChange} type="text" id={props.inputId} label={props.inputLabel} className="w-full" />
                        <SelectField onChange={props.onChange} label={props.selectLabel} id={props.selectId} options={props.selectOptions} />
                    </div>
                    <div className="flex gap-2 justify-end mt-10">
                        <Button
                            value="Close"
                            className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
                            onClick={props.CloseForm}
                        />
                        <Button value="Save" className={" p-3 text-white"} onClick={onSubmit} />
                    </div>
                </form>
            </div>
        </>
    )
}

export default FormsComponent;
