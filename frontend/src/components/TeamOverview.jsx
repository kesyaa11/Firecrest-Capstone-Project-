import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Label,
} from "recharts";

export default function TeamOverview({
  onShift = 0,
  available = 0,
  onLeave = 0,
  unassigned = 0,
}) {
  const data = [
    { name: "On Shift", value: onShift },
    { name: "Available", value: available },
    { name: "On Leave", value: onLeave },
    { name: "Unassigned", value: unassigned },
  ];

  const COLORS = [
    "#0d6efd", // On Shift
    "#198754", // Available
    "#dc3545", // On Leave
    "#6c757d", // Unassigned
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
            height: "260px",
            position: "relative",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={75}
                outerRadius={105}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} />
                ))}

                <Label
                  value={total}
                  position="center"
                  dy={-10}
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    fill: "#111",
                  }}
                />

                <Label
                  value="Team Members"
                  position="center"
                  dy={18}
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    fill: "#111",
                  }}
                />
              </Pie>

              <Tooltip />

              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value) => (
                  <span style={{ color: "#000" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
