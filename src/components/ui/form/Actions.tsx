import { Button } from "@/components/Button";

interface IProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
  SubmitLabel?: string
  goNext?: () => void
  goBack?: () => void
}

export const Actions = ({
  onCancel,
  onSubmit,
  loading,
  SubmitLabel = "Submit",
  goNext,
  goBack,
}: IProps) => {
  return (
    <div className="col-span-2 flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
      {/* Left: Step navigation */}
      <div className="flex gap-4">
        {goBack && (
          <Button
            value="Back"
            variant="secondary"
            onClick={goBack}
            disabled={loading}
          />
        )}

        {goNext && (
          <Button
            value="Next"
            variant="primary"
            onClick={goNext}
            disabled={loading}
          />
        )}
      </div>

      {/* Right: Global actions */}
      <div className="flex gap-4">
        <Button
          value="Cancel"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          value={SubmitLabel}
          variant="primary"
          type="submit"
          disabled={loading}
          loading={loading}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
};
