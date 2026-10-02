import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

export default function TeamOverview({
  onShift = 4,
  available = 2,
  onLeave = 1,
  unassigned = 0,
}) {
  const data = [
    { name: "On Shift", value: onShift },
    { name: "Available", value: available },
    { name: "On Leave", value: onLeave },
    { name: "Unassigned", value: unassigned },
  ];

  const total = onShift + available + onLeave + unassigned;

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white">
        <h5 className="mb-0">Team Overview</h5>
      </div>

      <div className="card-body">
        <div
          style={{
            height: "230px",
            position: "relative",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div className="fs-3 fw-bold">{total}</div>

            <div className="text-muted small">Team Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
