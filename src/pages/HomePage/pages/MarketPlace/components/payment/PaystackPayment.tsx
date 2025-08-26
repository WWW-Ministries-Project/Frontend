import { PaystackConsumer } from "react-paystack";
import { Button } from "@/components";

interface IProps {
  closeModal: () => void;
  handleVerifyPayment: (reference: string) => void;
  openModal: () => void;
  isLoading: boolean;
  data: {
    email: string;
    amount: number;
    currency: string;
  };
}
export const PaystackPayment = (props: IProps) => {
  const handleSuccess = (reference: { reference: string }) => {
    props.openModal();
    props.handleVerifyPayment(reference.reference);
  };

  const handleClose = () => {
    console.log("closed");
  };

  const config = getConfig(
    props.data.email,
    props.data.amount,
    props.data.currency
  );

  const componentProp = {
    ...config,
    text: "Paystack Button Implementation",
    onSuccess: (reference: { reference: string }) => handleSuccess(reference),
    onClose: handleClose,
  };

  return (
    <div>
      <PaystackConsumer {...componentProp}>
        {({ initializePayment }) => (
          <Button
            onClick={() => {
              props.closeModal();
              initializePayment(handleSuccess, handleClose);
            }}
            value="Confirm Order"
            loading={props.isLoading}
            disabled={props.isLoading}
          />
        )}
      </PaystackConsumer>
    </div>
  );
};

const getConfig = (email: string, amount: number, currency: string) => {
  return {
    reference: `txn_ref_${new Date().getTime().toString()}`,
    email: email,
    amount: amount * 100,
    currency: currency,
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
  };
};
