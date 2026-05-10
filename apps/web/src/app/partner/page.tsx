"use client";

import { useState } from "react";

export default function PartnerPortal() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/setup-test-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookUrl || "https://example.com/webhook",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKey(data.your_api_key);
      }
    } catch (error) {
      console.error("Failed to generate keys", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold">PulseGuard Partner Portal</h1>
          <p className="text-slate-400 mt-2">
            Manage your API keys and webhook configurations.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL (Where we send payment/payout events)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourcompany.com/pulseguard/webhook"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          <button
            onClick={generateKeys}
            disabled={isLoading}
            className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate API Credentials"}
          </button>

          {apiKey && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2">
                Your Secret API Key
              </h3>
              <code className="block bg-yellow-100 p-3 rounded text-yellow-900 font-mono text-sm break-all">
                {apiKey}
              </code>
              <p className="text-xs text-yellow-700 mt-2">
                ⚠️ Keep this safe. Send this in the{" "}
                <code className="font-bold">x-api-key</code> header of your
                requests.
              </p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-green-600 hover:text-green-800 font-medium inline-flex items-center"
            >
              View Interactive API Documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
