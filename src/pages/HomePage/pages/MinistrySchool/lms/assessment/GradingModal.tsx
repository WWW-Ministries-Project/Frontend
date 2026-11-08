import { FullGrading } from "./FullGrading";

/**
 * Backwards-compatible wrapper: the grading UI is now the full-panel
 * {@link FullGrading} view. Grades one submission with no prev/next queue.
 */
export const GradingModal = ({
  submissionId,
  onClose,
  onGraded,
}: {
  submissionId: number;
  onClose: () => void;
  onGraded: () => void;
}) => <FullGrading queue={[submissionId]} startIndex={0} onClose={onClose} onGraded={onGraded} />;

export default GradingModal;
