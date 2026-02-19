import { Button } from "@/components/Button";

interface IProps {
  onCancel: () => void;
  onSubmit?: () => void;
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
    <div className="col-span-full mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-lightGray pt-4">
      <div className="flex items-center gap-3">
        {goBack && (
          <Button
            value="Back"
            variant="secondary"
            onClick={goBack}
            disabled={loading}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          value="Cancel"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        />
        {onSubmit && (
          <Button
            value={SubmitLabel}
            variant="primary"
            type="submit"
            disabled={loading}
            loading={loading}
            onClick={onSubmit}
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
    </div>
  );
};
