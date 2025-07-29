import { CalendarIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { Button } from "@/components";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import { formatDate } from "@/utils";
import type { IMarket } from "@/utils/api/marketPlace/interface";
import { MarketStatusChip } from "../chips/MarketStatusChip";

interface IProps {
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
}: IProps) {
  const { name, description, event_name, start_date, end_date, id } = market;
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="w-full flex flex-col justify-between rounded-2xl text-[#474D66] border border-lightGray p-4 bg-white relative group">
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
            <div
              onClick={() => setShowOptions((prev) => !prev)}
              className="hidden group-hover:block"
            >
              <ActionButton
                showOptions={showOptions}
                onDelete={() => handleDelete(market.id, name)}
                onEdit={() => handleEdit(market)}
              />
            </div>
          </div>
        </div>

        <p className="my-3">{description}</p>

        <div className="flex items-center gap-2 text-[#101840]">
          <CalendarIcon className="h-5 w-5 text-black" />
          <span>
            {formatDate(start_date)} to {formatDate(end_date)}
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
