"use client";
import { confidenceLabel, statusLabel } from "@/lib/utils";
import { Badge } from "../ui/Badge";

export function ConfidenceBadge({
  score,
  status
}: {
  score: number;
  status: "verified" | "estimated" | "incomplete";
}) {
  const tone =
    score >= 75 ? "success" : score >= 45 ? "warning" : "danger";
  return (
    <div className="flex items-center gap-1.5">
      <Badge tone={tone as any}>{confidenceLabel(score)} · {score}</Badge>
      <Badge
        tone={
          status === "verified"
            ? "success"
            : status === "estimated"
              ? "warning"
              : "danger"
        }
      >
        {statusLabel(status)}
      </Badge>
    </div>
  );
}
