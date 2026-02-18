import { useState, useEffect } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { Modal } from "@/components/Modal";
import { FormHeader, FormLayout } from "@/components/ui";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import TextField from "@/pages/HomePage/Components/reusable/TextField";
import { Button } from "@/components/Button";
import Receipt from "../Components/Receipt";
import Payment from "../Components/Payment";
import BankAccount from "../Components/BankAccount";
import TitheBreakdown from "../Components/TitheBreakdown";

const FinanceConfiguration = () => {
  const [selectedTab, setSelectedTab] = useState("Receipt ");
  const [displayForm, setDisplayForm] = useState(false);
  const [inputValue, setInputValue] = useState({
    created_by: "",
    name: "",
    description: "",
  });
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const userId = ""; // replace with actual user id source when available

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return ( 
    <PageOutline className="p-6">
      <HeaderControls 
        title="Finance Configuration" 
        subtitle="Manage your finance settings and preferences"
        screenWidth={screenWidth}
      />

      <div className="w-fit">
        <TabSelection
          tabs={["Receipt ", "Payment ", "Bank Accounts", "Tithe Breakdown"]}
          selectedTab={selectedTab}
          onTabSelect={(tab) => setSelectedTab(tab)}
        />
      </div>

      {/* <PageHeader
        className="font-semibold text-xl"
        title={selectedTab}
        buttonValue={"Create " + selectedTab}
        onClick={() => {
          setDisplayForm(!displayForm);
          setInputValue({ created_by: userId, name: "", description: "" });
        }}
      /> */}

      
      {selectedTab === "Receipt " && <Receipt />}
      {selectedTab === "Payment " && <Payment />}
      {selectedTab === "Bank Accounts" && <BankAccount />}
      {selectedTab === "Tithe Breakdown" && <TitheBreakdown />}


        {/* <Modal open={displayForm} persist={false} onClose={() => setDisplayForm(false)}>
        <div className=" ">
              <FormHeader>
                  {props.editMode ? "Edit " : "Create "} {props.inputLabel}
                </FormHeader>
                <form className="mt-5 px-5 pb-5">
              <FormLayout $columns={1}>
                
                <InputDiv
                  onChange={handleChange}
                  type="text"
                  id={"name"}
                  label={props.inputLabel}
                  value={props.inputValue.name}
                  placeholder={`Enter ${props.inputLabel} name`}
                  className="w-full"
                />
                
                <TextField
                  onChange={handleChange}
                  value={props.inputValue.description || ""}
                />
              </FormLayout>
              <div className="flex gap-2 justify-end">
                <Button value="Close" variant="ghost" onClick={props.CloseForm} />
                <Button
                  value={props.editMode ? "Update" : "Save"}
                  variant="primary"
                  onClick={onSubmit}
                  disabled={props.loading || !props.inputValue.name}
                  loading={props.loading}
                />
              </div>
              </form>
            </div>
        </Modal> */}


    </PageOutline>);
};

export default FinanceConfiguration;