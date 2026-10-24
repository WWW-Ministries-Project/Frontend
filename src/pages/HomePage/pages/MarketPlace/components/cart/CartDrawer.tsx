import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { api, relativePath } from "@/utils";

import { useCart } from "../../utils/cartSlice";
import { useCartDetails } from "../../utils/useCartDetails";
import { formatMoney } from "../../utils/marketplaceModel";
import { ProductTile } from "../storefront/ProductTile";
import {
  DEFAULT_SWATCH,
  productPath,
  variantLabel,
  type StorefrontCartItem,
} from "../storefront/storefrontModel";
import EmptyCartComponent from "./EmptyCartComponent";
import { useCartAutoClose } from "./useCartAutoClose";

/** Right-hand cart drawer (member shell). */
export default function CartDrawer() {
  const cartOpen = useCart((s) => s.cartOpen);
  const toggleCart = useCart((s) => s.toggleCart);
  const removeFromCart = useCart((s) => s.removeFromCart);
  const updateSection = useCart((s) => s.updateSection);
  const disarmAutoClose = useCart((s) => s.disarmAutoClose);
  const autoCloseArmed = useCart((s) => s.cartAutoCloseArmed);
  const { items, totalPrice } = useCartDetails();

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const autoCloseHandlers = useCartAutoClose(drawerRef);

  // Delivery config only matters for the footer note; fetch it the first
  // time the drawer opens rather than on every member page.
  const { data: delivery, refetch: loadDelivery } = useFetch(
    api.fetch.fetchDeliveryConfig,
    undefined,
    true,
    { silent: true }
  );
  const deliveryRequested = useRef(false);
  useEffect(() => {
    if (cartOpen && !deliveryRequested.current) {
      deliveryRequested.current = true;
      loadDelivery();
    }
  }, [cartOpen, loadDelivery]);

  // Opened from the cart icon: move focus into the drawer. Not after an
  // add-to-cart, where focus inside would pause the auto-close countdown.
  useEffect(() => {
    if (cartOpen && !autoCloseArmed) closeRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartOpen]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleCart(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [cartOpen, toggleCart]);

  if (!cartOpen) return null;

  const units = items.reduce((a, i) => a + i.quantity, 0);
  const close = () => toggleCart(false);
  const go = (path: string) => {
    disarmAutoClose();
    toggleCart(false);
    navigate(path);
  };

  const setQuantity = (item: StorefrontCartItem, next: number) => {
    disarmAutoClose();
    if (next <= 0) {
      removeFromCart(item.item_uuid!);
      return;
    }
    updateSection(item.item_uuid!, "quantity", next);
  };

  const deliveryEnabled = Boolean(delivery?.data?.delivery_enabled);

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      <div
        className="absolute inset-0 bg-primary/45"
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="relative flex h-full w-[min(440px,100vw)] flex-col bg-white text-primary shadow-[-12px_0_32px_rgb(var(--color-shadow)_/_0.18)]"
        {...autoCloseHandlers}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold">
            Your cart · {units} {units === 1 ? "item" : "items"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-primary hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyCartComponent />
        ) : (
          <>
            <div className="flex flex-1 flex-col overflow-y-auto px-6 py-2">
              {items.map((raw) => {
                const item = raw as StorefrontCartItem;
                const max = item.stock ?? Number.POSITIVE_INFINITY;
                const canInc = item.quantity < max;
                const variant = variantLabel(item.colour_name || "", item.size);
                return (
                  <div key={item.item_uuid} className="flex gap-3.5 border-b border-gray-100 py-4">
                    <button
                      type="button"
                      onClick={() => go(productPath(item.product_id, false))}
                      aria-label={`View ${item.name}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-lg p-0"
                    >
                      <ProductTile
                        hex={item.color || DEFAULT_SWATCH}
                        imageUrl={item.image_url}
                        alt=""
                        className="h-full w-full"
                      />
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <span className="whitespace-nowrap text-sm font-semibold">
                          {formatMoney(item.price_amount * item.quantity)}
                        </span>
                      </div>
                      <p className="flex flex-wrap items-center gap-1.5 text-sm text-primaryGray">
                        {!item.colour_name && item.color && (
                          <span
                            className="inline-block h-3 w-3 rounded-full shadow-[0_0_0_1px_rgb(var(--color-lightGray))]"
                            style={{ background: item.color }}
                            aria-hidden="true"
                          />
                        )}
                        {[variant, formatMoney(item.price_amount)].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex h-9 items-center rounded-lg border border-lightGray">
                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity - 1)}
                            aria-label={`Decrease ${item.name} quantity`}
                            className="h-full w-9 text-base text-primary"
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => canInc && setQuantity(item, item.quantity + 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            disabled={!canInc}
                            title={canInc ? undefined : "No more stock available"}
                            className="h-full w-9 text-base text-primary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            disarmAutoClose();
                            removeFromCart(item.item_uuid!);
                          }}
                          className="text-sm text-red-700 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-5">
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatMoney(totalPrice)}</span>
              </div>
              <p className="text-sm text-primaryGray">
                {deliveryEnabled
                  ? "Delivery is chosen at checkout. Pickup at church is free."
                  : "Pickup at church is free."}
              </p>
              <button
                type="button"
                onClick={() => go(relativePath.member.checkOut)}
                className="min-h-12 rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary/90"
              >
                Checkout
              </button>
              <button
                type="button"
                onClick={close}
                className="min-h-10 rounded-lg text-sm font-medium text-primary underline"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
