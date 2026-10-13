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
  allocated = 0,
  awaitingAllocation = 0,
  onLeave = 0,
  unassigned = 0,
}) {
  const data = [
    { name: "Allocated", value: allocated },
    { name: "Awaiting Allocation", value: awaitingAllocation },
    { name: "Unassigned", value: unassigned },
    { name: "On Leave", value: onLeave },
  ];

  const COLORS = [
    "#198754", // Green: Allocated
    "#ffc107", // Yellow: Awaiting Allocation
    "#6c757d", // Grey: Unassigned
    "#dc3545", // Red: On Leave
  ];

  const total = allocated + awaitingAllocation + unassigned + onLeave;

  return (
    <div className="card shadow-sm h-100">
      <div
        className="card-header bg-white d-flex justify-content-between align-items-center"
        style={{ minHeight: "62px" }}
      >
        <h5 className="mb-0 d-flex align-items-center gap-2">
          Team Overview
          <span
            title={
              "Allocated: Every scheduled shift during the selected week has a project assignment.\n" +
              "Awaiting Allocation: Has at least one shift without a project assignment.\n" +
              "Unassigned: Has zero shifts scheduled during the selected week.\n" +
              "On Leave: Has approved leave overlapping the selected week."
            }
            aria-label="Explain team statuses"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              border: "1px solid #6c757d",
              borderRadius: "50%",
              color: "#6c757d",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "help",
            }}
          >
            ?
          </span>
        </h5>
      </div>

      <div className="card-body">
        <div style={{ height: "260px", position: "relative" }}>
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
