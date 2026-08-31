export default function WeekSelector({ selectedDate, setSelectedDate }) {
  // Move the selected date back by 7 days
  function previousWeek() {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 7);
    setSelectedDate(date);
  }

  // Move the selected date forward by 7 days
  function nextWeek() {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 7);
    setSelectedDate(date);
  }

  return (
    <>
      <div className="row">
        <div className="col text-center">
          {/* Previous week button*/}
          <button onClick={previousWeek}>←</button>

          {/* Display current selected date */}
          <h2 className="d-inline mx-3">
            {selectedDate.toLocaleDateString("en-NZ", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </h2>

          {/* Next week button*/}
          <button onClick={nextWeek}>→</button>
        </div>
      </div>
    </>
  );
}
