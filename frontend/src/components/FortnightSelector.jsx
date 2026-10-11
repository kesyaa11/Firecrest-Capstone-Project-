export default function FortnightSelector({ selectedDate, setSelectedDate }) {
  // Calculate start date of the selected fortnight
  const getFortnightStart = (date) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // Start fortnight on a Monday
    const day = startDate.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;

    startDate.setDate(startDate.getDate() - daysFromMonday);

    return startDate;
  };

  // Calculate the end date of the selected fortnight
  const getFortnightEnd = (date) => {
    const endDate = getFortnightStart(date);

    endDate.setDate(endDate.getDate() + 13);
    endDate.setHours(23, 59, 59, 999);

    return endDate;
  };

  // Move to the prev fortnight
  function previousFortnight() {
    const date = getFortnightStart(selectedDate);
    date.setDate(date.getDate() - 14);

    setSelectedDate(date);
  }

  // Move to the next fortnight
  function nextFortnight() {
    const date = getFortnightStart(selectedDate);
    date.setDate(date.getDate() + 14);

    setSelectedDate(date);
  }

  const startDate = getFortnightStart(selectedDate);
  const endDate = getFortnightEnd(selectedDate);

  // Format the fortnight dates for display
  const fortnightLabel = `${startDate.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
  })} - ${endDate.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  return (
    <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
      <button onClick={previousFortnight}>←</button>

      <span className="fw-semibold">{fortnightLabel}</span>

      <button onClick={nextFortnight}>→</button>
    </div>
  );
}
