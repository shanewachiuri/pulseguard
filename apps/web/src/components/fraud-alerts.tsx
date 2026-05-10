"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export function FraudAlerts() {
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <ShieldAlert className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 font-bold">
          High Risk: Telematics Spoofing
        </AlertTitle>
        <AlertDescription className="text-red-700 text-xs mt-1">
          Policy POL-892 shows impossible GPS velocity (Sensor spoofing
          suspected). Payouts temporarily frozen.
        </AlertDescription>
      </Alert>

      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="font-bold">Warning: Velocity Check</AlertTitle>
        <AlertDescription className="text-amber-700 text-xs mt-1">
          Multiple onboarding attempts from the same IP address detected in the
          last 60 seconds. Rate limiter engaged.
        </AlertDescription>
      </Alert>
    </div>
  );
}
