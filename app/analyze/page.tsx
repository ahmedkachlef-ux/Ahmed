"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ProgressSteps } from "@/components/search/ProgressSteps";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import type { ProgressEvent } from "@/lib/types";

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [current, setCurrent] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(input: {
    company: string;
    country?: string;
    sector?: string;
    website?: string;
    language?: "fr" | "en" | "ar";
  }) {
    setLoading(true);
    setEvents([]);
    setCurrent(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input)
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resultId: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "progress") {
              setEvents((prev) => [...prev, msg.event]);
              setCurrent(msg.event);
            } else if (msg.type === "result") {
              resultId = msg.id;
            } else if (msg.type === "error") {
              setError(msg.message);
            }
          } catch {
            // ignore broken lines
          }
        }
      }

      if (resultId) {
        router.push(`/result/${resultId}`);
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle analyse</h1>
        <p className="mt-1 text-sm text-ink-400">
          Saisissez le nom de l'entreprise. Ajoutez des filtres pour lever toute ambiguïté.
        </p>
      </div>

      <Card>
        <CardContent>
          <SearchBar onSubmit={start} loading={loading} />
        </CardContent>
      </Card>

      {(loading || events.length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pipeline en cours</CardTitle>
            <CardDescription>
              Recherche, collecte, génération, validation et analyse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressSteps events={events} current={current} />
            {error && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
