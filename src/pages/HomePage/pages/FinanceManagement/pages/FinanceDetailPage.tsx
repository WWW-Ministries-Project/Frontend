import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Banner } from "../../Members/Components/Banner";
import { financeData } from "../utils/data";
import { buildFinanceSummary } from "../utils/helperFunctions";
import React from "react";
import FinanceBuilder from "../Components/FinanceBuilder";
import { Button } from "@/components";



const FinanceDetailPage = () => {
    const summary = buildFinanceSummary(financeData);
    const [formMode, setFormMode] = React.useState<"view" | "edit">("view");

  return (
    <div className="w-full space-y-8">
      <Banner>
        <div className="w-full flex justify-between items-center">
            <div className="w-full">
          <h1 className="text-2xl font-semibold">
            Receipts and Payments Account
          </h1>
          <p className="mt-2  ">
            August 2024 · Week Three 
          </p>
        </div>

        <div>
            <Button
                value="Edit Financials"
                variant="primary"
                className="text-primary bg-white"
                onClick={() => setFormMode("edit")}
            />
        </div>
        </div>
      </Banner>
      <FinanceBuilder
        financeData={financeData}
        mode={formMode}
        onModeChange={setFormMode}
      />

      
    </div>
  );
};

export default FinanceDetailPage;