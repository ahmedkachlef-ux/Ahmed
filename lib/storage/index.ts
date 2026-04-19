import type { AnalysisSummary, BmcAnalysis, Feedback } from "../types";

export interface Store {
  saveAnalysis(a: BmcAnalysis): Promise<void>;
  getAnalysis(id: string): Promise<BmcAnalysis | null>;
  listAnalyses(): Promise<AnalysisSummary[]>;
  deleteAnalysis(id: string): Promise<void>;
  saveFeedback(f: Feedback): Promise<void>;
  listFeedback(analysisId?: string): Promise<Feedback[]>;
}

import { fsStore } from "./fs-store";

let singleton: Store | null = null;
export function store(): Store {
  if (!singleton) singleton = fsStore();
  return singleton;
}

export function toSummary(a: BmcAnalysis): AnalysisSummary {
  const blocks = Object.values(a.blocks);
  const globalConfidence = Math.round(
    blocks.reduce((s, b) => s + b.confidence, 0) / Math.max(1, blocks.length)
  );
  return {
    id: a.id,
    name: a.company.name,
    sector: a.company.sector,
    country: a.company.country,
    createdAt: a.meta.createdAt,
    updatedAt: a.meta.updatedAt,
    globalConfidence,
    mode: a.meta.mode
  };
}
