export default function ProgressIndicators({
  specification,
  specificationChangeRequests = [],
  onProgressChange,
  onViewChangeRequest,
  disabled = false,
}) {

  function getChangeRequest(stage) {
    return specificationChangeRequests.find(
      (request) =>
        request.specification_id === specification.id &&
        request.stage === stage &&
        request.resolved === false
    );
  }

  const stages = [
    { field: "roadmap", name: "Roadmap" },
    { field: "specs", name: "Specs" },
    { field: "build", name: "Build" },
    { field: "test_sheet", name: "Test" },
    { field: "launch_plan", name: "Launch" },
  ];

  return (
    <>
      {stages.map((stage) => {

        const changeRequest =
          getChangeRequest(stage.name);

        return (
          <td
            key={stage.field}
            className="text-center align-middle"
            style={{
              width: "90px",
              minWidth: "90px",
              height: "64px",
              paddingTop: 0,
              paddingBottom: 0,
            }}
          >

            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                height: "64px",
                position: "relative",
              }}
            >

              {/* Checkbox */}
              <input
                className="form-check-input m-0"
                type="checkbox"
                checked={Boolean(specification[stage.field])}
                disabled={disabled}
                onChange={(event) =>
                  onProgressChange(
                    specification,
                    stage.field,
                    event.target.checked
                  )
                }
              />


              {/* Warning icon area */}
              <div
                style={{
                  position: "absolute",
                  left: "calc(50% + 14px)",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                {changeRequest && (
                  <button
                    type="button"
                    className="btn btn-link text-warning p-0 border-0"
                    title="View requested changes"
                    onClick={() =>
                      onViewChangeRequest(
                        changeRequest
                      )
                    }
                    style={{
                      width: "24px",
                      height: "24px",
                      lineHeight: 1,
                    }}
                  >
                    ⚠
                  </button>
                )}

              </div>

            </div>

          </td>
        );
      })}
    </>
  );
}