import type { ProgressEvent, BmcAnalysis } from "../types";
import { bmcJsonSchema, type BmcResponse } from "../bmc-schema";
import { SYSTEM_PROMPT, userPrompt } from "./prompts";
import { extractText, parseAndRepair, coherenceWarnings } from "./validators";
import { rankSources } from "../sources/ranking";
import { getAnthropic, MODEL, EFFORT, isLiveMode } from "./client";
import { mockBmc } from "./mock";
import { shortId } from "../utils";

export interface RunInput {
  company: string;
  country?: string;
  sector?: string;
  website?: string;
  language?: "fr" | "en" | "ar";
}

/**
 * Run the full BMC generation pipeline and emit progress events as they happen.
 * The caller supplies an `emit` callback — typically pushing into a ReadableStream.
 */
export async function runPipeline(
  input: RunInput,
  emit: (ev: ProgressEvent) => void
): Promise<BmcAnalysis> {
  const started = Date.now();
  const emitStep = (
    step: ProgressEvent["step"],
    message: string,
    percent: number,
    detail?: unknown
  ) =>
    emit({
      step,
      message,
      percent,
      at: new Date().toISOString(),
      detail
    });

  emitStep("started", `Analyse de « ${input.company} » démarrée`, 2);
  emitStep("search", "Identification des sources publiques pertinentes…", 12);
  emitStep("collect", "Collecte des signaux (officiel, réglementaire, presse)…", 28);

  let bmc: BmcResponse;
  let mode: "live" | "mock" = "mock";
  const client = getAnthropic();

  if (client && isLiveMode()) {
    mode = "live";
    emitStep("generate", `Génération via ${MODEL} (effort=${EFFORT})…`, 45);
    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 8192,
        thinking: { type: "adaptive" } as any,
        output_config: {
          effort: EFFORT,
          format: { type: "json_schema", schema: bmcJsonSchema }
        } as any,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" }
          }
        ] as any,
        messages: [
          {
            role: "user",
            content: userPrompt(input.company, {
              country: input.country,
              sector: input.sector,
              website: input.website,
              language: input.language ?? "fr"
            })
          }
        ]
      } as any);

      stream.on("text", (delta) => {
        if (delta.length > 0) emitStep("generate", "Rédaction du canvas…", 58);
      });

      const final = await stream.finalMessage();
      const text = extractText(final);
      emitStep("validate", "Validation du schéma et cohérence…", 80);
      bmc = parseAndRepair(text);
    } catch (err: any) {
      emitStep(
        "error",
        `Appel Anthropic échoué — bascule sur mode mock: ${err?.message ?? err}`,
        60
      );
      mode = "mock";
      bmc = mockBmc(input.company);
    }
  } else {
    emitStep(
      "generate",
      "Mode mock (aucune clé ANTHROPIC_API_KEY détectée) — génération synthétique…",
      55
    );
    await sleep(400);
    bmc = mockBmc(input.company);
    emitStep("validate", "Validation du schéma…", 78);
  }

  // Rank sources, recompute coherence warnings.
  bmc.sources = rankSources(bmc.sources as any) as any;
  const warnings = coherenceWarnings(bmc);
  emitStep("analyze", "Synthèse stratégique, SWOT, innovation lens…", 90, {
    warnings
  });

  const analysis: BmcAnalysis = {
    id: shortId(),
    company: bmc.company,
    blocks: bmc.blocks as BmcAnalysis["blocks"],
    sources: bmc.sources as BmcAnalysis["sources"],
    analysis: {
      ...bmc.analysis,
      coherence: {
        ...bmc.analysis.coherence,
        notes: [...bmc.analysis.coherence.notes, ...warnings]
      }
    },
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: mode === "live" ? MODEL : "mock-v1",
      mode,
      durationMs: Date.now() - started,
      version: 1
    }
  };

  emitStep("done", "Analyse terminée", 100);
  return analysis;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
