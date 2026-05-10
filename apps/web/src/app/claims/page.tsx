"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// 1. Define exactly what a Claim looks like for strict TypeScript checking
type Claim = {
  id: string;
  type: string;
  phone: string;
  date: string;
  aiConfidence: string;
};

// 2. Apply the type to our mock data array
const pendingClaims: Claim[] = [
  {
    id: "CLM-9921A",
    type: "Maize Crop Damage (Flood)",
    phone: "254712***678",
    date: "2026-05-01",
    aiConfidence: "42% - Blurry",
  },
  {
    id: "CLM-4482B",
    type: "Livestock Loss",
    phone: "254722***101",
    date: "2026-05-02",
    aiConfidence: "55% - Needs Verification",
  },
  {
    id: "CLM-1193C",
    type: "Bodaboda Accident",
    phone: "254733***444",
    date: "2026-05-03",
    aiConfidence: "38% - Missing Timestamp",
  },
];

export default function ClaimsDashboard() {
  // 3. Update state to accept either a Claim object or null
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  // 4. Update the parameter type from 'any' to 'Claim'
  const handleReview = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsReviewOpen(true);
  };

  const handleDecision = (decision: "APPROVE" | "REJECT") => {
    // Safety check: Ensure we actually have a claim selected before proceeding
    if (!selectedClaim) return;

    console.log(
      `Claim ${selectedClaim.id} marked as ${decision}. Notes: ${reviewNotes}`,
    );

    // Trigger the beautiful new toast!
    if (decision === "APPROVE") {
      toast.success(
        `Claim ${selectedClaim.id} Approved! M-Pesa payout initiated.`,
      );
    } else {
      toast.error(`Claim ${selectedClaim.id} Rejected.`);
    }

    setIsReviewOpen(false);
    setReviewNotes("");
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Claims Triage</h1>
          <p className="text-slate-500 mt-1">
            Review claims flagged by the Pulse AI Engine.
          </p>
        </div>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          &larr; Back to Main Dashboard
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Pending Manual Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">
                    {claim.id} - {claim.type}
                  </span>
                  <span className="text-sm text-slate-500">
                    Client: {claim.phone} | Date: {claim.date}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end mr-4">
                    <span className="text-xs text-slate-500 mb-1">
                      AI Confidence
                    </span>
                    <Badge
                      variant="outline"
                      className="text-yellow-700 border-yellow-300 bg-yellow-50"
                    >
                      {claim.aiConfidence}
                    </Badge>
                  </div>
                  <Button onClick={() => handleReview(claim)}>
                    Inspect Evidence
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Claim: {selectedClaim?.id}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="w-full h-[250px] bg-slate-100 rounded-md flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
              [ User Uploaded Image Evidence ]
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Adjuster Notes (Required for Audit Trail)
              </label>
              <Textarea
                placeholder="Enter your rationale for approving or rejecting this claim..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => handleDecision("REJECT")}
              disabled={!reviewNotes}
            >
              Reject Claim
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleDecision("APPROVE")}
              disabled={!reviewNotes}
            >
              Approve & Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
