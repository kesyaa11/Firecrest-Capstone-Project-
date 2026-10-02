import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export default function ProjectAllocation({ data = [] }) {
  const COLORS = ["#0d6efd", "#dc3545", "#198754", "#6f42c1", "#fd7e14"];

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white">
        <h5 className="mb-0">Project Allocation</h5>
      </div>

      <div className="card-body">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" domain={[0, 5]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />

            <Bar dataKey="members" name="Team Members">
              <LabelList
                dataKey="members"
                position="right"
                fill="#000"
                offset={8}
              />
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
