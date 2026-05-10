"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// FIXED: Added realistic mock financial data
const data = [
  { name: "Jan", premiums: 450000, payouts: 120000 },
  { name: "Feb", premiums: 520000, payouts: 150000 },
  { name: "Mar", premiums: 610000, payouts: 80000 },
  { name: "Apr", premiums: 590000, payouts: 250000 },
  { name: "May", premiums: 750000, payouts: 180000 },
  { name: "Jun", premiums: 820000, payouts: 140000 },
];

export function AnalyticsChart() {
  return (
    <Card className="col-span-2 shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-800">Financial Overview</CardTitle>
        <CardDescription>
          Monthly M-Pesa Premiums vs. Smart Contract Payouts (KSh)
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `KSh ${value / 1000}k`}
              />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              {/* FIXED: Added correct array format for bar border radius [top-left, top-right, bottom-right, bottom-left] */}
              <Bar
                dataKey="premiums"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
                name="Premiums Collected"
              />
              <Bar
                dataKey="payouts"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name="Claims Paid"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
