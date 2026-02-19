import { useState, useEffect } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import Receipt from "../Components/Receipt";
import Payment from "../Components/Payment";
import BankAccount from "../Components/BankAccount";
import TitheBreakdown from "../Components/TitheBreakdown";

const financeTabs = ["Receipt", "Payment", "Bank Accounts", "Tithe Breakdown"] as const;
type FinanceTab = (typeof financeTabs)[number];

const FinanceConfiguration = () => {
  const [selectedTab, setSelectedTab] = useState<FinanceTab>("Receipt");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <PageOutline>
      <HeaderControls
        title="Finance Configuration"
        subtitle="Manage your finance settings and preferences"
        screenWidth={screenWidth}
      />

      <div className="mb-2 w-full max-w-3xl">
        <TabSelection
          tabs={[...financeTabs]}
          selectedTab={selectedTab}
          onTabSelect={setSelectedTab}
        />
      </div>

      {selectedTab === "Receipt" && <Receipt />}
      {selectedTab === "Payment" && <Payment />}
      {selectedTab === "Bank Accounts" && <BankAccount />}
      {selectedTab === "Tithe Breakdown" && <TitheBreakdown />}
    </PageOutline>
  );
};

export default FinanceConfiguration;
