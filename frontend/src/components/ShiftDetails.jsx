export default function ShiftDetails(props) {
  return (
    <div className="d-flex flex-column">
      <p>Employee: {props.user.name}</p>
      <p>Date: {props.shift.shift_date}</p>
      <p>Time: {props.shift.duration_hours}</p>
      <p>Project: Project ABC</p>
      <p>Status: Confirmed </p>
    </div>
  );
}
