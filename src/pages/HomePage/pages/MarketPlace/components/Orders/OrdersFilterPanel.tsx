import { countOrderFilters, type OrderFilterValues } from "./orderFilters";
import { inputCls } from "./orderUi";

type Opt = { value: string; label: string };

interface IProps {
  values: OrderFilterValues;
  onChange: (patch: Partial<OrderFilterValues>) => void;
  onReset: () => void;
  productOptions: Opt[];
  sizeOptions: string[];
  colourOptions: string[];
  showMarketStatus: boolean;
}

const PAYMENT_OPTIONS: Opt[] = [
  { value: "", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Paid" },
  { value: "failed", label: "Failed" },
];

const MARKET_STATUS_OPTIONS: Opt[] = [
  { value: "", label: "All markets" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

const Select = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-sm text-primary">
    {label}
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

/** "Refine orders" panel from the design (product, variant, payment, market). */
export const OrdersFilterPanel = ({
  values,
  onChange,
  onReset,
  productOptions,
  sizeOptions,
  colourOptions,
  showMarketStatus,
}: IProps) => {
  const count = countOrderFilters(values);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-lightGray bg-[#FAFBFC] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-primary">Refine orders</h2>
          <p className="text-sm text-gray-600">
            Combine filters to narrow orders by product, variant, payment and market.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={count === 0}
          className="min-h-10 rounded-lg border border-lightGray bg-transparent px-4 py-2 text-sm font-medium text-primary disabled:opacity-60"
        >
          Reset filters
        </button>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <Select
          label="Product name"
          value={values.product}
          options={[{ value: "", label: "All products" }, ...productOptions]}
          onChange={(product) => onChange({ product })}
        />
        <Select
          label="Size"
          value={values.size}
          options={[
            { value: "", label: "All sizes" },
            ...sizeOptions.map((s) => ({ value: s, label: s })),
          ]}
          onChange={(size) => onChange({ size })}
        />
        <Select
          label="Colour"
          value={values.colour}
          options={[
            { value: "", label: "All colours" },
            ...colourOptions.map((c) => ({ value: c, label: c })),
          ]}
          onChange={(colour) => onChange({ colour })}
        />
        <Select
          label="Payment status"
          value={values.payment}
          options={PAYMENT_OPTIONS}
          onChange={(payment) => onChange({ payment })}
        />
        {showMarketStatus && (
          <Select
            label="Market status"
            value={values.marketStatus}
            options={MARKET_STATUS_OPTIONS}
            onChange={(marketStatus) => onChange({ marketStatus })}
          />
        )}
        <label className="flex flex-col gap-1 text-sm text-primary">
          Order date
          <input
            type="date"
            className={inputCls}
            value={values.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
};
