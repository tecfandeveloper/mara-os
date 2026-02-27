"use client";

import { useState } from "react";
import {
  MessageCircle,
  Twitter,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Integration {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "configured" | "not_configured";
  icon: string;
  lastActivity: string | null;
  detail?: string | null;
}

interface IntegrationStatusProps {
  integrations: Integration[] | null;
  onRefresh?: () => void;
}

const REAUTH_LINKS: Record<string, { label: string; url: string }> = {
  telegram: {
    label: "Configurar Telegram",
    url: "https://core.telegram.org/bots#creating-a-new-bot",
  },
  twitter: {
    label: "Configurar bird CLI",
    url: "https://github.com/nicdex/bird-cli",
  },
  google: {
    label: "Autenticar GOG / Gemini",
    url: "https://github.com/google-gemini/gog#authentication",
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Twitter,
  Mail,
};

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    label: "Connected",
  },
  disconnected: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "Disconnected",
  },
  configured: {
    icon: CheckCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    label: "Configured",
  },
  not_configured: {
    icon: AlertCircle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    label: "Not Configured",
  },
};

export function IntegrationStatus({ integrations, onRefresh }: IntegrationStatusProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({});

  const runTest = async (id: string) => {
    setTestingId(id);
    setTestResult((prev) => ({ ...prev, [id]: { ok: false, message: "" } }));
    try {
      const res = await fetch("/api/system/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult((prev) => ({ ...prev, [id]: { ok: data.ok, message: data.message || "" } }));
      } else {
        setTestResult((prev) => ({ ...prev, [id]: { ok: false, message: data.error || "Test failed" } }));
      }
      onRefresh?.();
    } catch (e) {
      setTestResult((prev) => ({ ...prev, [id]: { ok: false, message: "Request failed" } }));
    } finally {
      setTestingId(null);
    }
  };

  if (!integrations) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-800 rounded"></div>
          <div className="h-16 bg-gray-800 rounded"></div>
          <div className="h-16 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-emerald-400" />
        Integrations
      </h2>

      <div className="space-y-3">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.icon] || MessageCircle;
          const status = statusConfig[integration.status];
          const StatusIcon = status.icon;
          const testing = testingId === integration.id;
          const result = testResult[integration.id];
          const reauth = REAUTH_LINKS[integration.id];

          return (
            <div
              key={integration.id}
              className={`flex flex-col gap-2 p-4 rounded-lg border ${status.bg} ${status.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{integration.name}</div>
                    {(integration.lastActivity || integration.detail) && (
                      <div className="text-xs text-gray-400">
                        {integration.lastActivity && (
                          <>
                            Last activity:{" "}
                            {formatDistanceToNow(new Date(integration.lastActivity), {
                              addSuffix: true,
                            })}
                          </>
                        )}
                        {integration.detail && !integration.lastActivity && integration.detail}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => runTest(integration.id)}
                    disabled={testing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    {testing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wrench className="w-3.5 h-3.5" />
                    )}
                    Probar
                  </button>
                  {(integration.status === "not_configured" || integration.status === "disconnected") &&
                    reauth && (
                      <a
                        href={reauth.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {reauth.label}
                      </a>
                    )}
                  <div className={`flex items-center gap-2 ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{status.label}</span>
                  </div>
                </div>
              </div>

              {result && (
                <div
                  className={`text-xs pl-12 ${
                    result.ok ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {result.ok ? "OK" : ""} {result.message}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
