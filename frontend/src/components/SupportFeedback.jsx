import { useState } from "react";

export default function SupportFeedback() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="card border mb-4">
      <div className="card-header bg-light">
        <h4 className="mb-0">Send Feedback</h4>
      </div>

      <div className="card-body">
        {submitted ? (
          <div className="alert alert-success mb-0">
            Thank you. Your feedback has been submitted for review.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Feedback Type</label>

              <select className="form-select" required>
                <option value="">Select an option</option>
                <option value="bug">Report an Issue</option>
                <option value="suggestion">Suggest an Improvement</option>
                <option value="help">Request Assistance</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Subject</label>

              <input
                type="text"
                className="form-control"
                placeholder="Brief description"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Message</label>

              <textarea
                className="form-control"
                rows="5"
                placeholder="Tell us more..."
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
