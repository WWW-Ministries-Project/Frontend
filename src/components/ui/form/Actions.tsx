import { Button } from "@/components/Button";

interface IProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
}

export const Actions = ({ onCancel, onSubmit, loading }: IProps) => {
  return (
    <div className="col-span-2 flex justify-end gap-4 pt-4 border-t border-gray-200 mt-4">
      <Button
        value="Cancel"
        variant="secondary"
        onClick={onCancel}
        disabled={loading}
      />
      <Button
        value="Submit"
        variant="primary"
        type="submit"
        disabled={loading}
        loading={loading}
        onClick={onSubmit}
      />
    </div>
  );
};
