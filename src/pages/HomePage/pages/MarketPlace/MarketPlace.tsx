import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";

export function MarketPlace() {
  return (
    <PageOutline>
      <HeaderControls
        title="Marketplace Management"
        subtitle="Manage your market here"
        screenWidth={window.innerWidth}
        btnName="Create market"
        handleClick={() => {}}
      />
    </PageOutline>
  );
}
