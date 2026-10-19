import { useMemo, useState } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { notify } from "@/components/feedback";
import { useStore } from "@/store/useStore";
import { api, relativePath } from "@/utils";
import type {
  FulfilmentMethod,
  ICreateOrderForMemberPayload,
  IProductTypeResponse,
} from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";

import {
  colourLabel,
  formatMoney,
  getMarketState,
  isPublished,
  isStockManaged,
  sortSizes,
} from "../../utils/marketplaceModel";
import { btnPrimary, btnSecondary, errorMessage, inputCls, labelCls } from "./orderUi";

interface IProps {
  /** Limit products to one market; otherwise every live product is offered. */
  marketId?: string | number;
  onClose: () => void;
  /** Called after the order is created (to refresh the list). */
  onCreated?: () => void;
}

interface ILine {
  product: IProductTypeResponse;
  colour: string;
  size: string;
  quantity: number;
}

interface IBilling {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
}

const EMPTY_BILLING: IBilling = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  country: "",
  country_code: "",
};

const BILLING_FIELDS: { key: keyof IBilling; label: string; type?: string }[] = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone_number", label: "Phone" },
];

const selectCls = cn(inputCls, "h-[42px] border-lightGray px-2.5");

/** Radio card used for the payment choice (design: Already paid / Send payment link). */
const RadioCard = ({
  on,
  title,
  sub,
  onPick,
  disabled,
}: {
  on: boolean;
  title: string;
  sub: string;
  onPick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={on}
    onClick={onPick}
    disabled={disabled}
    className={cn(
      "flex gap-2.5 rounded-lg border p-3 text-left text-primary disabled:cursor-not-allowed",
      on ? "border-primary bg-primary/[0.04]" : "border-lightGray bg-white"
    )}
  >
    <span
      className={cn(
        "mt-0.5 h-4 w-4 shrink-0 rounded-full",
        on ? "border-[5px] border-primary" : "border border-gray-400"
      )}
    />
    <span>
      <span className="block text-sm font-semibold">{title}</span>
      <span className="text-xs text-gray-600">{sub}</span>
    </span>
  </button>
);

/**
 * "Place order for member" — for purchases made at the church office or by
 * phone. Records a paid order, or creates one and returns a Hubtel payment
 * link for the member.
 */
export function CreateOrderForMemberModal({ marketId, onClose, onCreated }: IProps) {
  const membersOptions = useStore((state) => state.membersOptions);

  const productsQuery = useMemo(
    () => (marketId ? { market_id: marketId } : undefined),
    [marketId]
  );
  const { data: productsRes } = useFetch(
    marketId ? api.fetch.fetchProductsByMarket : api.fetch.fetchAllProducts,
    productsQuery,
    false,
    { silent: true }
  );
  const { data: deliveryRes } = useFetch(api.fetch.fetchDeliveryConfig, undefined, false, {
    silent: true,
  });
  const deliveryEnabled = Boolean(deliveryRes?.data?.delivery_enabled);
  const deliveryFee = Number(deliveryRes?.data?.delivery_fee) || 0;

  // Only published products in markets that are open for orders.
  const products = useMemo(
    () =>
      (productsRes?.data || []).filter(
        (p) => isPublished(p) && (!p.market || getMarketState(p.market) !== "Ended")
      ),
    [productsRes]
  );

  const [memberId, setMemberId] = useState("");
  const [billing, setBilling] = useState<IBilling>(EMPTY_BILLING);
  const [loadingMember, setLoadingMember] = useState(false);

  const [productId, setProductId] = useState("");
  const [colour, setColour] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [lines, setLines] = useState<ILine[]>([]);

  const [method, setMethod] = useState<FulfilmentMethod>("pickup");
  const [address, setAddress] = useState("");
  const [paid, setPaid] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const locked = Boolean(checkoutUrl);

  const product = products.find((p) => String(p.id) === productId);
  const managed = product ? isStockManaged(product) : false;
  const colourRow = product?.product_colours.find((c) => c.colour === colour);
  const sizeRows = useMemo(() => {
    const stock = colourRow?.stock || [];
    const order = sortSizes(stock.map((s) => s.size));
    return order.map((z) => stock.find((s) => s.size === z)!);
  }, [colourRow]);
  const sizeStock = Number(sizeRows.find((s) => s.size === size)?.stock ?? 0);
  const inLines = lines
    .filter((l) => l.product.id === product?.id && l.colour === colour && l.size === size)
    .reduce((a, l) => a + l.quantity, 0);

  const currentValid =
    Boolean(product) &&
    Boolean(colour) &&
    (!managed || Boolean(size)) &&
    qty > 0 &&
    (!managed || qty + inLines <= sizeStock);

  const pickProduct = (id: string) => {
    const p = products.find((x) => String(x.id) === id);
    setProductId(id);
    const c = p?.product_colours[0];
    setColour(c?.colour || "");
    const first = c?.stock?.length ? sortSizes(c.stock.map((s) => s.size))[0] : "";
    setSize(first || "");
    setQty(1);
  };

  const pickColour = (hex: string) => {
    setColour(hex);
    const c = product?.product_colours.find((x) => x.colour === hex);
    setSize(c?.stock?.length ? sortSizes(c.stock.map((s) => s.size))[0] : "");
    setQty(1);
  };

  const pickMember = async (id: string) => {
    setMemberId(id);
    setBilling(EMPTY_BILLING);
    if (!id) return;
    setLoadingMember(true);
    try {
      const res = await api.fetch.fetchAMember({ user_id: id });
      const m = res?.data as
        | (typeof res.data & { country?: string })
        | undefined;
      if (m)
        setBilling({
          first_name: m.first_name || "",
          last_name: m.last_name || "",
          email: m.email || "",
          phone_number: m.primary_number || "",
          country: m.country || "",
          country_code: m.country_code || "",
        });
    } catch (err) {
      notify.fromError(err, {
        title: "Couldn't load member details",
        retry: () => void pickMember(id),
      });
    } finally {
      setLoadingMember(false);
    }
  };

  const commitLine = () => {
    if (!currentValid || !product) return;
    setLines((prev) => {
      // Merge the same variant into one line — two lines for one variant
      // would each pass the backend's stock pre-check independently.
      const i = prev.findIndex(
        (l) => l.product.id === product.id && l.colour === colour && l.size === size
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + qty };
        return next;
      }
      return [...prev, { product, colour, size, quantity: qty }];
    });
    setProductId("");
    setColour("");
    setSize("");
    setQty(1);
  };

  const allLines = useMemo(() => {
    if (!currentValid || !product) return lines;
    const i = lines.findIndex(
      (l) => l.product.id === product.id && l.colour === colour && l.size === size
    );
    if (i >= 0) {
      const next = [...lines];
      next[i] = { ...next[i], quantity: next[i].quantity + qty };
      return next;
    }
    return [...lines, { product, colour, size, quantity: qty }];
  }, [lines, currentValid, product, colour, size, qty]);

  const isDelivery = method === "delivery" && deliveryEnabled;
  const subtotal = allLines.reduce(
    (a, l) => a + Number(l.product.price_amount || 0) * l.quantity,
    0
  );
  const total = subtotal + (isDelivery ? deliveryFee : 0);

  const missingBilling = BILLING_FIELDS.filter((f) => memberId && !billing[f.key]);

  const handleSubmit = async () => {
    setError("");
    if (!memberId) return setError("Select a member.");
    if (!allLines.length) return setError("Choose a product to add to the order.");
    if (missingBilling.length)
      return setError(`Add the member's ${missingBilling.map((f) => f.label.toLowerCase()).join(", ")}.`);
    if (isDelivery && !address.trim()) return setError("Enter a delivery address.");

    const payload: ICreateOrderForMemberPayload = {
      user_id: Number(memberId),
      billing: { ...billing },
      items: allLines.map((l) => ({
        market_id: l.product.market_id || l.product.market?.id || marketId || "",
        id: l.product.id as number | string,
        name: l.product.name,
        price_amount: Number(l.product.price_amount),
        price_currency: l.product.price_currency,
        quantity: l.quantity,
        product_type: l.product.product_type?.name || "",
        product_category: l.product.product_category?.name || "",
        image_url:
          (l.product.product_colours.find((c) => c.colour === l.colour)?.image_url as string) ||
          "",
        color: l.colour,
        size: l.size,
      })),
      fulfilment_method: isDelivery ? "delivery" : "pickup",
      ...(isDelivery ? { delivery_address: address.trim() } : {}),
      ...(paid
        ? { payment_mode: "manual" as const, manual_status: "success" as const }
        : {
            payment_mode: "gateway" as const,
            // Hubtel is the only enabled marketplace gateway.
            payment_type: "hubtel" as const,
            return_url: `${window.location.origin}${relativePath.member.verify_payment}`,
            cancellation_url: `${window.location.origin}${relativePath.member.orders}`,
          }),
    };

    setSubmitting(true);
    try {
      const res = await api.post.createOrderForMember(payload);
      onCreated?.();
      const data = res?.data as { checkoutUrl?: string; order_number?: string } | undefined;
      const memberName =
        [billing.first_name, billing.last_name].filter(Boolean).join(" ") || "the member";
      if (data && "checkoutUrl" in data && data.checkoutUrl) {
        const link = data.checkoutUrl;
        setCheckoutUrl(link);
        notify.success({
          title: `Order created for ${memberName}`,
          message: `${formatMoney(total)} · waiting for payment.`,
          action: {
            label: "Copy payment link",
            onClick: () => void navigator.clipboard?.writeText(link),
          },
        });
      } else {
        notify.success({
          title: `Order created for ${memberName}`,
          message: `${data?.order_number ? `${data.order_number} · ` : ""}${formatMoney(total)} · marked as paid.`,
        });
        onClose();
      }
    } catch (err) {
      setError(errorMessage(err, "Unable to place order"));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      notify.success({ title: "Link copied", duration: 3000 });
    } catch {
      notify.error({
        title: "Couldn't copy the link",
        message: "Your browser blocked the clipboard. Copy it from the field above.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 p-6 text-primary">
      <div>
        <h2 className="text-xl font-semibold">Place order for member</h2>
        <p className="text-sm text-gray-600">
          For purchases made at the church office or by phone.
        </p>
      </div>

      <SelectField
        id="create_order_member"
        label="Member"
        placeholder="Select a member"
        value={memberId}
        options={membersOptions}
        onChange={(_n, v) => pickMember(v ? String(v) : "")}
        searchable
        searchPlaceholder="Search members..."
        disabled={locked}
      />
      {memberId && !loadingMember && (
        <>
          {billing.email || billing.phone_number ? (
            <p className="-mt-2 text-xs text-gray-600">
              {[billing.email, billing.phone_number].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {missingBilling.length > 0 && !locked && (
            <div className="grid gap-3 sm:grid-cols-2">
              {missingBilling.map((f) => (
                <label key={f.key} className={labelCls}>
                  {f.label}
                  <input
                    type={f.type || "text"}
                    className={cn(inputCls, "font-normal")}
                    value={billing[f.key]}
                    onChange={(e) => setBilling((b) => ({ ...b, [f.key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}
        </>
      )}

      {lines.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-lg border border-lightGray p-3 text-sm">
          {lines.map((l, i) => {
            const c = l.product.product_colours.find((x) => x.colour === l.colour);
            return (
              <li
                key={`${l.product.id}-${l.colour}-${l.size}`}
                className="flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded border border-gray-300"
                    style={{ backgroundColor: l.colour }}
                  />
                  {l.product.name} — {colourLabel(c) || l.colour}
                  {l.size ? ` · ${l.size}` : ""} × {l.quantity}
                </span>
                {!locked && (
                  <button
                    type="button"
                    className="text-sm text-red-700"
                    onClick={() => setLines((p) => p.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <label className={labelCls}>
        Product
        <select
          className={cn(selectCls, "font-normal")}
          value={productId}
          disabled={locked}
          onChange={(e) => pickProduct(e.target.value)}
        >
          <option value="">{lines.length ? "Add another product" : "Select a product"}</option>
          {products.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name} — {formatMoney(p.price_amount)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-[1fr_1fr_90px] gap-3">
        <label className={labelCls}>
          Colour
          <select
            className={cn(selectCls, "font-normal")}
            value={colour}
            disabled={locked || !product}
            onChange={(e) => pickColour(e.target.value)}
          >
            {!product && <option value="">—</option>}
            {(product?.product_colours || []).map((c) => {
              const units = (c.stock || []).reduce((a, s) => a + (Number(s.stock) || 0), 0);
              return (
                <option key={c.colour} value={c.colour}>
                  {colourLabel(c)}
                  {managed && !units ? " (out of stock)" : ""}
                </option>
              );
            })}
          </select>
        </label>
        <label className={labelCls}>
          Size
          <select
            className={cn(selectCls, "font-normal")}
            value={size}
            disabled={locked || !product || !managed}
            onChange={(e) => {
              setSize(e.target.value);
              setQty(1);
            }}
          >
            {!managed && <option value="">{product ? "One size" : "—"}</option>}
            {managed &&
              sizeRows.map((s) => (
                <option key={s.size} value={s.size}>
                  {s.size} · {Number(s.stock) || 0} left
                </option>
              ))}
          </select>
        </label>
        <label className={labelCls}>
          Qty
          <input
            type="number"
            min={1}
            max={managed ? Math.max(1, sizeStock - inLines) : undefined}
            className={cn(selectCls, "font-normal")}
            value={qty}
            disabled={locked || !product}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
      </div>
      {product && managed && size && qty + inLines > sizeStock && (
        <p className="-mt-2 text-xs text-red-700">
          Only {Math.max(0, sizeStock - inLines)} left in this size.
        </p>
      )}
      {product && !locked && (
        <button
          type="button"
          onClick={commitLine}
          disabled={!currentValid}
          className="self-start text-sm font-medium text-blue-700 disabled:opacity-50"
        >
          + Add another product
        </button>
      )}

      <label className={labelCls}>
        Fulfilment
        <select
          className={cn(selectCls, "font-normal")}
          value={isDelivery ? "delivery" : "pickup"}
          disabled={locked}
          onChange={(e) => setMethod(e.target.value as FulfilmentMethod)}
        >
          <option value="pickup">Pickup at church</option>
          {deliveryEnabled && (
            <option value="delivery">
              Delivery{deliveryFee ? ` (+${formatMoney(deliveryFee)})` : ""}
            </option>
          )}
        </select>
      </label>
      {isDelivery && (
        <label className={labelCls}>
          Delivery address
          <textarea
            rows={2}
            className="rounded-lg border border-lightGray px-3 py-2.5 text-sm font-normal"
            value={address}
            disabled={locked}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
      )}

      <div role="radiogroup" aria-label="Payment" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <RadioCard
          on={paid}
          title="Already paid"
          sub="Paid in person · cash or transfer"
          onPick={() => setPaid(true)}
          disabled={locked}
        />
        <RadioCard
          on={!paid}
          title="Send payment link"
          sub="Member pays online via Hubtel"
          onPick={() => setPaid(false)}
          disabled={locked}
        />
      </div>

      {checkoutUrl && (
        <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
          <p className="font-semibold text-green-700">Payment link ready — share it with the member</p>
          <div className="flex gap-2">
            <input
              readOnly
              className={cn(inputCls, "font-normal")}
              value={checkoutUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className={btnSecondary} onClick={copyLink}>
              Copy
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3">
        <p className="font-semibold">Total {formatMoney(total)}</p>
        <div className="flex gap-2">
          {locked ? (
            <button type="button" className={btnPrimary} onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button type="button" className={btnSecondary} onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className={btnPrimary}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving…" : paid ? "Record order" : "Create & send link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
