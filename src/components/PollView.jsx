import { useCallback, useState } from "react";
import { Spinner, Button, Alert } from "react-bootstrap";
import { pollAPI } from "../config/ApiConfig";

const PollView = ({ post, currentUser, ...props }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handlePollVote = useCallback(async () => {
    if (!currentUser || post.poll.hasUserVoted || post.poll.isExpired) return;
    if (selectedOptions.length === 0) {
      setError("Please select at least one option");
      return;
    }

    try {
      setIsVoting(true);
      setError(null);
      const response = await pollAPI.vote(post.poll?.id, selectedOptions);

      if (response.votes) {
        setVoteSuccess(true);
      } else {
        setVoteSuccess(false);
        setError("Failed to submit vote. Please try again.");
      }
    } catch (error) {
      setError("Failed to submit vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  }, [currentUser, post.poll, selectedOptions]);

  const toggleOptionSelection = (id) => {
    if (!currentUser || post.poll.hasUserVoted || post.poll.isExpired) return;

    if (post.poll.allowMultiple) {
      // For multiple selection: toggle the option
      setSelectedOptions((prev) =>
        prev.includes(id)
          ? prev.filter((optionId) => optionId !== id)
          : [...prev, id],
      );
    } else {
      // For single selection: replace the selection
      setSelectedOptions([id]);
    }
  };

  const isOptionSelected = (id) => selectedOptions.includes(id);

  const formatTimeLeft = () => {
    if (post.poll?.isExpired) {
      return "Poll ended";
    }

    const now = new Date();
    const endTime = new Date(post.poll?.expiresAt);
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
      return "Poll ended";
    }

    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m left`;
    } else {
      return `${minutesLeft}m left`;
    }
  };

  const canVote =
    currentUser &&
    !post.poll?.hasUserVoted &&
    !post.poll?.isExpired &&
    !voteSuccess;

  return (
    <div className="mb-2" {...props}>
      <div className="border rounded-3 p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">Poll</h6>
          <small className="text-muted">{formatTimeLeft()}</small>
        </div>
        {post.poll?.options.map((option, index) => {
          const selected = isOptionSelected(option.id);

          return (
            <div
              key={option.id || index}
              className={`position-relative border rounded-3 p-2 mb-2 ${
                canVote ? "cursor-pointer hover-effect" : ""
              } ${
                selected
                  ? "border-primary bg-primary bg-opacity-10"
                  : option.isUserChoice
                  ? "border-success bg-success text-white bg-opacity-10"
                  : "border-secondary"
              }`}
              style={{
                cursor: canVote ? "pointer" : "default",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
              onClick={() => canVote && toggleOptionSelection(option.id)}
            >
              {/* Progress bar background */}
              <div
                className="position-absolute top-0 start-0 h-100 bg-success text-white bg-opacity-25"
                style={{
                  width: `${option.percentage}%`,
                  zIndex: 1,
                }}
              />

              <div
                className="position-relative d-flex justify-content-between align-items-center"
                style={{ zIndex: 2 }}
              >
                <span
                  className={`${selected ? "fw-bold text-primary" : option.isUserChoice ? "fw-bold text-success" : ""}`}
                >
                  {option.text}
                </span>
                <span className={`small ${selected ? "text-primary" : option.isUserChoice ? "text-success" : "text-muted"}`}>
                  {option.percentage}% ({option.votes})
                </span>
              </div>
            </div>
          );
        })}

        {error && (
          <Alert variant="danger" className="py-2">
            {error}
          </Alert>
        )}

        {voteSuccess && (
          <Alert variant="success" className="py-2">
            Your vote has been recorded!
          </Alert>
        )}

        {canVote && selectedOptions.length > 0 && (
          <div className="align-items-end w-100 mt-2">
            <Button size="sm" onClick={handlePollVote} disabled={isVoting}>
              {isVoting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Voting...
                </>
              ) : (
                `Confirm Vote${post.poll.allowMultiple && selectedOptions.length > 1 ? ` (${selectedOptions.length})` : ""}`
              )}
            </Button>
          </div>
        )}

        <div className="text-muted small mt-2">
          {post.poll.totalVotes} votes
          {post.poll.allowMultiple && " • Multiple choices allowed"}
        </div>
      </div>

      <style jsx>{`
        .hover-effect:hover {
          background-color: rgba(0, 0, 0, 0.03);
          transform: translateY(-1px);
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default PollView;
