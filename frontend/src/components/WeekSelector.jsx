export default function WeekSelector({
  selectedDate,
  setSelectedDate,
  displayLabel,
  stepDays = 7,
}) {
  // Move the selected date back by stepDays (a week unless the page uses a longer period)
  function previousWeek() {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - stepDays);
    setSelectedDate(date);
  }

  // Move the selected date forward by stepDays
  function nextWeek() {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + stepDays);
    setSelectedDate(date);
  }

  return (
    <>
      <div className="row">
        <div className="col text-center">
          {/* Previous week button*/}
          <button onClick={previousWeek}>←</button>

          {/* Display custom label which is page dependent or current selected date */}
          {displayLabel ? (
            <span className="mx-3">{displayLabel}</span>
          ) : (
            <h2 className="d-inline mx-3">
              {selectedDate.toLocaleDateString("en-NZ", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </h2>
          )}

          {/* Next week button*/}
          <button onClick={nextWeek}>→</button>
        </div>
      </div>
    </>
  );
}
