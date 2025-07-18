import { CalendarIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components";
import { IMarket } from "@/utils/api/marketPlace/interface";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import { useState } from "react";
import { MarketStatusChip } from "../chips/MarketStatusChip";
import { DateTime } from "luxon";

interface IMarketCard {
  market: IMarket;
  handleEdit: (market: IMarket) => void;
  handleDelete: (id: string, name: string) => void;
  openMarket: (id: string) => void;
}

export function MarketCard({
  market,
  handleDelete,
  handleEdit,
  openMarket,
}: IMarketCard) {
  const { name, description, event_name, start_date, end_date, id } = market;

  const [showOptions, setShowOptions] = useState(false);

  const editMarket = () => handleEdit(market);
  const deleteMarket = () => handleDelete(market.id, name);

  return (
    <div className="w-full flex flex-col justify-between rounded-2xl text-[#474D66] border border-lightGray p-4 bg-white relative">
      <div>
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="font-medium text-xl">{name}</p>
            <p className="font-medium mt-1">{event_name}</p>
          </div>

          <div className="flex items-center gap-2">
            <MarketStatusChip
              start_date={market.start_date}
              end_date={market.end_date}
            />
            <div onClick={() => setShowOptions((prev) => !prev)}>
              <ActionButton
                showOptions={showOptions}
                onDelete={deleteMarket}
                onEdit={editMarket}
              />
            </div>
          </div>
        </div>

        <p className="my-3">{description}</p>

        <div className="flex items-center gap-2 text-[#101840]">
          <CalendarIcon className="h-5 w-5 text-black" />
          <span>
            {readable(start_date)} to {readable(end_date)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <Button value="Manage store" variant="primary" />
        <Button
          value="Go to shop"
          variant="secondary"
          onClick={() => openMarket(id)}
        />
      </div>
    </div>
  );
}

const readable = (isoDate: string) => {
  return DateTime.fromISO(isoDate).toLocaleString(DateTime.DATE_MED);
};
