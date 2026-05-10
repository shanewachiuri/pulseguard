"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// FIXED: Populated with realistic LangGraph agent trace logs
const auditLogs = [
  {
    time: "14:30:02",
    agent: "Orchestrator",
    action: "Received policy request for POL-8A92B",
  },
  {
    time: "14:30:05",
    agent: "Weather Node",
    action: "Fetched 30-day precipitation data for Nyeri County",
  },
  {
    time: "14:30:11",
    agent: "Risk Analyzer",
    action: "Calculated flood risk score: 12% (Low)",
  },
  {
    time: "14:30:15",
    agent: "Pricing Engine",
    action: "Set weekly premium at KSh 150",
  },
  {
    time: "14:30:18",
    agent: "Daraja Gateway",
    action: "Initiated STK Push to 254712***678",
  },
  {
    time: "14:30:45",
    agent: "Webhook Listener",
    action: "Received C2B Success Callback",
  },
  {
    time: "14:30:48",
    agent: "Orchestrator",
    action: "Activated Policy POL-8A92B",
  },
];

export function AuditTimeline() {
  return (
    <Card className="col-span-1 h-[300px] flex flex-col shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-800">
          AI Explainability Audit
        </CardTitle>
        <CardDescription>
          Live trace of LangGraph agent reasoning
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {auditLogs.map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  {i !== auditLogs.length - 1 && (
                    <div className="w-px h-full bg-slate-200 my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      {log.time}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {log.agent}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
