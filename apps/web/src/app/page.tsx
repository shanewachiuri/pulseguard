"use client"; // REQUIRED: Allows us to use the onClick handler for the crash button

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PoliciesTable } from "@/components/policies-table";
import { AnalyticsChart } from "@/components/analytics-chart";
import { AuditTimeline } from "@/components/audit-timeline";
import { FraudAlerts } from "@/components/fraud-alerts";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col p-8 min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            PulseGuard Control Center
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time AI underwriting and claims overview.
          </p>
        </div>
        <div className="flex gap-4">
          {/* NEW: Sentry Crash Test Button */}
          <Button
            variant="destructive"
            onClick={() => {
              throw new Error("Sentry Test: PulseGuard Admin Dashboard Crash!");
            }}
          >
            Test Sentry Alert
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Download Risk Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Micro-Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <p className="text-xs text-slate-500">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Automated Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh 4.2M</div>
            <p className="text-xs text-slate-500">
              Via Daraja B2C Smart Contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-sm">
              Pulse Engine Online
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart, Audit Timeline & Fraud Alerts in a 4-column layout */}
      <div className="grid gap-4 lg:grid-cols-4 mb-8">
        <AnalyticsChart />
        <AuditTimeline />

        {/* Fraud Alerts Card - Height locked to match the charts */}
        <Card className="col-span-1 shadow-sm border-slate-200 h-[300px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-800">System Alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            <FraudAlerts />
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Recent Policies
        </h2>
        <PoliciesTable />
      </div>
    </div>
  );
}
