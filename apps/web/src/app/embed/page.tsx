"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function WidgetContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Retrieve parameters passed by the partner via the iframe URL
  const partnerKey = searchParams.get("key") || "test_partner_key_123";
  const phone = searchParams.get("phone") || "";
  const coverageType = searchParams.get("type") || "Parametric Crop Cover";
  const premium = searchParams.get("premium") || "50";

  const handleOptIn = async () => {
    setIsLoading(true);
    try {
      // Call our FastAPI Embedded endpoint
      const res = await fetch(
        "http://localhost:8000/api/v1/embedded/issue-policy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": partnerKey,
          },
          body: JSON.stringify({
            phone: phone,
            coverageType: coverageType,
            premiumAmount: Number(premium),
            contextData: "Embedded Checkout Widget Opt-in",
          }),
        },
      );

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
    setIsLoading(false);
  };

  if (status === "success") {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center font-sans w-full h-full flex flex-col justify-center">
        <h3 className="text-green-800 font-bold text-lg">
          Protected by PulseGuard ✓
        </h3>
        <p className="text-sm text-green-600 mt-1">
          Check your phone to complete the M-Pesa PIN prompt.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm font-sans flex items-center justify-between w-full h-full">
      <div>
        <h3 className="font-bold text-gray-800">Add {coverageType}?</h3>
        <p className="text-xs text-gray-500 mt-1">
          Instant payout guaranteed via smart contract.
        </p>
      </div>
      <button
        onClick={handleOptIn}
        disabled={isLoading || !phone}
        className="px-4 py-2 bg-green-600 text-white font-bold rounded-md shadow hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Wait..." : `+ KSh ${premium}`}
      </button>
    </div>
  );
}

export default function EmbeddedWidget() {
  return (
    // Suspense is required by Next.js 15 when using useSearchParams in a client component
    <Suspense
      fallback={
        <div className="p-4 text-center text-gray-500">
          Loading PulseGuard...
        </div>
      }
    >
      <WidgetContent />
    </Suspense>
  );
}
