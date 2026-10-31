import { useDialogStore } from "@/pages/HomePage/store/globalComponentsStore";
import { showNotification } from "@/pages/HomePage/utils";
import { apiErrorMessage } from "@/pages/MembersPage/utils/orderLifecycle";
import { api, relativePath } from "@/utils";

/**
 * Re-opens the Hubtel checkout for an unpaid order. Resolves to true when
 * the browser is being redirected.
 */
export const startOrderPayment = async (orderId: string | number) => {
  const id = String(orderId ?? "").trim();
  if (!id) {
    showNotification("Unable to process payment for this order.", "error");
    return false;
  }
  try {
    const response = await api.post.retryOrderPayment({
      id,
      cancellation_url: `${window.location.origin}${relativePath.member.orders}`,
      return_url: `${window.location.origin}${relativePath.member.verify_payment}`,
    });
    const checkoutUrl = response?.data?.checkoutUrl;
    if (!checkoutUrl) {
      showNotification("Unable to start payment checkout.", "error");
      return false;
    }
    window.location.href = checkoutUrl;
    return true;
  } catch (error) {
    showNotification(apiErrorMessage(error, "Failed to initiate payment."), "error");
    return false;
  }
};

/** Shows the global confirmation dialog before cancelling an order. */
export const confirmCancelOrder = (
  orderNumber: string,
  onConfirm: () => void
) => {
  const dialog = useDialogStore.getState();
  dialog.setDialog({
    name: orderNumber,
    title: `Cancel order ${orderNumber}?`,
    message:
      "Your reserved items will be released. This action cannot be undone.",
    confirmLabel: "Cancel order",
    showModal: true,
    onConfirm: () => {
      onConfirm();
      dialog.dialogDataReset();
    },
    onCancel: dialog.dialogDataReset,
  });
};

export const cancelOrderRequest = async (orderId: string | number) => {
  try {
    await api.put.cancelOrder({ id: String(orderId) });
    showNotification("Order cancelled.", "success");
    return true;
  } catch (error) {
    showNotification(apiErrorMessage(error, "Failed to cancel order."), "error");
    return false;
  }
};
