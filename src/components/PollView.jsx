const PollView = ({ post, currentUser }) => {
  const handlePollVote = (id) => {};

  return (
    <div className="mb-2">
      <div className="border rounded-3 p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">Poll</h6>
          <small className="text-muted">
            {(() => {
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
              const minutesLeft = Math.floor(
                (timeLeft % (1000 * 60 * 60)) / (1000 * 60),
              );

              if (hoursLeft > 0) {
                return `${hoursLeft}h ${minutesLeft}m left`;
              } else {
                return `${minutesLeft}m left`;
              }
            })()}
          </small>
        </div>

        {post.poll?.options.map((option, index) => {
          const canVote =
            currentUser && !post.poll?.hasUserVoted && !post.poll?.isExpired;

          return (
            <div
              key={option.id || index}
              className={`position-relative border rounded-3 p-2 mb-2 ${
                canVote ? "cursor-pointer" : ""
              } ${
                option.isUserChoice
                  ? "border-primary bg-primary bg-opacity-10"
                  : "border-secondary"
              }`}
              style={{
                cursor: canVote ? "pointer" : "default",
                overflow: "hidden",
              }}
              onClick={() => canVote && handlePollVote(option.id)}
            >
              {/* Progress bar background */}
              <div
                className="position-absolute top-0 start-0 h-100 bg-light"
                style={{
                  width: `${option.percentage}%`,
                  opacity: 0.3,
                  zIndex: 1,
                }}
              />

              <div
                className="position-relative d-flex justify-content-between align-items-center"
                style={{ zIndex: 2 }}
              >
                <span
                  className={`${option.isUserChoice ? "fw-bold text-primary" : ""}`}
                >
                  {option.text}
                  {option.isUserChoice && " ✓"}
                </span>
                <span className="text-muted small">
                  {option.percentage}% ({option.votes})
                </span>
              </div>
            </div>
          );
        })}

        <div className="text-muted small mt-2">
          {post.poll.totalVotes} votes
        </div>
      </div>
    </div>
  );
};

export default PollView;